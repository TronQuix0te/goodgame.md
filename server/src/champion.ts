import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { buildModel, buildVersionModel, pullLogModel, userModel } from './db/models';

const router = Router();

const ARCHETYPES = new Set(['gofast', 'control', 'midrange', 'tempo', 'combo']);

/**
 * Resolve a build from the URL pattern.
 * Supports:
 *   /@name              — build by slug
 *   /@name@version      — build by slug + version
 *   /@user/archetype    — user's build filtered by archetype
 */
function resolveBuild(segments: string[]): { build: any; versionParam?: string } | null {
  if (segments.length === 1) {
    const seg = segments[0];
    // Check for @name@version pattern
    const atMatch = seg.match(/^([a-zA-Z0-9_-]+)@(\d+(?:\.\d+(?:\.\d+)?)?)$/);
    if (atMatch) {
      const build = buildModel.findByName(atMatch[1]);
      return build ? { build, versionParam: atMatch[2] } : null;
    }
    // Plain @name — could be a build slug or a user with archetype coming
    const build = buildModel.findByName(seg);
    return build ? { build } : null;
  }

  if (segments.length === 2) {
    const [userOrTeam, archetype] = segments;
    // /@user/archetype
    if (ARCHETYPES.has(archetype.toLowerCase())) {
      const build = buildModel.findByUserAndArchetype(
        userOrTeam.toLowerCase(),
        archetype.toUpperCase()
      );
      return build ? { build } : null;
    }
    return null;
  }

  // Future: /@team/member/archetype (3 segments)
  return null;
}

// Match /@anything paths (1-3 segments after @)
router.get(/^\/@([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*)$/, (req: Request, res: Response) => {
  const fullPath = req.params[0];
  const segments = fullPath.split('/');

  const result = resolveBuild(segments);

  if (!result) {
    const accepts = req.headers.accept || '';
    if (accepts.includes('text/html')) {
      return res.status(404).send(
        `<html><body style="background:#0a0a0a;color:#ff2020;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h1>@${fullPath} not found</h1></body></html>`
      );
    }
    return res.status(404).type('text/plain').send(`@${fullPath} not found\n`);
  }

  const { build, versionParam } = result;

  // Get the right version
  let version: any;
  if (versionParam) {
    const versionNum = parseInt(versionParam.split('.')[0]);
    version = buildVersionModel.findByBuildIdAndVersion(build.id, versionNum);
    if (!version) {
      return res.status(404).type('text/plain').send(`@${fullPath} version ${versionParam} not found\n`);
    }
  } else {
    version = buildVersionModel.findLatestByBuildId(build.id);
    if (!version) {
      return res.status(404).type('text/plain').send(`@${fullPath} has no versions\n`);
    }
  }

  // Check if browser — redirect to web UI
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const accepts = req.headers.accept || '';
  const isBrowser = accepts.includes('text/html')
    && !userAgent.includes('curl')
    && !userAgent.includes('wget')
    && !userAgent.includes('httpie');

  if (isBrowser) {
    return res.redirect(`/build/${build.name}`);
  }

  // Log the pull (hash IP for privacy)
  const ipRaw = req.ip || req.socket.remoteAddress || 'unknown';
  const ipHash = crypto.createHash('sha256').update(ipRaw + 'goodgame-salt').digest('hex').slice(0, 16);
  pullLogModel.log(build.id, ipHash, userAgent.slice(0, 200));
  buildModel.incrementPullCount(build.id);

  // Return raw markdown
  const displayName = segments.length > 1 ? `@${segments.join('/')}` : `@${build.name}`;
  res.set('Content-Type', 'text/markdown; charset=utf-8');
  res.set('X-Build', `${displayName}@${version.version}`);
  res.set('X-GG-Score', build.gg_score?.toString() || '0');
  res.set('Cache-Control', 'public, max-age=300');
  res.send(version.content);
});

export default router;
