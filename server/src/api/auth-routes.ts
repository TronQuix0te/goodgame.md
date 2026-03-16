import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { userModel } from '../db/models';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { config } from '../config';

const router = Router();

// In-memory CSRF state store with TTL
const pendingStates = new Map<string, number>();

// Cleanup expired states periodically
setInterval(() => {
  const now = Date.now();
  for (const [state, expires] of pendingStates) {
    if (now > expires) pendingStates.delete(state);
  }
}, 60_000);

// GitHub OAuth: redirect to GitHub
router.get('/github', (_req: Request, res: Response) => {
  if (!config.github.clientId) {
    return res.status(500).json({ error: 'GitHub OAuth not configured' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, Date.now() + 10 * 60_000); // 10 min TTL

  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl,
    scope: 'read:user',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// GitHub OAuth: callback
router.get('/github/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    return res.redirect(`${config.frontendUrl}/login?error=missing_params`);
  }

  // Validate CSRF state
  if (!pendingStates.has(state)) {
    return res.redirect(`${config.frontendUrl}/login?error=invalid_state`);
  }
  pendingStates.delete(state);

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: config.github.callbackUrl,
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      console.error('GitHub token exchange failed:', tokenData);
      return res.redirect(`${config.frontendUrl}/login?error=token_exchange`);
    }

    // Fetch GitHub user profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/json',
      },
    });

    const ghUser = await userRes.json() as {
      id: number;
      login: string;
      name: string | null;
      avatar_url: string;
    };

    const githubId = String(ghUser.id);

    // Find or create user
    let user = userModel.findByGithubId(githubId);

    if (user) {
      // Update profile on login
      userModel.updateGithubProfile(user.id, {
        display_name: ghUser.name || ghUser.login,
        avatar_url: ghUser.avatar_url,
      });
    } else {
      // Check if username is taken (by a placeholder user)
      const existingUsername = userModel.findByUsername(ghUser.login.toLowerCase());
      const username = existingUsername
        ? `${ghUser.login.toLowerCase()}-${githubId.slice(-4)}`
        : ghUser.login.toLowerCase();

      const result = userModel.create(
        username,
        ghUser.name || ghUser.login,
        githubId,
        ghUser.avatar_url
      );
      user = userModel.findById(result.id);
    }

    // Auto-promote admins by GitHub ID
    if (config.adminGithubIds.includes(githubId)) {
      userModel.setAdmin(user.id, true);
    }

    // Redirect to frontend with token
    res.redirect(`${config.frontendUrl}/auth/callback?token=${user.token}`);

  } catch (err) {
    console.error('GitHub OAuth error:', err);
    res.redirect(`${config.frontendUrl}/login?error=oauth_failed`);
  }
});

// Keep legacy register/login for now (Phase 1 fallback)
router.post('/register', (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  const slug = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (slug.length < 2 || slug.length > 30) {
    return res.status(400).json({ error: 'Username must be 2-30 characters (alphanumeric, hyphens, underscores)' });
  }

  const existing = userModel.findByUsername(slug);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const { id, token } = userModel.create(slug, username);
  res.json({ id, username: slug, token });
});

router.post('/login', (req: Request, res: Response) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = userModel.findByUsername(username.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ id: user.id, username: user.username, token: user.token });
});

// Get current user
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as AuthRequest).user!;
  res.json(user);
});

export default router;
