import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const articles = getDatabase().prepare(
    'SELECT id, slug, title, description, tags, published_at FROM articles ORDER BY published_at DESC'
  ).all();
  res.json({ articles });
});

router.get('/:slug', (req: Request, res: Response) => {
  const article = getDatabase().prepare(
    'SELECT * FROM articles WHERE slug = ?'
  ).get(req.params.slug);

  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }

  res.json(article);
});

export default router;
