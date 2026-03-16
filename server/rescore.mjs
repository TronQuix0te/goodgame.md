import Database from 'better-sqlite3';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const db = new Database('./data/goodgame.db');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ARCHETYPE_DESCRIPTIONS = {
  GOFAST: 'Bias toward action over deliberation. Ship first, ask never. Speed is the priority.',
  CONTROL: 'Deliberate and thorough. Verify before acting. Correctness over speed.',
  MIDRANGE: 'Balanced and adaptive. Reads the situation and adjusts. No extremes.',
  TEMPO: 'Maximum efficiency. Token economy. Say more with less. Minimal footprint.',
  COMBO: 'Creative and unconventional. Challenges assumptions. First principles reasoning.',
};

const JUDGE_PROMPT = `You are the GG Judge — the scoring engine for goodgame.md, a platform for ranking behavioral disposition files for Claude Code.

A "behavioral file" defines HOW an AI assistant thinks, reasons, prioritizes, and communicates. It is stack-agnostic, project-agnostic, and model-agnostic.

SCORING DIMENSIONS (each 0-100):
1. **Archetype Purity** (0.25) - How cleanly does this embody its declared archetype?
2. **Consistency** (0.20) - Are instructions internally coherent?
3. **Token Efficiency** (0.20) - How much behavioral signal per token?
4. **Signal Density** (0.20) - How many distinct, actionable behavioral instructions?
5. **Clarity** (0.15) - How unambiguous are the instructions?

Be rigorous. Most files score 55-80. Above 85 is exceptional. 100 is impossible.`;

const builds = db.prepare(`
  SELECT b.id, b.name, b.archetype_id, bv.id as version_id, bv.content
  FROM builds b
  JOIN build_versions bv ON bv.build_id = b.id AND bv.version = b.current_version
  ORDER BY b.id
`).all();

console.log(`Re-scoring ${builds.length} builds with AI judge...\n`);

for (const build of builds) {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: JUDGE_PROMPT,
      messages: [{
        role: 'user',
        content: `Score this behavioral file.

DECLARED ARCHETYPE: ${build.archetype_id}
ARCHETYPE DESCRIPTION: ${ARCHETYPE_DESCRIPTIONS[build.archetype_id] || '?'}

--- FILE CONTENT ---
${build.content}
--- END ---

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "archetype_purity": <number>,
  "consistency": <number>,
  "token_efficiency": <number>,
  "signal_density": <number>,
  "clarity": <number>,
  "reasoning": "<2-3 sentences>"
}`
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const scores = JSON.parse(text.trim());

    const composite = Math.round((
      scores.archetype_purity * 0.25 +
      scores.consistency * 0.20 +
      scores.token_efficiency * 0.20 +
      scores.signal_density * 0.20 +
      scores.clarity * 0.15
    ) * 10) / 10;

    // Update existing score
    db.prepare(`
      UPDATE scores SET
        archetype_purity = ?, consistency = ?, token_efficiency = ?,
        signal_density = ?, clarity = ?, composite = ?,
        judge_model = ?, reasoning = ?, scored_at = datetime('now')
      WHERE build_version_id = ?
    `).run(
      scores.archetype_purity, scores.consistency, scores.token_efficiency,
      scores.signal_density, scores.clarity, composite,
      'claude-sonnet-4-20250514', scores.reasoning || '',
      build.version_id
    );

    console.log(`  @${build.name.padEnd(20)} ${composite.toFixed(1).padStart(5)} | ${scores.reasoning?.substring(0, 80) || ''}...`);
  } catch (err) {
    console.error(`  @${build.name} FAILED:`, err.message);
  }
}

console.log('\nDone.');
