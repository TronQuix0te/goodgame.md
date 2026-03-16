import { Router, Request, Response } from 'express';
import authRoutes from './auth-routes';
import buildRoutes from './build-routes';
import articleRoutes from './article-routes';
import adminRoutes from './admin-routes';
import { archetypeModel, seasonModel, buildModel, userModel } from '../db/models';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.use('/auth', authRoutes);
router.use('/builds', buildRoutes);
router.use('/articles', articleRoutes);
router.use('/admin', adminRoutes);

router.get('/users/me/builds', requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  const builds = buildModel.findByUserId(user.id);
  res.json(builds);
});

// Public user profile
router.get('/users/:username', (req: Request, res: Response) => {
  const user = userModel.findByUsername(req.params.username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const builds = buildModel.findByUserId(user.id).filter((b: any) => b.is_published);
  res.json({
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    builds,
  });
});

router.get('/archetypes', (_req: Request, res: Response) => {
  res.json({ archetypes: archetypeModel.listAll() });
});

router.get('/seasons', (_req: Request, res: Response) => {
  res.json({ seasons: seasonModel.listAll() });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
