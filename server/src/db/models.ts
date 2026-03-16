import crypto from 'crypto';
import { getDatabase } from './database';

// ── Users ──

export const userModel = {
  findByToken(token: string) {
    return getDatabase().prepare('SELECT * FROM users WHERE token = ?').get(token) as any | undefined;
  },

  findById(id: number) {
    return getDatabase().prepare('SELECT * FROM users WHERE id = ?').get(id) as any | undefined;
  },

  findByUsername(username: string) {
    return getDatabase().prepare('SELECT * FROM users WHERE username = ?').get(username) as any | undefined;
  },

  create(username: string, displayName?: string, githubId?: string, avatarUrl?: string) {
    const token = crypto.randomUUID();
    const result = getDatabase().prepare(
      'INSERT INTO users (username, display_name, github_id, avatar_url, token) VALUES (?, ?, ?, ?, ?)'
    ).run(username, displayName || username, githubId || null, avatarUrl || null, token);
    return { id: result.lastInsertRowid as number, token };
  },

  findByGithubId(githubId: string) {
    return getDatabase().prepare('SELECT * FROM users WHERE github_id = ?').get(githubId) as any | undefined;
  },

  updateGithubProfile(id: number, fields: { display_name?: string; avatar_url?: string; github_id?: string }) {
    const sets: string[] = [];
    const params: any[] = [];
    if (fields.display_name !== undefined) { sets.push('display_name = ?'); params.push(fields.display_name); }
    if (fields.avatar_url !== undefined) { sets.push('avatar_url = ?'); params.push(fields.avatar_url); }
    if (fields.github_id !== undefined) { sets.push('github_id = ?'); params.push(fields.github_id); }
    if (sets.length === 0) return;
    sets.push("updated_at = datetime('now')");
    params.push(id);
    getDatabase().prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  },

  setAdmin(id: number, isAdmin: boolean) {
    getDatabase().prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, id);
  },
};

// ── Archetypes ──

export const archetypeModel = {
  listAll() {
    return getDatabase().prepare('SELECT * FROM archetypes ORDER BY id').all();
  },

  findById(id: string) {
    return getDatabase().prepare('SELECT * FROM archetypes WHERE id = ?').get(id) as any | undefined;
  },
};

// ── Seasons ──

export const seasonModel = {
  listAll() {
    return getDatabase().prepare('SELECT * FROM seasons ORDER BY starts_at DESC').all();
  },

  findActive() {
    return getDatabase().prepare('SELECT * FROM seasons WHERE is_active = 1 LIMIT 1').get() as any | undefined;
  },

  findById(id: number) {
    return getDatabase().prepare('SELECT * FROM seasons WHERE id = ?').get(id) as any | undefined;
  },

  create(name: string, modelTag: string) {
    const db = getDatabase();
    const tx = db.transaction(() => {
      // Deactivate all current seasons
      db.prepare('UPDATE seasons SET is_active = 0, ends_at = datetime(\'now\') WHERE is_active = 1').run();
      // Create new active season
      const result = db.prepare(
        'INSERT INTO seasons (name, model_tag, starts_at, is_active) VALUES (?, ?, datetime(\'now\'), 1)'
      ).run(name, modelTag);
      return result.lastInsertRowid as number;
    });
    return tx();
  },

  endSeason(id: number) {
    const db = getDatabase();
    db.prepare("UPDATE seasons SET is_active = 0, ends_at = datetime('now') WHERE id = ?").run(id);
  },
};

// ── Builds ──

