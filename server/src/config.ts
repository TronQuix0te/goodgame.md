import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3002'),
  db: {
    path: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'goodgame.db'),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'goodgame-dev-secret-change-me',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    judgeModel: process.env.JUDGE_MODEL || 'claude-sonnet-4-20250514',
    currentRelease: process.env.CURRENT_RELEASE || 'claude-opus-4-6',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackUrl: process.env.GITHUB_CALLBACK_URL || 'https://goodgame.md/api/auth/github/callback',
  },
  adminGithubIds: (process.env.ADMIN_GITHUB_IDS || '').split(',').filter(Boolean),
  frontendUrl: process.env.FRONTEND_URL || 'https://goodgame.md',
};
