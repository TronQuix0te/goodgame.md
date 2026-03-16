import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { initDatabase, getDatabase } from './db/database';
import apiRoutes from './api/routes';
import championRoutes from './champion';
import { startReleaseWatcher } from './services/season-service';

// Initialize database
initDatabase();

// Start watching for new Anthropic releases (checks on boot + daily)
startReleaseWatcher();

const app = express();

app.use(cors());
app.use(express.json());

// Simple rate limiting for API writes
const rateLimits = new Map<string, { count: number; reset: number }>();
setInterval(() => { rateLimits.clear(); }, 60_000);

function rateLimit(limit: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = rateLimits.get(key) || { count: 0, reset: now + 60_000 };
    if (now > entry.reset) { entry.count = 0; entry.reset = now + 60_000; }
    entry.count++;
    rateLimits.set(key, entry);
    if (entry.count > limit) {
      return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
    }
    next();
  };
}

// Rate limit API writes (submissions, votes, forks)
app.use('/api/builds', (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE') {
    return rateLimit(30)(req, res, next);
  }
  next();
});

// Trust proxy for correct IP behind nginx
app.set('trust proxy', true);

// Champion endpoint — MUST be before static files
app.use(championRoutes);

// API routes
app.use('/api', apiRoutes);

// Read the index.html template for SEO injection
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
const indexHtml = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf8');

function injectMeta(title: string, description: string, url: string): string {
  const escapedTitle = title.replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const escapedDesc = description.replace(/"/g, '&quot;').replace(/</g, '&lt;');

  const metaTags = `
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDesc}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDesc}" />
    <meta property="og:url" content="https://goodgame.md${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="goodgame.md" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDesc}" />`;

  return indexHtml.replace(/<title>[^<]*<\/title>/, metaTags);
}

// ── SEO routes (before static files) ──

// Home
app.get('/', (_req, res) => {
  res.send(injectMeta(
    'goodgame.md — Behavioral Files for Claude Code',
    'Community platform for sharing, grading, and discovering behavioral disposition files for Claude Code. Pull any build with curl.',
    '/'
  ));
});

// Blog listing
app.get('/blog', (_req, res) => {
  res.send(injectMeta(
    'Blog — goodgame.md',
    'Guides, deep dives, and thinking on behavioral AI configuration for Claude Code.',
    '/blog'
  ));
});

// Blog article
app.get('/blog/:slug', (req, res) => {
  const article = getDatabase().prepare(
    'SELECT title, description, slug FROM articles WHERE slug = ?'
  ).get(req.params.slug) as { title: string; description: string; slug: string } | undefined;

  if (article) {
    res.send(injectMeta(
      `${article.title} — goodgame.md`,
      article.description,
      `/blog/${article.slug}`
    ));
  } else {
    res.send(injectMeta('Article Not Found — goodgame.md', 'This article could not be found.', `/blog/${req.params.slug}`));
  }
});

// Build detail — by name
app.get('/build/:name', (req, res) => {
  const build = getDatabase().prepare(
    'SELECT name, title, description FROM builds WHERE name = ?'
  ).get(req.params.name) as { name: string; title: string; description: string } | undefined;

  if (build) {
    res.send(injectMeta(
      `@${build.name} — goodgame.md`,
      build.title + (build.description ? `. ${build.description}` : ''),
      `/build/${build.name}`
    ));
  } else {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

// User profile
app.get('/user/:username', (req, res) => {
  const user = getDatabase().prepare(
    'SELECT username, display_name FROM users WHERE username = ?'
  ).get(req.params.username) as { username: string; display_name: string } | undefined;

  if (user) {
    res.send(injectMeta(
      `@${user.username} — goodgame.md`,
      `${user.display_name}'s behavioral builds on goodgame.md`,
      `/user/${user.username}`
    ));
  } else {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

// Compare
app.get('/compare', (_req, res) => {
  res.send(injectMeta(
    'Compare Builds — goodgame.md',
    'Side-by-side comparison of behavioral disposition files for Claude Code.',
    '/compare'
  ));
});

// Search
app.get('/search', (_req, res) => {
  res.send(injectMeta(
    'Search — goodgame.md',
    'Search behavioral disposition files for Claude Code.',
    '/search'
  ));
});

// Quiz
app.get('/quiz', (_req, res) => {
  res.send(injectMeta(
    'Archetype Quiz — goodgame.md',
    'Find your Claude Code archetype. 5 questions to discover how you want AI to behave.',
    '/quiz'
  ));
});

// Archetype detail
app.get('/archetype/:id', (req, res) => {
  const id = req.params.id.toUpperCase();
  const names: Record<string, string> = {
    GOFAST: 'GOFAST', CONTROL: 'CONTROL', MIDRANGE: 'MIDRANGE', TEMPO: 'TEMPO', COMBO: 'COMBO'
  };
  if (names[id]) {
    res.send(injectMeta(
      `${names[id]} Archetype — goodgame.md`,
      `Deep dive into the ${names[id]} behavioral archetype for Claude Code.`,
      `/archetype/${req.params.id}`
    ));
  } else {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

// RSS Feed
app.get('/feed.xml', (_req, res) => {
  const builds = getDatabase().prepare(`
    SELECT b.name, b.title, b.description, b.created_at, u.username as author, a.name as archetype_name
    FROM builds b
    JOIN users u ON b.user_id = u.id
    JOIN archetypes a ON b.archetype_id = a.id
    WHERE b.is_published = 1
    ORDER BY b.created_at DESC
    LIMIT 20
  `).all() as any[];

  const items = builds.map(b => `    <item>
      <title>@${b.name} — ${b.archetype_name}</title>
      <link>https://goodgame.md/build/${b.name}</link>
      <description>${(b.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}${b.description ? '. ' + b.description.replace(/&/g, '&amp;').replace(/</g, '&lt;') : ''}</description>
      <author>${b.author}</author>
      <pubDate>${new Date(b.created_at + 'Z').toUTCString()}</pubDate>
      <guid>https://goodgame.md/build/${b.name}</guid>
    </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>goodgame.md — Behavioral Files for Claude Code</title>
    <link>https://goodgame.md</link>
    <description>Latest behavioral disposition files for Claude Code</description>
    <language>en</language>
${items}
  </channel>
</rss>`;

  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

// ── Static files + SPA fallback ──
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`goodgame.md running on port ${config.port}`);
});
