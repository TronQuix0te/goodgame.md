import { Router, Request, Response } from 'express';
import { buildModel, buildVersionModel, scoreModel, voteModel, seasonModel, commentModel, notificationModel, pullLogModel } from '../db/models';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { judgeuild } from '../judge';
import { config } from '../config';
import { ensureCurrentSeason } from '../services/season-service';

const router = Router();

// Resolve build by numeric ID or slug name
function resolveBuild(param: string) {
  return /^\d+$/.test(param) ? buildModel.findById(parseInt(param)) : buildModel.findByName(param);
}

// Leaderboard
router.get('/leaderboard', (req: Request, res: Response) => {
  const archetype = req.query.archetype as string | undefined;
  const seasonId = req.query.season_id ? parseInt(req.query.season_id as string) : undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;

  const builds = buildModel.listLeaderboard({ archetype, seasonId, limit, offset });
  res.json({ builds });
});

// Trending builds (most pulls in last 7 days)
router.get('/trending', (req: Request, res: Response) => {
  const days = Math.min(parseInt(req.query.days as string) || 7, 30);
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
  const builds = buildModel.listTrending(days, limit);
  res.json({ builds });
});

// Build of the week
router.get('/featured', (_req: Request, res: Response) => {
  const build = buildModel.getBuildOfTheWeek();
  res.json({ build: build || null });
});

// Search builds
router.get('/search', (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || q.length < 2) {
    return res.json({ builds: [] });
  }
  const builds = buildModel.search(q);
  res.json({ builds });
});

// Compare two builds
router.get('/compare', (req: Request, res: Response) => {
  const a = req.query.a as string;
  const b = req.query.b as string;
  if (!a || !b) {
    return res.status(400).json({ error: 'a and b params required' });
  }

  const buildA = resolveBuild(a);
  const buildB = resolveBuild(b);
  if (!buildA || !buildB) {
    return res.status(404).json({ error: 'One or both builds not found' });
  }

  const versionA = buildVersionModel.findByBuildIdAndVersion(buildA.id, buildA.current_version);
  const versionB = buildVersionModel.findByBuildIdAndVersion(buildB.id, buildB.current_version);
  const scoreA = versionA ? scoreModel.findByBuildVersionId(versionA.id) : null;
  const scoreB = versionB ? scoreModel.findByBuildVersionId(versionB.id) : null;

  res.json({
    a: { ...buildA, content: versionA?.content || '', score: scoreA },
    b: { ...buildB, content: versionB?.content || '', score: scoreB },
  });
});

// Get champions
router.get('/champions', (req: Request, res: Response) => {
  const seasonId = req.query.season_id ? parseInt(req.query.season_id as string) : undefined;
  const champions = buildModel.getChampions(seasonId);
  res.json({ champions });
});

// Get build detail — supports both ID and name
router.get('/:idOrName', optionalAuth, (req: Request, res: Response) => {
  const build = resolveBuild(req.params.idOrName);
  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }

  const versions = buildVersionModel.listByBuildId(build.id);
  const currentVersion = buildVersionModel.findByBuildIdAndVersion(build.id, build.current_version);
  const score = currentVersion ? scoreModel.findByBuildVersionId(currentVersion.id) : null;

  const user = (req as AuthRequest).user;
  const hasVoted = user ? voteModel.hasVoted(user.id, build.id) : false;
  const isOwner = user ? user.id === build.user_id : false;

  // Fork info
  const forkCount = buildModel.getForkCount(build.id);
  const forkedFrom = build.forked_from ? buildModel.findById(build.forked_from) : null;
  const related = buildModel.getRelated(build.id, build.archetype_id, 5);

  res.json({
    ...build,
    content: currentVersion?.content || '',
    versions,
    score,
    has_voted: hasVoted,
    is_owner: isOwner,
    fork_count: forkCount,
    forked_from_build: forkedFrom ? { id: forkedFrom.id, name: forkedFrom.name, author: forkedFrom.author } : null,
    related,
  });
});

