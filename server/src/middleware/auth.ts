import { Request, Response, NextFunction } from 'express';
import { userModel } from '../db/models';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_admin: boolean;
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = userModel.findByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  (req as AuthRequest).user = {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    is_admin: !!user.is_admin,
  };
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const user = userModel.findByToken(token);
    if (user) {
      (req as AuthRequest).user = {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        is_admin: !!user.is_admin,
      };
    }
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = userModel.findByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (!user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  (req as AuthRequest).user = {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    is_admin: true,
  };
  next();
}