export const buildModel = {
  create(userId: number, name: string, title: string, description: string, archetypeId: string, seasonId: number, forkedFrom?: number) {
    const result = getDatabase().prepare(
      'INSERT INTO builds (user_id, name, title, description, archetype_id, season_id, forked_from) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(userId, name, title, description, archetypeId, seasonId, forkedFrom || null);
    return result.lastInsertRowid as number;
  },

  findById(id: number) {
    return getDatabase().prepare(`
      SELECT b.*, u.username as author, u.avatar_url as author_avatar,
             a.name as archetype_name, a.color as archetype_color
      FROM builds b
      JOIN users u ON b.user_id = u.id
      JOIN archetypes a ON b.archetype_id = a.id
      WHERE b.id = ?
    `).get(id) as any | undefined;
  },

  findByUserAndArchetype(username: string, archetypeId: string) {
    return getDatabase().prepare(`
      SELECT b.*, u.username as author, u.avatar_url as author_avatar,
             a.name as archetype_name, a.color as archetype_color
      FROM builds b
      JOIN users u ON b.user_id = u.id
      JOIN archetypes a ON b.archetype_id = a.id
      WHERE u.username = ? AND b.archetype_id = ? AND b.is_published = 1
      ORDER BY b.updated_at DESC
      LIMIT 1
    `).get(username, archetypeId) as any | undefined;
  },

  findByName(name: string) {
    return getDatabase().prepare(`
      SELECT b.*, u.username as author, u.avatar_url as author_avatar,
             a.name as archetype_name, a.color as archetype_color
      FROM builds b
      JOIN users u ON b.user_id = u.id
      JOIN archetypes a ON b.archetype_id = a.id
      WHERE b.name = ? AND b.is_published = 1
    `).get(name) as any | undefined;
  },

  listLeaderboard(filters: { archetype?: string; seasonId?: number; limit?: number; offset?: number }) {
    const conditions = ['b.is_published = 1'];
    const params: any[] = [];

    if (filters.archetype) {
      conditions.push('b.archetype_id = ?');
      params.push(filters.archetype);
    }
    if (filters.seasonId) {
      conditions.push('b.season_id = ?');
      params.push(filters.seasonId);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    return getDatabase().prepare(`
      SELECT b.*, u.username as author, u.avatar_url as author_avatar,
             a.name as archetype_name, a.color as archetype_color,
             s.composite as gg_score,
             s.archetype_purity, s.consistency, s.token_efficiency,
             s.signal_density, s.clarity
      FROM builds b
      JOIN users u ON b.user_id = u.id
      JOIN archetypes a ON b.archetype_id = a.id
      LEFT JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
      LEFT JOIN scores s ON s.build_version_id = bv.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY COALESCE(s.composite, 0) DESC, b.vote_count DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
  },

  search(query: string, limit: number = 20) {
    const like = `%${query}%`;
    return getDatabase().prepare(`
      SELECT b.*, u.username as author, a.name as archetype_name, a.color as archetype_color,
             s.composite as gg_score
      FROM builds b
      JOIN users u ON b.user_id = u.id
      JOIN archetypes a ON b.archetype_id = a.id
      LEFT JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
      LEFT JOIN scores s ON s.build_version_id = bv.id
      WHERE b.is_published = 1
        AND (b.name LIKE ? OR b.title LIKE ? OR u.username LIKE ? OR b.description LIKE ?)
      ORDER BY COALESCE(s.composite, 0) DESC
      LIMIT ?
    `).all(like, like, like, like, limit);
  },

  findByUserId(userId: number) {
    return getDatabase().prepare(`
      SELECT b.*, a.name as archetype_name, a.color as archetype_color,
             s.composite as gg_score
      FROM builds b
      JOIN archetypes a ON b.archetype_id = a.id
      LEFT JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
      LEFT JOIN scores s ON s.build_version_id = bv.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(userId);
  },

  incrementPullCount(id: number) {
    getDatabase().prepare('UPDATE builds SET pull_count = pull_count + 1 WHERE id = ?').run(id);
  },

  incrementCopyCount(id: number) {
    getDatabase().prepare('UPDATE builds SET copy_count = copy_count + 1 WHERE id = ?').run(id);
  },

  updateVoteCount(id: number) {
    const result = getDatabase().prepare('SELECT COUNT(*) as cnt FROM votes WHERE build_id = ?').get(id) as { cnt: number };
    getDatabase().prepare('UPDATE builds SET vote_count = ? WHERE id = ?').run(result.cnt, id);
  },

  updateCurrentVersion(id: number, version: number) {
    getDatabase().prepare('UPDATE builds SET current_version = ?, updated_at = datetime(\'now\') WHERE id = ?').run(version, id);
  },

  updateMetadata(id: number, fields: { title?: string; description?: string; is_published?: number; tags?: string }) {
    const sets: string[] = [];
    const params: any[] = [];
    if (fields.title !== undefined) { sets.push('title = ?'); params.push(fields.title); }
    if (fields.description !== undefined) { sets.push('description = ?'); params.push(fields.description); }
    if (fields.is_published !== undefined) { sets.push('is_published = ?'); params.push(fields.is_published); }
    if (fields.tags !== undefined) { sets.push('tags = ?'); params.push(fields.tags); }
    if (sets.length === 0) return;
    sets.push("updated_at = datetime('now')");
    params.push(id);
    getDatabase().prepare(`UPDATE builds SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  },

  delete(id: number) {
    const db = getDatabase();
    const tx = db.transaction(() => {
      // Delete scores via build_versions
      const versionIds = db.prepare('SELECT id FROM build_versions WHERE build_id = ?').all(id) as { id: number }[];
      for (const v of versionIds) {
        db.prepare('DELETE FROM scores WHERE build_version_id = ?').run(v.id);
      }
      db.prepare('DELETE FROM build_versions WHERE build_id = ?').run(id);
      db.prepare('DELETE FROM votes WHERE build_id = ?').run(id);
      db.prepare('DELETE FROM pull_log WHERE build_id = ?').run(id);
      db.prepare('DELETE FROM builds WHERE id = ?').run(id);
    });
    tx();
  },

  crownChampions(seasonId: number) {
    const db = getDatabase();
    const archetypes = db.prepare('SELECT id FROM archetypes').all() as { id: string }[];
    const tx = db.transaction(() => {
      // Clear all champions for this season
      db.prepare('UPDATE builds SET is_champion = 0 WHERE season_id = ? AND is_champion = 1').run(seasonId);
      for (const arch of archetypes) {
        const top = db.prepare(`
          SELECT b.id FROM builds b
          JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
          JOIN scores s ON s.build_version_id = bv.id
          WHERE b.season_id = ? AND b.archetype_id = ? AND b.is_published = 1
          ORDER BY s.composite DESC
          LIMIT 1
        `).get(seasonId, arch.id) as { id: number } | undefined;
        if (top) {
          db.prepare('UPDATE builds SET is_champion = 1 WHERE id = ?').run(top.id);
        }
      }
    });
    tx();
  },

  getChampions(seasonId?: number) {
    const condition = seasonId ? 'AND b.season_id = ?' : '';
    const params = seasonId ? [seasonId] : [];
    return getDatabase().prepare(`
      SELECT b.*, u.username as author, a.name as archetype_name, a.color as archetype_color,
             s.composite as gg_score
      FROM builds b
      JOIN users u ON b.user_id = u.id
      JOIN archetypes a ON b.archetype_id = a.id
      LEFT JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
      LEFT JOIN scores s ON s.build_version_id = bv.id
      WHERE b.is_champion = 1 ${condition}
      ORDER BY s.composite DESC
    `).all(...params);
  },

  // Trending: builds with most pulls in the last N days
  listTrending(days: number = 7, limit: number = 10) {
    return getDatabase().prepare(`
      SELECT b.*, u.username as author, a.name as archetype_name, a.color as archetype_color,
             s.composite as gg_score,
             COUNT(pl.id) as recent_pulls
      FROM builds b
      JOIN users u ON b.user_id = u.id
      JOIN archetypes a ON b.archetype_id = a.id
      LEFT JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
      LEFT JOIN scores s ON s.build_version_id = bv.id
      LEFT JOIN pull_log pl ON pl.build_id = b.id AND pl.pulled_at > datetime('now', '-' || ? || ' days')
      WHERE b.is_published = 1
      GROUP BY b.id
      ORDER BY recent_pulls DESC, COALESCE(s.composite, 0) DESC
      LIMIT ?
    `).all(days, limit);
  },

  // Build of the week: composite of score + recent pulls + votes
  getBuildOfTheWeek() {
    return getDatabase().prepare(`
      SELECT b.*, u.username as author, a.name as archetype_name, a.color as archetype_color,
             s.composite as gg_score,
             COUNT(DISTINCT pl.id) as recent_pulls
      FROM builds b
      JOIN users u ON b.user_id = u.id
      JOIN archetypes a ON b.archetype_id = a.id
      LEFT JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
      LEFT JOIN scores s ON s.build_version_id = bv.id
      LEFT JOIN pull_log pl ON pl.build_id = b.id AND pl.pulled_at > datetime('now', '-7 days')
      WHERE b.is_published = 1
      GROUP BY b.id
      ORDER BY (COALESCE(s.composite, 0) * 0.4 + COUNT(DISTINCT pl.id) * 0.3 + b.vote_count * 0.3) DESC
      LIMIT 1
    `).get() as any | undefined;
  },

  // Get forks of a build
  getForks(buildId: number) {
    return getDatabase().prepare(`
      SELECT b.*, u.username as author, a.name as archetype_name, a.color as archetype_color,
             s.composite as gg_score
      FROM builds b
      JOIN users u ON b.user_id = u.id
      JOIN archetypes a ON b.archetype_id = a.id
      LEFT JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
      LEFT JOIN scores s ON s.build_version_id = bv.id
      WHERE b.forked_from = ? AND b.is_published = 1
      ORDER BY s.composite DESC
    `).all(buildId);
  },

  getForkCount(buildId: number) {
    const row = getDatabase().prepare('SELECT COUNT(*) as cnt FROM builds WHERE forked_from = ?').get(buildId) as { cnt: number };
    return row.cnt;
  },

  // Related builds: same archetype, different build, sorted by score proximity
  getRelated(buildId: number, archetypeId: string, limit: number = 5) {
    return getDatabase().prepare(`
      SELECT b.*, u.username as author, a.name as archetype_name, a.color as archetype_color,
             s.composite as gg_score
      FROM builds b
      JOIN users u ON b.user_id = u.id
      JOIN archetypes a ON b.archetype_id = a.id
      LEFT JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
      LEFT JOIN scores s ON s.build_version_id = bv.id
      WHERE b.archetype_id = ? AND b.id != ? AND b.is_published = 1
      ORDER BY COALESCE(s.composite, 0) DESC
      LIMIT ?
    `).all(archetypeId, buildId, limit);
  },
};

// ── Build Versions ──

export const buildVersionModel = {
  create(buildId: number, version: number, content: string) {
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const byteSize = Buffer.byteLength(content, 'utf8');
    const lineCount = content.split('\n').length;
    const wordCount = content.trim().split(/\s+/).length;

    const result = getDatabase().prepare(
      'INSERT INTO build_versions (build_id, version, content, content_hash, byte_size, line_count, word_count) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(buildId, version, content, contentHash, byteSize, lineCount, wordCount);
    return result.lastInsertRowid as number;
  },

  findLatestByBuildId(buildId: number) {
    return getDatabase().prepare(
      'SELECT * FROM build_versions WHERE build_id = ? ORDER BY version DESC LIMIT 1'
    ).get(buildId) as any | undefined;
  },

  findByBuildIdAndVersion(buildId: number, version: number) {
    return getDatabase().prepare(
      'SELECT * FROM build_versions WHERE build_id = ? AND version = ?'
    ).get(buildId, version) as any | undefined;
  },

  listByBuildId(buildId: number) {
    return getDatabase().prepare(
      'SELECT id, build_id, version, content_hash, byte_size, line_count, word_count, created_at FROM build_versions WHERE build_id = ? ORDER BY version DESC'
    ).all(buildId);
  },
};

// ── Scores ──

export const scoreModel = {
  create(buildVersionId: number, scores: {
    archetype_purity: number;
    consistency: number;
    token_efficiency: number;
    signal_density: number;
    clarity: number;
  }, judgeModel: string, reasoning?: string) {
    const composite = (
      scores.archetype_purity * 0.25 +
      scores.consistency * 0.20 +
      scores.token_efficiency * 0.20 +
      scores.signal_density * 0.20 +
      scores.clarity * 0.15
    );

    getDatabase().prepare(`
      INSERT OR REPLACE INTO scores
      (build_version_id, archetype_purity, consistency, token_efficiency, signal_density, clarity, composite, judge_model, reasoning)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      buildVersionId,
      scores.archetype_purity, scores.consistency, scores.token_efficiency,
      scores.signal_density, scores.clarity, composite, judgeModel, reasoning || ''
    );

    return composite;
  },

  findByBuildVersionId(buildVersionId: number) {
    return getDatabase().prepare('SELECT * FROM scores WHERE build_version_id = ?').get(buildVersionId) as any | undefined;
  },

  generateMockScores(archetypeId: string): {
    archetype_purity: number;
    consistency: number;
    token_efficiency: number;
    signal_density: number;
    clarity: number;
  } {
    // Generate reasonable scores biased by archetype
    const base = () => 55 + Math.random() * 35; // 55-90 range
    const high = () => 70 + Math.random() * 25; // 70-95 range

    const scores = {
      archetype_purity: base(),
      consistency: base(),
      token_efficiency: base(),
      signal_density: base(),
      clarity: base(),
    };

    // Archetype-specific boosts
    switch (archetypeId) {
      case 'GOFAST':
        scores.token_efficiency = high();
        scores.signal_density = high();
        break;
      case 'CONTROL':
        scores.consistency = high();
        scores.clarity = high();
        break;
      case 'MIDRANGE':
        // Balanced — slight boost to all
        scores.archetype_purity = base() + 5;
        break;
      case 'TEMPO':
        scores.token_efficiency = high();
        scores.archetype_purity = high();
        break;
      case 'COMBO':
        scores.archetype_purity = high();
        scores.signal_density = high();
        break;
    }

    // Clamp to 0-100
    for (const key of Object.keys(scores) as Array<keyof typeof scores>) {
      scores[key] = Math.min(100, Math.max(0, Math.round(scores[key] * 10) / 10));
    }

    return scores;
  },
};

// ── Votes ──

export const voteModel = {
  toggle(userId: number, buildId: number): boolean {
    const existing = getDatabase().prepare(
      'SELECT id FROM votes WHERE user_id = ? AND build_id = ?'
    ).get(userId, buildId);

    if (existing) {
      getDatabase().prepare('DELETE FROM votes WHERE user_id = ? AND build_id = ?').run(userId, buildId);
      buildModel.updateVoteCount(buildId);
      return false; // unvoted
    } else {
      getDatabase().prepare('INSERT INTO votes (user_id, build_id) VALUES (?, ?)').run(userId, buildId);
      buildModel.updateVoteCount(buildId);
      return true; // voted
    }
  },

  hasVoted(userId: number, buildId: number): boolean {
    const row = getDatabase().prepare(
      'SELECT 1 FROM votes WHERE user_id = ? AND build_id = ?'
    ).get(userId, buildId);
    return !!row;
  },
};

// ── Pull Log ──

export const pullLogModel = {
  log(buildId: number, ipHash: string, userAgent: string) {
    getDatabase().prepare(
      'INSERT INTO pull_log (build_id, ip_hash, user_agent) VALUES (?, ?, ?)'
    ).run(buildId, ipHash, userAgent);
  },
};
