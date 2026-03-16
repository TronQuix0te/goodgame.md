import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

interface JudgeScores {
  archetype_purity: number;
  consistency: number;
  token_efficiency: number;
  signal_density: number;
  clarity: number;
  reasoning: string;
}

const ARCHETYPE_DESCRIPTIONS: Record<string, string> = {
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

export async function judgeuild(content: string, archetypeId: string): Promise<JudgeScores> {
  const archetypeDesc = ARCHETYPE_DESCRIPTIONS[archetypeId] || 'Unknown archetype';

  const response = await client.messages.create({
    model: config.anthropic.judgeModel,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Score this behavioral file.

DECLARED ARCHETYPE: ${archetypeId}
ARCHETYPE DESCRIPTION: ${archetypeDesc}

--- FILE CONTENT ---
${content}
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
    system: JUDGE_PROMPT,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const scores = JSON.parse(text.trim());

    // Validate and clamp
    const dims = ['archetype_purity', 'consistency', 'token_efficiency', 'signal_density', 'clarity'] as const;
    for (const dim of dims) {
      if (typeof scores[dim] !== 'number' || isNaN(scores[dim])) {
        scores[dim] = 50;
      }
      scores[dim] = Math.max(0, Math.min(100, Math.round(scores[dim] * 10) / 10));
    }

    return {
      archetype_purity: scores.archetype_purity,
      consistency: scores.consistency,
      token_efficiency: scores.token_efficiency,
      signal_density: scores.signal_density,
      clarity: scores.clarity,
      reasoning: scores.reasoning || '',
    };
  } catch (e) {
    console.error('Judge parse error:', text);
    throw new Error('Failed to parse judge response');
  }
}
