import { Router, Request, Response } from 'express';
import { seasonModel, buildModel } from '../db/models';
import { getDatabase } from '../db/database';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// List all seasons with stats
router.get('/seasons', requireAdmin, (_req: Request, res: Response) => {
  const seasons = seasonModel.listAll();
  res.json({ seasons });
});

// Create new season (auto-ends current one)
router.post('/seasons', requireAdmin, (req: Request, res: Response) => {
  const { name, model_tag } = req.body;

  if (!name || !model_tag) {
    return res.status(400).json({ error: 'name and model_tag are required' });
  }

  // Crown champions for the current season before ending it
  const currentSeason = seasonModel.findActive();
  if (currentSeason) {
    buildModel.crownChampions(currentSeason.id);
  }

  const newSeasonId = seasonModel.create(name, model_tag);
  const season = seasonModel.findById(newSeasonId);
  res.status(201).json(season);
});

// End a specific season
router.post('/seasons/:id/end', requireAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const season = seasonModel.findById(id);

  if (!season) {
    return res.status(404).json({ error: 'Season not found' });
  }
  if (!season.is_active) {
    return res.status(400).json({ error: 'Season is already ended' });
  }

  // Crown champions before ending
  buildModel.crownChampions(id);
  seasonModel.endSeason(id);

  res.json({ success: true, message: `Season "${season.name}" ended` });
});

// ── Articles ──

// Create article
router.post('/articles', requireAdmin, (req: Request, res: Response) => {
  const { slug, title, description, content, tags } = req.body;
  if (!slug || !title || !content) {
    return res.status(400).json({ error: 'slug, title, and content are required' });
  }

  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  try {
    getDatabase().prepare(
      'INSERT INTO articles (slug, title, description, content, tags) VALUES (?, ?, ?, ?, ?)'
    ).run(cleanSlug, title, description || '', content, tags || '');
    const article = getDatabase().prepare('SELECT * FROM articles WHERE slug = ?').get(cleanSlug);
    res.status(201).json(article);
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    throw err;
  }
});

// Update article
router.patch('/articles/:slug', requireAdmin, (req: Request, res: Response) => {
  const { title, description, content, tags } = req.body;
  const article = getDatabase().prepare('SELECT * FROM articles WHERE slug = ?').get(req.params.slug);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  const sets: string[] = [];
  const params: any[] = [];
  if (title !== undefined) { sets.push('title = ?'); params.push(title); }
  if (description !== undefined) { sets.push('description = ?'); params.push(description); }
  if (content !== undefined) { sets.push('content = ?'); params.push(content); }
  if (tags !== undefined) { sets.push('tags = ?'); params.push(tags); }
  if (sets.length === 0) return res.json(article);

  params.push(req.params.slug);
  getDatabase().prepare(`UPDATE articles SET ${sets.join(', ')} WHERE slug = ?`).run(...params);
  const updated = getDatabase().prepare('SELECT * FROM articles WHERE slug = ?').get(req.params.slug);
  res.json(updated);
});

// Delete article
router.delete('/articles/:slug', requireAdmin, (req: Request, res: Response) => {
  const result = getDatabase().prepare('DELETE FROM articles WHERE slug = ?').run(req.params.slug);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json({ success: true });
});

export default router;