// Submit new build
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const { name, title, description, archetype_id, content } = req.body;

  // Validate
  if (!name || !title || !content || !archetype_id) {
    return res.status(400).json({ error: 'name, title, content, and archetype_id are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (slug.length < 2 || slug.length > 40) {
    return res.status(400).json({ error: 'Name must be 2-40 characters' });
  }

  // Check name uniqueness
  const existing = buildModel.findByName(slug);
  if (existing) {
    return res.status(409).json({ error: `Name @${slug} is already taken` });
  }

  // Get or auto-create season for current judge model
  const season = ensureCurrentSeason();
  if (!season) {
    return res.status(500).json({ error: 'No active season' });
  }

  // Create build + version
  const buildId = buildModel.create(user.id, slug, title, description || '', archetype_id, season.id);
  const versionId = buildVersionModel.create(buildId, 1, content);

  // Score with AI judge
  let composite = 0;
  try {
    const judgeResult = await judgeuild(content, archetype_id);
    composite = scoreModel.create(versionId, judgeResult, config.anthropic.judgeModel, judgeResult.reasoning);
  } catch (err) {
    console.error('Judge failed, using fallback:', err);
    const mockScores = scoreModel.generateMockScores(archetype_id);
    composite = scoreModel.create(versionId, mockScores, 'mock-fallback');
  }

  // Recalculate champions
  buildModel.crownChampions(season.id);

  const build = buildModel.findById(buildId);
  res.status(201).json({ ...build, gg_score: composite });
});

// Submit new version for existing build
router.post('/:idOrName/version', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  const build = resolveBuild(req.params.idOrName);
  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }
  if (build.user_id !== user.id) {
    return res.status(403).json({ error: 'Not your build' });
  }

  // Check season is still active
  const season = seasonModel.findById(build.season_id);
  if (season && !season.is_active) {
    return res.status(400).json({ error: 'Cannot update builds in an ended season' });
  }

  const newVersion = build.current_version + 1;
  const versionId = buildVersionModel.create(build.id, newVersion, content);
  buildModel.updateCurrentVersion(build.id, newVersion);

  // Re-score with AI judge
  try {
    const judgeResult = await judgeuild(content, build.archetype_id);
    scoreModel.create(versionId, judgeResult, config.anthropic.judgeModel, judgeResult.reasoning);
  } catch (err) {
    console.error('Judge failed on re-score, using fallback:', err);
    const mockScores = scoreModel.generateMockScores(build.archetype_id);
    scoreModel.create(versionId, mockScores, 'mock-fallback');
  }

  // Recalculate champions
  buildModel.crownChampions(build.season_id);

  res.json({ version: newVersion, version_id: versionId });
});

// Update build metadata
router.patch('/:idOrName', requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const { title, description, is_published } = req.body;

  const build = resolveBuild(req.params.idOrName);
  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }
  if (build.user_id !== user.id) {
    return res.status(403).json({ error: 'Not your build' });
  }

  buildModel.updateMetadata(build.id, {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(is_published !== undefined && { is_published: is_published ? 1 : 0 }),
  });

  // If unpublished, recalculate champions
  if (is_published !== undefined) {
    buildModel.crownChampions(build.season_id);
  }

  const updated = buildModel.findById(build.id);
  res.json(updated);
});

// Delete build
router.delete('/:idOrName', requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;

  const build = resolveBuild(req.params.idOrName);
  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }
  if (build.user_id !== user.id) {
    return res.status(403).json({ error: 'Not your build' });
  }

  const seasonId = build.season_id;
  buildModel.delete(build.id);
  buildModel.crownChampions(seasonId);

  res.json({ success: true });
});

