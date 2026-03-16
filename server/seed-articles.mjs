import Database from 'better-sqlite3';

const db = new Database('./data/goodgame.db');

const insert = db.prepare(
  'INSERT INTO articles (slug, title, description, content, tags, published_at) VALUES (?, ?, ?, ?, ?, ?)'
);

const articles = [

// ─── 1 ───
{
  slug: 'what-is-claude-md',
  title: 'What Is CLAUDE.md and Why Every Developer Needs One',
  description: 'CLAUDE.md is the configuration file that controls how Claude Code behaves in your projects. Here\'s why it matters and how to write your first one.',
  tags: 'guide,claude-code,getting-started',
  published_at: '2026-02-15',
  content: `If you use Claude Code — Anthropic's CLI for AI-assisted development — you've probably noticed it reads a file called \`CLAUDE.md\` from your project root. This file is more powerful than most developers realize.

## What CLAUDE.md Actually Does

CLAUDE.md is a behavioral configuration file. When Claude Code starts a session, it reads this file and adjusts its behavior accordingly. Think of it as a personality profile that shapes how the AI reasons, communicates, and makes decisions in your project.

It's not just a place for project notes. It's the control surface for how Claude interacts with you.

## The Three Layers of Claude Configuration

There are actually three distinct types of configuration that people conflate:

**1. CLAUDE.md (Project Context)** — What this repo is, how it's structured, what commands to run. This is project-specific and lives in the repo root.

**2. Behavioral Files (Disposition)** — How Claude should think, reason, and communicate. Should it ask questions or assume? Should it be verbose or terse? This is the layer goodgame.md focuses on.

**3. Skill Files (Technical Knowledge)** — How to use specific technologies. React patterns, Solidity conventions, Tailwind configs. These live in \`~/.claude/skills/\`.

Most developers only use the first layer. The behavioral layer is where the real power is.

## Why Behavioral Configuration Matters

Consider two developers using Claude Code on the same project. Developer A has no behavioral configuration — they get Claude's default personality. Developer B has a carefully tuned behavioral file that tells Claude to never ask clarifying questions, to move fast, and to match their terse communication style.

Developer B ships faster. Not because the code is different, but because the interaction pattern is optimized for their workflow.

## The Test That Separates Behavioral Files from Everything Else

Ask yourself: **would this instruction still apply if I completely changed the tech stack?**

- "Never ask clarifying questions for tasks under 5 lines" → Yes. Still applies in Python, Rust, or Solidity. **This is behavioral.**
- "Use Tailwind for styling, never CSS modules" → No. Meaningless outside a web context. **This is a skill file.**
- "The API is at /api and uses JWT auth" → No. Specific to this project. **This is CLAUDE.md.**

## Writing Your First Behavioral File

Start with three questions:

1. **Speed vs. safety** — Do you want Claude to move fast and assume, or slow down and verify?
2. **Verbosity** — Do you want explanations with every change, or just the code?
3. **Autonomy** — Should Claude suggest improvements unprompted, or only do exactly what's asked?

Your answers to these three questions define your behavioral archetype. On goodgame.md, we've formalized five archetypes: GOFAST, CONTROL, MIDRANGE, TEMPO, and COMBO.

## Getting Started

Browse the leaderboard on goodgame.md to see what high-scoring behavioral files look like. Find one that matches your style, pull it with curl, and start customizing:

\`\`\`
curl goodgame.md/@adaptive > ~/.claude/goodgame.md
\`\`\`

Then iterate. The best behavioral files aren't written — they're evolved through use.`
},

// ─── 2 ───
{
  slug: 'behavioral-archetypes-explained',
  title: 'The 5 Behavioral Archetypes: Which One Matches Your Coding Style?',
  description: 'GOFAST, CONTROL, MIDRANGE, TEMPO, and COMBO — a breakdown of the five Claude Code behavioral archetypes and how to choose the right one.',
  tags: 'archetypes,guide,behavioral',
  published_at: '2026-02-18',
  content: `Every developer has a natural rhythm when working with AI assistants. Some want maximum speed. Others want maximum safety. Most are somewhere in between. The five behavioral archetypes on goodgame.md formalize these patterns.

## GOFAST — Ship First, Ask Never

The GOFAST archetype is for developers who think faster than they type. They know what they want. They don't need Claude to double-check, ask clarifying questions, or explain what it's about to do.

**Core traits:**
- Execute immediately, never ask for clarification
- No preamble, no "Great question!", no previews
- Fix mistakes silently — don't narrate failures
- Never add unrequested features or improvements

**Best for:** Experienced developers working on personal projects, prototyping, or any context where speed matters more than correctness.

**Failure mode:** Moving too fast and making assumptions that turn out wrong.

## CONTROL — Measure Twice, Cut Once

The CONTROL archetype prioritizes correctness over speed. Every action is deliberate. Every assumption is stated. Claude verifies before acting and investigates before changing.

**Core traits:**
- Ask clarifying questions when ambiguity exists
- State assumptions explicitly before acting
- Read context before modifying code
- Present tradeoffs when decisions aren't obvious

**Best for:** Production codebases, security-sensitive work, team environments where mistakes are expensive.

**Failure mode:** Over-thinking. Analysis paralysis. Being too slow when speed is what's needed.

## MIDRANGE — Adaptive Balance

MIDRANGE is the chameleon archetype. It doesn't commit to one extreme — it reads the situation and adjusts. Low-stakes task? Move fast. High-stakes task? Slow down.

**Core traits:**
- Calibrate behavior to risk level
- Adjust verbosity to complexity
- Detect frustration and adapt pace
- Hold opinions loosely — suggest but don't argue

**Best for:** Developers who work across multiple contexts — sometimes prototyping, sometimes in production, sometimes teaching.

**Failure mode:** Being too middle-of-the-road when a strong stance is needed.

## TEMPO — Maximum Efficiency

TEMPO is about token economy. Every word earns its place. Responses are compressed to their essential information. No filler, no greetings, no transitions.

**Core traits:**
- Terse, precise, no filler
- Lead with the answer, not the reasoning
- One-word answers are valid
- Change only what was asked — nothing more

**Best for:** Experienced developers who read fast, know what they want, and value density over hand-holding.

**Failure mode:** Being so terse that critical nuance gets lost.

## COMBO — Creative Unconventional

COMBO is for non-standard thinking. It challenges assumptions, reasons from first principles, and embraces ambiguity. Instead of pattern-matching to known solutions, it derives approaches from constraints.

**Core traits:**
- Challenge the premise before executing
- Reason from constraints, not from patterns
- Comfortable with uncertainty and exploration
- Reframe problems to find better solution spaces

**Best for:** Research, architecture work, novel problems, exploratory development.

**Failure mode:** Over-philosophizing when the user just needs code written.

## Choosing Your Archetype

The honest answer: most developers are MIDRANGE or GOFAST. If you're reading this article carefully, you might be CONTROL. If you skimmed to here, you're probably GOFAST.

The archetype isn't a personality test — it's a configuration choice. You might be GOFAST for personal projects and CONTROL for work. You might switch to COMBO when designing a new system and back to TEMPO when implementing it.

Browse the leaderboard, read a few files from each archetype, and pick the one that makes you think "yes, this is how I want Claude to work."

Then pull it and start iterating.`
},

// ─── 3 ───
{
  slug: 'claude-code-setup-guide',
  title: 'Claude Code Setup: The Complete Configuration Guide for 2026',
  description: 'Everything you need to know about configuring Claude Code — from CLAUDE.md to behavioral files to skill files. The definitive setup guide.',
  tags: 'guide,claude-code,setup',
  published_at: '2026-02-22',
  content: `Claude Code is Anthropic's command-line interface for AI-assisted development. Out of the box it works fine. With proper configuration, it's transformative. Here's how to set it up properly.

## The Configuration Hierarchy

Claude Code reads configuration from multiple sources, in order of priority:

1. **System prompt** — Anthropic's base instructions (you can't change these)
2. **~/.claude/CLAUDE.md** — Your global behavioral defaults
3. **./CLAUDE.md** — Project-specific context and overrides
4. **~/.claude/skills/*.md** — Technical knowledge files

Understanding this hierarchy is key. Your global behavioral file sets the default personality. Your project CLAUDE.md adds context. Skill files add technical knowledge.

## Step 1: Global Behavioral File

This is the most impactful configuration most developers skip. Create \`~/.claude/CLAUDE.md\` with your preferred behavioral disposition:

\`\`\`
curl goodgame.md/@adaptive > ~/.claude/CLAUDE.md
\`\`\`

Or write your own. The key dimensions to define:
- How should Claude handle ambiguity? (Ask vs. assume)
- How verbose should responses be? (Terse vs. detailed)
- Should Claude suggest improvements unprompted? (Proactive vs. reactive)
- How should errors be handled? (Narrate vs. silently fix)

## Step 2: Project CLAUDE.md

Every project should have a CLAUDE.md in its root. This file tells Claude what the project is, how it's structured, and what conventions to follow.

A good project CLAUDE.md includes:
- What the project does (one paragraph)
- Tech stack and key dependencies
- File structure overview
- Commands to run (build, test, deploy)
- Coding conventions specific to this project
- Known gotchas or important context

Keep it under 200 lines. Claude reads this every session — longer files waste context window.

## Step 3: Skill Files

If you work with specific technologies regularly, create skill files in \`~/.claude/skills/\`:

\`\`\`
~/.claude/skills/react-patterns.md
~/.claude/skills/tailwind-conventions.md
~/.claude/skills/postgres-optimization.md
\`\`\`

These are technical knowledge files — they tell Claude how to use specific tools, not how to behave. The distinction matters.

## Common Mistakes

**Putting behavioral instructions in project CLAUDE.md** — Behavioral disposition should be global (in ~/.claude/CLAUDE.md), not per-project. "Never ask clarifying questions" applies everywhere.

**Making CLAUDE.md too long** — Everything in CLAUDE.md consumes context window. Be concise. A 500-line CLAUDE.md is actively hurting you.

**Mixing all three layers** — Don't put React patterns in your behavioral file. Don't put behavioral dispositions in your project config. Keep the layers separate.

**Never iterating** — Your first behavioral file won't be perfect. Use it for a week, notice what annoys you, and adjust. The best files evolve over dozens of iterations.

## The goodgame.md Approach

goodgame.md is a community platform for sharing and scoring behavioral files. Every file submitted is scored by an AI judge across five dimensions: archetype purity, consistency, token efficiency, signal density, and clarity.

The leaderboard shows you what high-quality behavioral files look like. Pull one as a starting point, customize it, and submit your own version. The community iterates together.

\`\`\`
# Pull the top-rated adaptive behavioral file
curl goodgame.md/@adaptive > ~/.claude/CLAUDE.md

# Or browse all builds
open https://goodgame.md
\`\`\``
},

// ─── 4 ───
{
  slug: 'how-ai-judge-scores-behavioral-files',
  title: 'Inside the GG Judge: How We Score Behavioral Files with AI',
  description: 'A transparent look at how goodgame.md\'s AI judge evaluates behavioral files across five dimensions — and what makes a file score 90+.',
  tags: 'scoring,technical,transparency',
  published_at: '2026-02-25',
  content: `Every behavioral file submitted to goodgame.md is scored by an AI judge. The scoring is transparent and deterministic. Here's exactly how it works.

## The Five Dimensions

Each file is scored 0-100 on five dimensions, weighted into a composite GG Score:

### Archetype Purity (25%)

Does every instruction reinforce the declared archetype? A GOFAST file that says "always ask clarifying questions" scores low. A TEMPO file with verbose explanations scores low. Mixed signals kill purity.

**What scores high:** Every instruction points in the same direction. The file reads like a unified philosophy, not a collection of tips.

**What scores low:** Contradictions. A file that says "move fast" but also "always read surrounding context first" is pulling in two directions.

### Consistency (20%)

Are the instructions internally coherent? Do they form a unified behavioral profile? This is related to purity but distinct — a file can be pure to its archetype but still have tonal inconsistency or conflicting specifics.

**What scores high:** A single clear voice throughout. Instructions that build on each other rather than existing in isolation.

**What scores low:** Sudden shifts in tone or perspective. Instructions that seem written by different people.

### Token Efficiency (20%)

How much behavioral signal per token? A file that says in 200 words what another says in 2000 scores higher. But brevity that sacrifices clarity scores low too — this is about density, not just shortness.

**What scores high:** Every sentence carries new information. No repetition, no filler, no unnecessary examples.

**What scores low:** Redundant instructions. Over-explanation. Examples that don't add value beyond the rule they illustrate.

### Signal Density (20%)

How many distinct, actionable behavioral instructions does the file contain? Vague platitudes like "be helpful" score low. Specific, testable rules like "never ask clarifying questions for tasks under 5 lines" score high.

**What scores high:** Instructions you could write a test for. "If the user uses lowercase, respond in lowercase" — that's testable and specific.

**What scores low:** Generic advice that could apply to any AI assistant. "Be thorough and accurate" tells Claude nothing it doesn't already know.

### Clarity (15%)

How unambiguous are the instructions? Could another AI read this file and behave consistently? Ambiguous language and subjective terms without examples reduce clarity.

**What scores high:** Precise, unambiguous language. When subjective terms are used, they're anchored with examples.

**What scores low:** "Be concise but thorough" — both words are subjective and they're in tension. What does that actually mean in practice?

## The Composite Score

The five dimensions are combined with these weights:

\`\`\`
GG Score = Purity(0.25) + Consistency(0.20) + Efficiency(0.20) + Signal(0.20) + Clarity(0.15)
\`\`\`

Most files score 55-80. Scores above 85 are exceptional. A perfect 100 is essentially impossible — there's always room to be more concise, more specific, or more consistent.

## What the Judge Penalizes

The judge has specific penalties for common mistakes:

- **Skill file content** — If the file contains technical instructions (React patterns, Tailwind config) rather than behavioral dispositions, archetype purity drops below 30.
- **Project-specific content** — File paths, deployment commands, and repo-specific context don't belong in behavioral files.
- **Empty instructions** — "Be good at coding" is a waste of tokens and scores zero on signal density.

## Improving Your Score

The fastest way to improve: **cut everything that isn't a behavioral instruction.** If it's about a technology, a framework, or a specific project — remove it. Behavioral files should be stack-agnostic, project-agnostic, and model-agnostic.

Then check for contradictions. Read every instruction and ask: does this conflict with anything else in the file? If yes, pick one direction and commit.

Finally, compress. Can you say the same thing in fewer words without losing clarity? Every token saved is a token of context window returned to the user.`
},

// ─── 5 ───
{
  slug: 'gofast-vs-control-which-archetype',
  title: 'GOFAST vs CONTROL: Choosing Between Speed and Safety in Claude Code',
  description: 'The two most popular archetypes represent a fundamental tradeoff. Here\'s how to decide which one is right for your workflow.',
  tags: 'archetypes,comparison,guide',
  published_at: '2026-03-01',
  content: `The most common question new users ask: should I go fast or go safe? The answer depends on your context, not your personality.

## When GOFAST Wins

GOFAST is the right choice when:

- **You know what you want.** The task is clear. The implementation path is obvious. You don't need Claude to explore options — you need it to execute.
- **Mistakes are cheap.** You're prototyping, you're on a personal project, or you have good version control. Wrong code can be reverted.
- **You're experienced.** You can spot errors in Claude's output quickly. You don't need explanations because you understand the code.
- **You're in flow.** Questions break concentration. Explanations slow you down. You just want code appearing at the speed of thought.

The top GOFAST files on goodgame.md share a pattern: they eliminate every form of friction between "I want X" and "X is done." No questions, no previews, no post-completion suggestions.

## When CONTROL Wins

CONTROL is the right choice when:

- **Mistakes are expensive.** You're in production. You're touching auth. You're modifying shared infrastructure. A wrong assumption could cost hours or worse.
- **Context matters.** The codebase has non-obvious conventions, hidden dependencies, or historical decisions that look wrong but aren't.
- **You're learning.** You want to understand why, not just what. Claude's explanations and tradeoff analysis teach you as you work.
- **You're working with a team.** Code needs to be reviewed. Assumptions need to be documented. The extra deliberation produces more reviewable output.

The top CONTROL files emphasize verification checkpoints — moments where Claude pauses to confirm understanding before proceeding.

## The Hybrid Approach

Most experienced developers don't pick one extreme. They use MIDRANGE configurations that adapt based on signals:

- Short task + familiar domain → GOFAST behavior
- Long task + unfamiliar domain → CONTROL behavior
- User types in fragments → Terse responses
- User asks "why" → Detailed explanations

This is why @adaptive is the most-pulled file on goodgame.md. It doesn't commit to one speed — it reads the situation and adjusts.

## A Practical Framework

Ask yourself three questions before choosing:

1. **What's the blast radius of a mistake?** If a wrong assumption means deleting a file you can restore — GOFAST. If it means a broken deployment — CONTROL.

2. **How well do you know this domain?** Working in your strongest language on a project you built? GOFAST. Touching unfamiliar code in a framework you're learning? CONTROL.

3. **What's your energy level?** This one's underrated. When you're sharp and focused, GOFAST feels natural. When you're tired and want backup, CONTROL catches mistakes you'd miss.

## Switching Between Archetypes

Some developers maintain multiple behavioral files and swap them based on context:

\`\`\`
# Morning sprint — move fast
cp ~/.claude/gofast.md ~/.claude/CLAUDE.md

# Afternoon production fix — move carefully
cp ~/.claude/control.md ~/.claude/CLAUDE.md
\`\`\`

Others use MIDRANGE files that adjust dynamically. There's no wrong answer — the right configuration is the one that matches how you actually work.`
},

// ─── 6 ───
{
  slug: 'writing-high-scoring-behavioral-files',
  title: 'How to Write a Behavioral File That Scores 85+',
  description: 'Practical tips for writing behavioral files that score well on goodgame.md — from structure to common pitfalls to iteration strategies.',
  tags: 'guide,scoring,tips',
  published_at: '2026-03-02',
  content: `The average behavioral file on goodgame.md scores between 60 and 75. Breaking 85 requires understanding what the AI judge values and — more importantly — what it penalizes.

## Start With One Clear Thesis

High-scoring files have a single, identifiable thesis. Not "here's how Claude should behave" but "here's one specific behavioral philosophy, fully committed."

@minimal's thesis: "Every token earns its place or gets cut."
@measure-twice's thesis: "Do not act until you understand."
@ship-or-die's thesis: "Extreme bias toward action over deliberation."

If you can't state your file's thesis in one sentence, it's probably trying to do too much.

## Make Every Instruction Testable

The signal density dimension rewards instructions that you could verify in practice. Compare:

**Weak:** "Be concise in your responses."
**Strong:** "If a response exceeds five lines, question whether every line is necessary."

**Weak:** "Match the user's style."
**Strong:** "If the user types in lowercase fragments, you respond in lowercase fragments."

The strong versions tell Claude exactly what to do in specific situations. The weak versions leave room for interpretation, which means inconsistent behavior.

## Eliminate Non-Behavioral Content

The single biggest score killer is non-behavioral content. The judge penalizes:

- **Technology preferences** — "Use React with TypeScript" is a project decision, not a behavioral disposition.
- **Code style rules** — "Use 2-space indentation" is a linter config, not a personality.
- **Tool preferences** — "Prefer Zustand over Redux" is a skill file entry, not a behavioral instruction.

The test: would this instruction still apply if you switched from web development to embedded systems? If not, it doesn't belong.

## Commit to Your Archetype

Mixed files score low on purity. If you declare GOFAST, every instruction should reinforce speed. No "but also verify important things" caveats. The archetype is a commitment.

This feels extreme, and it is. The highest-scoring files are opinionated to the point of being uncomfortable. That's what makes them effective — they create a strong, consistent behavioral signal.

## Structure Matters

The judge rewards files that build coherently. Good structure:

1. Open with the core philosophy (1-2 sentences)
2. Define specific behaviors that follow from it
3. Address edge cases and failure modes
4. Close with what the disposition explicitly doesn't do

Bad structure: a random list of rules with no logical flow. Even if individual rules are good, a disorganized file scores lower on consistency.

## The Compression Pass

After writing your file, do a compression pass. For every sentence, ask:

- Does this add new behavioral information?
- Is this already implied by a previous instruction?
- Can this be said in fewer words?

High token efficiency doesn't mean short — it means dense. A 300-word file that's all signal beats a 100-word file that's vague.

## Iterate Based on Usage

The best files aren't written in one sitting. Submit v1, use it for a week, then submit v2 with adjustments based on what worked and what didn't.

Common iteration patterns:
- "Claude keeps doing X despite my instruction" → Make the instruction more specific
- "I keep overriding this rule manually" → Remove or weaken it
- "This rule never comes up in practice" → Cut it (dead weight hurts efficiency)

The leaderboard rewards files that have been refined through actual use. Theory alone can't produce a 90+ score.`
},

// ─── 7 ───
{
  slug: 'claude-code-vs-cursor-vs-copilot',
  title: 'Claude Code vs Cursor vs GitHub Copilot: Where Behavioral Files Fit In',
  description: 'How Claude Code\'s behavioral configuration compares to other AI coding tools — and why the behavioral layer is unique to Claude.',
  tags: 'comparison,tools,claude-code',
  published_at: '2026-03-03',
  content: `AI coding tools have different configuration models. Understanding the differences helps you use each one effectively — and understand why behavioral files only really exist in the Claude Code ecosystem.

## GitHub Copilot: Suggestions, Not Conversations

Copilot operates at the suggestion level. It reads your code, predicts what comes next, and offers completions. Configuration is limited to enabling/disabling languages and accepting/rejecting suggestions.

There's no concept of behavioral configuration because there's no conversation. Copilot doesn't reason, deliberate, or make decisions. It predicts tokens.

## Cursor: IDE-Integrated Chat

Cursor adds AI chat to the IDE experience. It has a .cursorrules file that serves a similar purpose to CLAUDE.md — project context and coding preferences.

But .cursorrules is primarily a skill file. It tells Cursor about your tech stack, coding patterns, and style preferences. There's limited support for behavioral configuration — you can't meaningfully control how Cursor reasons or communicates.

## Claude Code: Full Behavioral Control

Claude Code is unique in that it gives you control over the reasoning layer, not just the knowledge layer. Through CLAUDE.md and behavioral files, you can shape:

- How Claude handles ambiguity
- Whether it asks questions or assumes
- How verbose its communication is
- Whether it suggests improvements unprompted
- How it handles mistakes and failures
- What its default level of caution is

This is possible because Claude Code is a conversational agent, not a completion engine. It reasons, plans, and makes decisions — and behavioral files configure that decision-making process.

## Why This Matters

The behavioral layer is the highest-leverage configuration available in any AI coding tool. Changing your React patterns saves you time on React projects. Changing how Claude reasons saves you time on everything.

A developer with a well-tuned behavioral file is working with a fundamentally different tool than a developer using default settings. Not better code — better interaction. And better interaction compounds across every task.

## The Future

As AI coding tools mature, expect behavioral configuration to become standard across all of them. The insight behind goodgame.md — that the behavioral layer is distinct from the knowledge layer and can be shared, scored, and iterated — will apply broadly.

For now, Claude Code is the only tool where this layer is fully configurable. And goodgame.md is the place to find, share, and improve behavioral files for it.`
},

// ─── 8 ───
{
  slug: 'token-efficiency-behavioral-files',
  title: 'Token Efficiency in Behavioral Files: Why Every Word Matters',
  description: 'Your behavioral file consumes context window on every interaction. Here\'s how to maximize signal per token and stop wasting your context budget.',
  tags: 'optimization,tokens,guide',
  published_at: '2026-03-04',
  content: `Every word in your behavioral file costs context window. Claude reads CLAUDE.md at the start of every session — a 500-word file consumes ~700 tokens before you've even typed your first message. Here's how to make every token count.

## The Context Window Tax

Claude's context window is finite. Your behavioral file, project CLAUDE.md, and skill files all compete with your actual conversation for space. A bloated behavioral file literally reduces how much code Claude can reason about.

The math is simple:
- 200-word behavioral file ≈ 280 tokens
- 500-word behavioral file ≈ 700 tokens
- 1000-word behavioral file ≈ 1,400 tokens

On a 200K context window that might seem trivial. But context isn't just about capacity — it's about attention. Information earlier in the context has stronger influence. A concise behavioral file at the top of context has more impact than a verbose one.

## Compression Techniques

### Remove Implied Instructions

Claude already knows how to code. You don't need to tell it to "write clean, maintainable code" or "follow best practices." These instructions add tokens without adding signal.

Only include instructions that override Claude's default behavior or that are genuinely non-obvious.

### Merge Redundant Rules

**Before (3 rules, 45 words):**
- Never add features that weren't requested
- Don't refactor code you weren't asked to touch
- Don't add tests unless specifically asked

**After (1 rule, 12 words):**
- Change only what was asked. Nothing more.

Same behavioral signal, one-third the tokens.

### Use Concrete Examples Instead of Abstract Rules

**Abstract (22 words):** "Calibrate your communication style to match the formality and technical level of the user's messages."

**Concrete (15 words):** "If the user types in lowercase fragments, respond in lowercase fragments."

The concrete version is shorter AND more actionable.

### Cut Meta-Commentary

Don't explain your behavioral file within the behavioral file. Claude doesn't need to know why you chose these rules. It just needs the rules.

**Cut:** "This disposition exists because I value speed over safety."
**Keep:** "Choose speed over safety."

## The Diminishing Returns Curve

Testing on goodgame.md shows that behavioral files plateau in effectiveness around 300-400 words. Beyond that, additional instructions tend to either repeat existing ones or add edge cases that rarely trigger.

The highest-scoring TEMPO files are often under 200 words. They prove you can define a complete behavioral profile in remarkably little space.

## Measuring Token Efficiency

The GG Judge scores token efficiency by comparing behavioral signal to total tokens. A 500-word file with 10 distinct behavioral instructions scores lower than a 200-word file with 8 instructions.

To improve your score:
1. Count your distinct behavioral instructions
2. Count your total words
3. Divide instructions by words — higher ratio is better
4. Eliminate anything that isn't a behavioral instruction

## The Ideal Behavioral File

The ideal file has 15-25 specific behavioral instructions in under 300 words, organized in a logical structure that builds coherently, with no repetition, no filler, and no non-behavioral content.

That's a high bar. But it's what separates a 70-score file from a 90-score file.`
},

// ─── 9 ───
{
  slug: 'behavioral-file-mistakes',
  title: '7 Mistakes Everyone Makes in Their First Behavioral File',
  description: 'Common pitfalls that kill your GG Score — and how to fix them. Avoid these mistakes and your behavioral file will immediately improve.',
  tags: 'tips,mistakes,guide',
  published_at: '2026-03-05',
  content: `After scoring thousands of behavioral files, clear patterns emerge. These seven mistakes appear in almost every first attempt.

## 1. Mixing Behavioral and Technical Instructions

The most common mistake. Your behavioral file says "always use TypeScript" or "prefer functional components." These are technology preferences, not behavioral dispositions.

**Fix:** Ask "would this apply if I switched to Python?" If no, move it to a skill file.

## 2. Contradicting Your Own Archetype

A GOFAST file that includes "always read surrounding context before making changes" is sending mixed signals. Speed requires skipping some verification. If you want both, you're MIDRANGE — not GOFAST.

**Fix:** Pick your archetype, then ruthlessly cut every instruction that pulls in the opposite direction.

## 3. Instructions That Restate Claude's Defaults

"Write clean, readable code." "Follow best practices." "Be helpful and accurate." Claude already does these things. You're burning tokens on instructions that change nothing.

**Fix:** Only include instructions that change Claude's default behavior. If removing the instruction wouldn't change Claude's output, delete it.

## 4. Being Vague When You Should Be Specific

"Be concise" means different things to different people. Is a 5-line response concise? A 1-line response? A single word?

**Fix:** Replace subjective terms with concrete thresholds. "If a response exceeds five lines, question whether every line is necessary" is actionable. "Be concise" is not.

## 5. Too Many Instructions

A file with 40 rules is a file where no rule gets adequate attention. Claude can't simultaneously optimize for 40 competing objectives. The rules start conflicting, behavior becomes inconsistent, and your file scores low on coherence.

**Fix:** Limit yourself to 15-20 core instructions. If you can't cut below 20, your file is probably trying to cover multiple archetypes.

## 6. No Clear Structure

A random list of rules with no organizing principle is harder for Claude to internalize than a structured file that builds from a core philosophy. Structure isn't about aesthetics — it affects how reliably Claude follows the instructions.

**Fix:** Open with your core thesis. Group related instructions. Build from general principles to specific rules. End with explicit failure modes.

## 7. Never Iterating

The first version of any behavioral file is a hypothesis. You wrote what you think you want. You haven't tested it yet. After a week of use, you'll discover rules that don't work, behaviors you forgot to specify, and priorities that were wrong.

**Fix:** Use your file for a week. Take notes on every moment where Claude's behavior didn't match your expectations. Update the file. Repeat.

## The Meta-Lesson

All seven mistakes share a root cause: treating the behavioral file as a document rather than a tool. It's not something you write once and forget. It's a living configuration that shapes every interaction with Claude. Invest in getting it right.`
},

// ─── 10 ───
{
  slug: 'curl-install-behavioral-files',
  title: 'One-Line Install: How to Pull Behavioral Files with curl',
  description: 'goodgame.md lets you install any behavioral file with a single curl command. Here\'s how the champion endpoint works and how to use it.',
  tags: 'how-to,curl,champion',
  published_at: '2026-03-06',
  content: `Every build on goodgame.md has a unique slug. Every slug is directly accessible via curl. No npm install, no git clone, no signup required.

## Basic Usage

Pull any build by name:

\`\`\`
curl goodgame.md/@minimal
\`\`\`

This returns the raw content of the behavioral file — ready to pipe into a file:

\`\`\`
curl goodgame.md/@minimal > ~/.claude/CLAUDE.md
\`\`\`

That's it. One line. Your Claude Code behavioral configuration is updated.

## How It Works

The champion endpoint at \`goodgame.md/@name\` uses content-type negotiation:

- **CLI/curl requests** get raw text/plain — the behavioral file content, ready to save
- **Browser requests** get redirected to the build detail page with scores, votes, and version history

This means the same URL works for both humans browsing and scripts installing.

## Version Pinning

Want a specific version? Append the version number:

\`\`\`
curl goodgame.md/@minimal@1
curl goodgame.md/@minimal@2
\`\`\`

Without a version number, you always get the latest published version.

## Using in CI/CD

You can automate behavioral file management in your build pipeline:

\`\`\`
# In your Makefile or CI config
setup-claude:
	curl -s goodgame.md/@adaptive > .claude/CLAUDE.md
\`\`\`

This ensures every team member and CI environment uses the same behavioral configuration.

## Headers

Every response includes useful headers:

- \`X-Build\` — Build name and version
- \`X-GG-Score\` — The composite GG Score
- \`Cache-Control\` — Caching directives

## Creating Your Own Pullable Build

Sign up on goodgame.md, submit a build with a unique slug, and it's immediately available via curl. The slug you choose becomes your permanent URL:

\`\`\`
# If you submit with slug "my-config"
curl goodgame.md/@my-config
\`\`\`

Your behavioral file is now one curl away from any machine in the world.`
},

// ─── 11 ───
{
  slug: 'why-behavioral-files-matter-2026',
  title: 'Why Behavioral Files Are the Most Important AI Configuration in 2026',
  description: 'As AI coding assistants become standard, the behavioral layer — how the AI thinks, not what it knows — becomes the highest-leverage configuration surface.',
  tags: 'opinion,future,behavioral',
  published_at: '2026-03-07',
  content: `Every developer configures their editor. Keybindings, themes, extensions, linters. We spend hours getting our tools to work the way we think.

AI coding assistants are the biggest new tool in a generation. And most developers are using them with zero configuration.

## The Configuration Gap

Think about how much time you spend configuring your development environment:

- Shell aliases and functions
- Git config and hooks
- Editor plugins and keybindings
- Linter and formatter rules
- Build tool configuration

Now think about how much time you've spent configuring the AI that writes 30-50% of your code.

For most developers, the answer is: none. They use Claude Code, Copilot, or Cursor with whatever defaults shipped. This is like writing code in Notepad because you never got around to installing an editor.

## Why Defaults Aren't Enough

Claude's default behavior is designed to be helpful to the broadest possible audience. It's polite, thorough, cautious, and explanatory. For some developers and some tasks, that's perfect.

But defaults are compromises. They're optimized for the average case, which means they're optimal for nobody. The developer who wants terse output suffers through explanations. The developer who wants caution gets speed.

Behavioral files let you escape the default and configure the AI to match your actual workflow.

## The Compounding Effect

Here's what makes behavioral configuration high-leverage: it affects every interaction.

A good React skill file saves you time when working in React. A good behavioral file saves you time in every technology, every project, every task. It's the difference between optimizing one tool and optimizing how you use all tools.

Over hundreds of interactions per week, even small behavioral improvements compound into significant time savings. A 10% reduction in back-and-forth per interaction — fewer unnecessary questions, less unwanted explanation, faster execution — adds up to hours per week.

## The Sharing Problem

Until now, behavioral configuration has been personal and invisible. Developers write their CLAUDE.md files alone, with no way to learn from what works for others.

goodgame.md solves this by making behavioral files shareable, discoverable, and scored. You can see what high-quality behavioral files look like, pull them with one command, and iterate on them with community feedback.

## What's Next

The behavioral layer is still early. We're at the "people are just starting to realize this is important" stage. Within a year, behavioral configuration will be as standard as linter configuration.

The developers who invest now in understanding and optimizing this layer will have a significant productivity advantage. Not because they're using a better model — because they're using the same model more effectively.

Start with the leaderboard. Pull a file that matches your style. Iterate. Share what you learn. The community gets better when everyone participates.`
},

// ─── 12 ───
{
  slug: 'skill-files-vs-behavioral-files',
  title: 'Skill Files vs Behavioral Files: A Clear Separation Guide',
  description: 'The most confusing part of Claude Code configuration is knowing what goes where. Here\'s the definitive guide to separating skills from behaviors.',
  tags: 'guide,skills,behavioral',
  published_at: '2026-03-08',
  content: `The number one reason behavioral files score low on goodgame.md is contamination with skill file content. Understanding the distinction is the single most impactful improvement you can make.

## The Rule

**Behavioral files** control HOW Claude thinks and communicates.
**Skill files** control WHAT Claude knows about specific technologies.

The test: **would this instruction still apply if you completely changed the tech stack?**

## Examples That Belong in Behavioral Files

- "Never ask clarifying questions. Assume and execute."
- "If the user types in lowercase, match their tone."
- "Fix mistakes silently. Don't narrate what went wrong."
- "State your assumptions before acting on them."
- "When stuck, say so clearly instead of going in circles."

These are about reasoning disposition. They apply whether you're writing Python, JavaScript, Rust, or Solidity.

## Examples That Belong in Skill Files

- "Use functional components in React, never class components."
- "Prefer Tailwind utility classes over CSS modules."
- "In Solidity, always use the Checks-Effects-Interactions pattern."
- "Run tests with \`npm test\` before committing."
- "Use snake_case for Python, camelCase for JavaScript."

These are about technology knowledge. They're meaningless outside their specific technical context.

## Examples That Belong in Project CLAUDE.md

- "This is a Next.js app deployed on Vercel."
- "The database is PostgreSQL, accessed through Prisma."
- "Run \`npm run dev\` to start the development server."
- "Auth is handled by NextAuth with GitHub OAuth."

These are about project context. They describe what exists, not how to behave.

## The Gray Area

Some instructions seem behavioral but are actually technical:

- "Always add error handling" — This is a coding practice, not a behavioral disposition. It depends on the language and context.
- "Write tests for new features" — This is a workflow preference, not a reasoning pattern. It belongs in project CLAUDE.md.
- "Use TypeScript strict mode" — This is a tool configuration, not a behavioral trait.

The sharp test: imagine you're asking Claude for life advice instead of code. Does the instruction still make sense? "Never ask clarifying questions" — yes. "Use TypeScript strict mode" — obviously not.

## Why This Matters for Scoring

The GG Judge evaluates archetype purity. A behavioral file contaminated with skill content scores poorly because:

1. Skill content dilutes the behavioral signal (lower signal density)
2. Technology preferences have nothing to do with the archetype (lower purity)
3. Tokens spent on technical instructions are wasted (lower efficiency)

A 200-word pure behavioral file will outscore a 500-word mixed file every time.

## Practical Separation

Create three files:

\`\`\`
~/.claude/CLAUDE.md          → Behavioral disposition (from goodgame.md)
~/.claude/skills/react.md    → React patterns and preferences
./CLAUDE.md                  → This specific project's context
\`\`\`

Keep them separate. Keep them focused. Your GG Score — and your actual Claude experience — will improve immediately.`
},

// ─── 13 ───
{
  slug: 'prompt-engineering-vs-behavioral-files',
  title: 'Prompt Engineering Is Dead. Behavioral Configuration Is What Replaced It.',
  description: 'Why crafting individual prompts is less effective than configuring persistent behavioral dispositions — and how the shift changes everything.',
  tags: 'opinion,prompts,behavioral',
  published_at: '2026-03-09',
  content: `For two years, "prompt engineering" was the skill everyone said you needed. Craft the perfect prompt. Use magic words. Structure your requests just right.

With persistent AI assistants like Claude Code, prompt engineering is the wrong frame. Behavioral configuration is what matters now.

## The Shift

Prompt engineering assumes each interaction is independent. You craft a prompt, get a response, and start over. Every message needs to carry its own instructions for how the AI should behave.

Behavioral configuration assumes a persistent relationship. You configure the AI's disposition once, and it applies to every interaction. You stop engineering individual prompts and start engineering the personality itself.

## Why This Is More Powerful

**Compounding.** A well-engineered prompt saves you time once. A well-configured behavioral file saves you time on every interaction for the rest of the session — and the next session, and the one after that.

**Consistency.** Prompts drift. You forget the magic words. You phrase things differently. Behavioral files create consistent behavior regardless of how you word your request.

**Reduced friction.** With a good behavioral file, you can type "fix the auth bug" instead of "fix the auth bug, be concise, don't ask questions, show me the code diff." The behavioral file carries the persistent instructions.

## What Survives from Prompt Engineering

Not everything about prompt engineering is obsolete. The good parts survive:

- **Being specific about what you want** — Still valuable. "Fix the auth bug" is better than "help me."
- **Providing relevant context** — Still valuable. Mentioning the file and the symptom helps.
- **Structured output requests** — Still valuable when you need a specific format.

What dies:

- **Personality instructions in every prompt** — Now handled by behavioral files.
- **"You are a..." role assignments** — Now handled by behavioral files.
- **Magic words and incantations** — Never actually worked reliably anyway.
- **Chain-of-thought prompting** — The AI's reasoning approach is now configurable persistently.

## The New Skill

The new skill isn't prompt engineering — it's behavioral architecture. Understanding the dimensions of AI behavior and configuring them intentionally:

1. **Autonomy level** — How much should Claude do without asking?
2. **Communication style** — Terse vs. verbose, formal vs. casual
3. **Risk tolerance** — Cautious vs. bold, verify vs. assume
4. **Scope discipline** — Strict vs. expansive, focused vs. exploratory
5. **Error handling** — Narrate vs. fix silently, apologize vs. move on

These dimensions interact. High autonomy + high risk tolerance = GOFAST. High verification + low risk tolerance = CONTROL. The configuration space is rich enough to express any working style.

## Getting Started

Stop writing prompt preambles. Start writing behavioral files.

Browse goodgame.md. Find a file that resonates. Pull it. Use it for a week. Iterate.

The time you invest in behavioral configuration pays dividends on every future interaction. Prompt engineering never offered that.`
},

// ─── 14 ───
{
  slug: 'team-behavioral-standards',
  title: 'Behavioral Files for Teams: Standardizing How AI Assists Your Team',
  description: 'How teams can use shared behavioral configurations to get consistent AI behavior across all developers — reducing friction and improving code review.',
  tags: 'teams,workflow,guide',
  published_at: '2026-03-10',
  content: `When one developer uses Claude in GOFAST mode and another uses CONTROL mode, their output looks different. Not just the code — the commit messages, the error handling, the documentation. Teams benefit from shared behavioral standards.

## The Problem

Developer A's Claude never adds comments and ships minimal code.
Developer B's Claude adds docstrings to every function and suggests tests.

In code review, A thinks B's code is over-engineered. B thinks A's code is under-documented. Neither is wrong — they're just using differently-configured AI.

## The Solution

Agree on a team behavioral file and commit it to the repo. Not as CLAUDE.md (which is project-specific), but as a documented team standard that each developer pulls into their global config.

## What to Standardize

Not everything needs standardizing. Focus on the dimensions that affect team collaboration:

**Standardize:**
- Scope discipline (don't modify code outside the task)
- Error handling approach (how to handle vs. document errors)
- Communication in commits and PRs
- When to ask vs. assume

**Don't standardize:**
- Verbosity preferences (personal taste)
- Speed vs. safety tradeoff (context-dependent)
- Communication tone (personal style)

The rule: standardize behaviors that affect shared artifacts (code, commits, PRs). Leave personal interaction style to the individual.

## Implementation

1. **Choose a base archetype.** Most teams are MIDRANGE or CONTROL. Pure GOFAST is risky for team environments where mistakes affect others.

2. **Customize together.** Have the team review behavioral files from goodgame.md and discuss which rules they agree on. Disagreements reveal assumptions worth making explicit.

3. **Document in the repo.** Add a \`behavioral.md\` file that documents the team's agreed behavioral configuration.

4. **Onboard with it.** When new developers join, the behavioral file is part of their setup — same as linter rules and editor config.

## Measuring Impact

After adopting team behavioral standards, teams typically report:

- Fewer code review comments about AI-generated style differences
- More consistent commit messages and PR descriptions
- Reduced back-and-forth on "why did Claude do it this way?"
- Faster onboarding (new devs immediately get team-configured AI)

## Evolving the Standard

Like any team standard, behavioral configurations should evolve. Review quarterly:

- Are there rules nobody follows? Remove them.
- Are there recurring friction points? Add rules for them.
- Has the team's workflow changed? Adjust accordingly.

The goal isn't rigidity — it's shared expectations. When everyone's AI behaves in a predictable way, the team moves faster.`
},

];

// Insert all articles
let count = 0;
for (const article of articles) {
  try {
    insert.run(article.slug, article.title, article.description, article.content, article.tags, article.published_at);
    count++;
    console.log(`  ✓ ${article.slug}`);
  } catch (err) {
    console.error(`  ✗ ${article.slug}: ${err.message}`);
  }
}

console.log(`\nInserted ${count} articles.`);
