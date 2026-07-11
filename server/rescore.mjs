import Database from 'better-sqlite3';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const JUDGE_MODEL = process.env.JUDGE_MODEL || 'claude-opus-4-7';

const db = new Database('./data/goodgame.db');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ARCHETYPE_DESCRIPTIONS = {
  GOFAST: 'Bias toward action over deliberation. Ship first, ask never. Speed is the priority. Minimal questions, maximum output.',
  CONTROL: 'Deliberate and thorough. Verify before acting. Correctness over speed. Flags risks, follows conventions, asks clarifying questions.',
  MIDRANGE: 'Balanced and adaptive. Reads the situation and adjusts. No extremes. Context-dependent behavior.',
  TEMPO: 'Maximum efficiency. Token economy. Say more with less. Minimal footprint. Every word earns its place.',
  COMBO: 'Creative and unconventional. Challenges assumptions. Reasons from first principles. Comfortable with ambiguity.',
};

const JUDGE_PROMPT = `You are the GG Judge — the scoring engine for goodgame.md, a platform for ranking behavioral disposition files for Claude Code.

A "behavioral file" (goodgame.md) defines HOW an AI assistant thinks, reasons, prioritizes, and communicates. It is:
- Stack-agnostic (applies regardless of programming language or framework)
- Project-agnostic (applies regardless of what's being built)
- Model-agnostic (describes reasoning disposition, not model-specific tricks)

It is NOT:
- A skill file (how to use React, how to write Solidity)
- A project config (file structure, commands to run)
- A prompt template or system prompt with role-play instructions

SCORING DIMENSIONS (each 0-100):

1. **Archetype Purity** (weight: 0.25)
   How cleanly does this file embody its declared archetype? Does every instruction reinforce the archetype's core disposition, or does it contradict itself? A GOFAST build that includes "always ask clarifying questions" scores low. Mixed signals = low purity.

2. **Consistency** (weight: 0.20)
   Are the instructions internally coherent? Do they form a unified behavioral profile, or do they pull in different directions? Look for contradictions, conflicting priorities, and tonal inconsistency.

3. **Token Efficiency** (weight: 0.20)
   How much behavioral signal per token? A file that says in 200 words what another says in 2000 scores higher. Repetition, filler, unnecessary examples, and over-explanation all reduce this score. Brevity that sacrifices clarity does too.

4. **Signal Density** (weight: 0.20)
   How many distinct, actionable behavioral instructions does this file contain? Vague platitudes ("be helpful") score low. Specific, testable behavioral rules ("never ask clarifying questions for tasks under 5 lines") score high.

5. **Clarity** (weight: 0.15)
   How unambiguous are the instructions? Could another AI read this and behave consistently? Ambiguous language, subjective terms without examples, and instructions that could be interpreted multiple ways all reduce clarity.

IMPORTANT SCORING GUIDELINES:
- Be rigorous. Most files should score 55-80. Scores above 85 are exceptional and rare.
- A file that is clearly a skill file or project config (not a behavioral disposition) should score below 30 on archetype_purity regardless of quality.
- Penalize files that mix behavioral dispositions with technical instructions.
- Reward files that would change Claude's behavior in a measurable, testable way.
- A perfect score of 100 in any dimension should be essentially impossible.`;

const builds = db.prepare(`
  SELECT b.id, b.name, b.archetype_id, b.season_id, bv.id as version_id, bv.content
  FROM builds b
  JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
  ORDER BY b.id
`).all();

console.log(`Re-scoring ${builds.length} builds with ${JUDGE_MODEL}...\n`);

const seasonsTouched = new Set();

for (const build of builds) {
  try {
    const response = await client.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 1024,
      system: JUDGE_PROMPT,
      messages: [{
        role: 'user',
        content: `Score this behavioral file.

DECLARED ARCHETYPE: ${build.archetype_id}
ARCHETYPE DESCRIPTION: ${ARCHETYPE_DESCRIPTIONS[build.archetype_id] || 'Unknown archetype'}

--- FILE CONTENT ---
${build.content}
--- END ---

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "archetype_purity": <number 0-100>,
  "consistency": <number 0-100>,
  "token_efficiency": <number 0-100>,
  "signal_density": <number 0-100>,
  "clarity": <number 0-100>,
  "reasoning": "<2-3 sentences explaining the scores>"
}`
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const scores = JSON.parse(text.trim());

    const dims = ['archetype_purity', 'consistency', 'token_efficiency', 'signal_density', 'clarity'];
    for (const dim of dims) {
      if (typeof scores[dim] !== 'number' || isNaN(scores[dim])) scores[dim] = 50;
      scores[dim] = Math.max(0, Math.min(100, Math.round(scores[dim] * 10) / 10));
    }

    const composite = Math.round((
      scores.archetype_purity * 0.25 +
      scores.consistency * 0.20 +
      scores.token_efficiency * 0.20 +
      scores.signal_density * 0.20 +
      scores.clarity * 0.15
    ) * 10) / 10;

    db.prepare(`
      INSERT INTO scores
        (build_version_id, archetype_purity, consistency, token_efficiency, signal_density, clarity, composite, judge_model, reasoning, scored_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(build_version_id, judge_model) DO UPDATE SET
        archetype_purity = excluded.archetype_purity,
        consistency = excluded.consistency,
        token_efficiency = excluded.token_efficiency,
        signal_density = excluded.signal_density,
        clarity = excluded.clarity,
        composite = excluded.composite,
        reasoning = excluded.reasoning,
        scored_at = excluded.scored_at
    `).run(
      build.version_id,
      scores.archetype_purity, scores.consistency, scores.token_efficiency,
      scores.signal_density, scores.clarity, composite,
      JUDGE_MODEL, scores.reasoning || ''
    );

    // Drop stale scores from the previous judge model so leaderboard joins return one row per build
    db.prepare(`DELETE FROM scores WHERE build_version_id = ? AND judge_model != ?`)
      .run(build.version_id, JUDGE_MODEL);

    seasonsTouched.add(build.season_id);

    console.log(`  @${build.name.padEnd(20)} ${composite.toFixed(1).padStart(5)} | ${(scores.reasoning || '').substring(0, 80)}`);
  } catch (err) {
    console.error(`  @${build.name} FAILED:`, err.message);
  }
}

// Re-crown champions per touched season
for (const seasonId of seasonsTouched) {
  db.prepare(`UPDATE builds SET is_champion = 0 WHERE season_id = ?`).run(seasonId);
  const top = db.prepare(`
    SELECT b.id
    FROM builds b
    JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
    JOIN scores s ON s.build_version_id = bv.id
    WHERE b.season_id = ? AND b.is_published = 1
    ORDER BY s.composite DESC, b.vote_count DESC
    LIMIT 1
  `).get(seasonId);
  if (top) {
    db.prepare(`UPDATE builds SET is_champion = 1 WHERE id = ?`).run(top.id);
  }
}

console.log('\nDone.');