// Fork a build
router.post('/:idOrName/fork', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const { name, title } = req.body;

  const original = resolveBuild(req.params.idOrName);
  if (!original) {
    return res.status(404).json({ error: 'Build not found' });
  }

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (slug.length < 2 || slug.length > 40) {
    return res.status(400).json({ error: 'Name must be 2-40 characters' });
  }

  const existing = buildModel.findByName(slug);
  if (existing) {
    return res.status(409).json({ error: `Name @${slug} is already taken` });
  }

  const season = ensureCurrentSeason();
  if (!season) {
    return res.status(500).json({ error: 'No active season' });
  }

  // Get original content
  const originalVersion = buildVersionModel.findByBuildIdAndVersion(original.id, original.current_version);
  if (!originalVersion) {
    return res.status(404).json({ error: 'Original build has no content' });
  }

  const buildId = buildModel.create(
    user.id, slug,
    title || `Fork of @${original.name}`,
    `Forked from @${original.name} by ${original.author}`,
    original.archetype_id, season.id, original.id
  );
  const versionId = buildVersionModel.create(buildId, 1, originalVersion.content);

  // Score
  let composite = 0;
  try {
    const judgeResult = await judgeuild(originalVersion.content, original.archetype_id);
    composite = scoreModel.create(versionId, judgeResult, config.anthropic.judgeModel, judgeResult.reasoning);
  } catch (err) {
    console.error('Judge failed on fork:', err);
    const mockScores = scoreModel.generateMockScores(original.archetype_id);
    composite = scoreModel.create(versionId, mockScores, 'mock-fallback');
  }

  buildModel.crownChampions(season.id);

  // Notify original author
  if (original.user_id !== user.id) {
    notificationModel.create(
      original.user_id, 'fork',
      `@${user.username} forked your build @${original.name}`,
      `/build/${slug}`
    );
  }

  const build = buildModel.findById(buildId);
  res.status(201).json({ ...build, gg_score: composite });
});

// Re-judge build (owner only)
router.post('/:idOrName/rejudge', requireAuth, async (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;

  const build = resolveBuild(req.params.idOrName);
  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }
  if (build.user_id !== user.id) {
    return res.status(403).json({ error: 'Not your build' });
  }

  const currentVersion = buildVersionModel.findByBuildIdAndVersion(build.id, build.current_version);
  if (!currentVersion) {
    return res.status(404).json({ error: 'No version found' });
  }

  try {
    const judgeResult = await judgeuild(currentVersion.content, build.archetype_id);
    const composite = scoreModel.create(currentVersion.id, judgeResult, config.anthropic.judgeModel, judgeResult.reasoning);
    buildModel.crownChampions(build.season_id);
    res.json({ composite, score: judgeResult });
  } catch (err) {
    console.error('Re-judge failed:', err);
    res.status(500).json({ error: 'Judge failed' });
  }
});

// Toggle vote
router.post('/:idOrName/vote', requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;

  const build = resolveBuild(req.params.idOrName);
  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }

  const voted = voteModel.toggle(user.id, build.id);

  // Notify build owner on upvote
  if (voted && build.user_id !== user.id) {
    notificationModel.create(
      build.user_id, 'vote',
      `@${user.username} voted for your build @${build.name}`,
      `/build/${build.name}`
    );
  }

  const updated = buildModel.findById(build.id);
  res.json({ voted, vote_count: updated?.vote_count || 0 });
});

// Track copy
router.post('/:idOrName/copy', (req: Request, res: Response) => {
  const build = resolveBuild(req.params.idOrName);
  if (build) buildModel.incrementCopyCount(build.id);
  res.json({ success: true });
});

// Version diff
router.get('/:idOrName/diff', (req: Request, res: Response) => {
  const build = resolveBuild(req.params.idOrName);
  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }

  const v1 = parseInt(req.query.v1 as string) || build.current_version - 1;
  const v2 = parseInt(req.query.v2 as string) || build.current_version;

  const version1 = buildVersionModel.findByBuildIdAndVersion(build.id, v1);
  const version2 = buildVersionModel.findByBuildIdAndVersion(build.id, v2);

  if (!version1 || !version2) {
    return res.status(404).json({ error: 'One or both versions not found' });
  }

  // Simple line-by-line diff
  const lines1 = version1.content.split('\n');
  const lines2 = version2.content.split('\n');
  const maxLen = Math.max(lines1.length, lines2.length);
  const diff: { type: 'same' | 'added' | 'removed' | 'changed'; line: number; old?: string; new?: string; content?: string }[] = [];

  for (let i = 0; i < maxLen; i++) {
    const old = lines1[i];
    const cur = lines2[i];
    if (old === cur) {
      diff.push({ type: 'same', line: i + 1, content: cur });
    } else if (old === undefined) {
      diff.push({ type: 'added', line: i + 1, new: cur });
    } else if (cur === undefined) {
      diff.push({ type: 'removed', line: i + 1, old });
    } else {
      diff.push({ type: 'changed', line: i + 1, old, new: cur });
    }
  }

  res.json({
    v1: { version: v1, line_count: version1.line_count, word_count: version1.word_count },
    v2: { version: v2, line_count: version2.line_count, word_count: version2.word_count },
    diff,
  });
});

// SVG badge
router.get('/:idOrName/badge', (req: Request, res: Response) => {
  const build = resolveBuild(req.params.idOrName);
  if (!build) {
    return res.status(404).type('image/svg+xml').send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20"><rect width="120" height="20" rx="3" fill="#333"/><text x="60" y="14" text-anchor="middle" fill="#fff" font-family="monospace" font-size="11">not found</text></svg>`
    );
  }

  const currentVersion = buildVersionModel.findByBuildIdAndVersion(build.id, build.current_version);
  const score = currentVersion ? scoreModel.findByBuildVersionId(currentVersion.id) : null;
  const scoreText = score ? score.composite.toFixed(1) : '—';
  const labelWidth = 70;
  const valueWidth = 50;
  const totalWidth = labelWidth + valueWidth;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <rect width="${labelWidth}" height="20" rx="3" fill="#333"/>
  <rect x="${labelWidth}" width="${valueWidth}" height="20" rx="3" fill="#1a1a1a"/>
  <rect x="${labelWidth}" width="3" height="20" fill="#333"/>
  <text x="${labelWidth / 2}" y="14" text-anchor="middle" fill="#ccc" font-family="monospace" font-size="11">gg.md</text>
  <text x="${labelWidth + valueWidth / 2}" y="14" text-anchor="middle" fill="#ffaa20" font-family="monospace" font-size="11" font-weight="bold">${scoreText}</text>
</svg>`;

  res.set('Content-Type', 'image/svg+xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(svg);
});

// Pull analytics
router.get('/:idOrName/analytics', requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const build = resolveBuild(req.params.idOrName);
  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }
  if (build.user_id !== user.id) {
    return res.status(403).json({ error: 'Not your build' });
  }

  const days = Math.min(parseInt(req.query.days as string) || 30, 90);
  const dailyPulls = pullLogModel.getDailyPulls(build.id, days);
  res.json({ daily_pulls: dailyPulls, total: build.pull_count });
});

// Comments
router.get('/:idOrName/comments', (req: Request, res: Response) => {
  const build = resolveBuild(req.params.idOrName);
  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }
  const comments = commentModel.listByBuildId(build.id);
  res.json({ comments });
});

router.post('/:idOrName/comments', requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length < 1) {
    return res.status(400).json({ error: 'Content is required' });
  }
  if (content.length > 1000) {
    return res.status(400).json({ error: 'Comment too long (max 1000 chars)' });
  }

  const build = resolveBuild(req.params.idOrName);
  if (!build) {
    return res.status(404).json({ error: 'Build not found' });
  }

  const id = commentModel.create(build.id, user.id, content.trim());

  // Notify build owner
  if (build.user_id !== user.id) {
    notificationModel.create(
      build.user_id, 'comment',
      `@${user.username} commented on @${build.name}`,
      `/build/${build.name}`
    );
  }

  const comments = commentModel.listByBuildId(build.id);
  res.status(201).json({ comments });
});

router.delete('/:idOrName/comments/:commentId', requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const commentId = parseInt(req.params.commentId);
  const result = commentModel.delete(commentId, user.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Comment not found or not yours' });
  }
  res.json({ success: true });
});

export default router;
