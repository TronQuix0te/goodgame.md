import { useState } from 'react';

interface CodeDemo {
  caption: string;
  source: string;
}

interface WorkEntry {
  title: string;
  role: string;
  status: string;
  body: string;
  stack?: string[];
  code?: CodeDemo;
  repo?: string;
}

const ENTRIES: WorkEntry[] = [
  {
    title: 'Multi-Entity Tech Audit — Home-Services Group',
    role: 'Fractional CTO',
    status: 'ENGAGEMENT LIVE',
    body: 'Three-brand company, ~40 staff, one embedded IT vendor controlling admin credentials for 27 systems under a contract scoped for a single brand. Independent audit: vendor-dependency map, full platform inventory, credential-risk review, and a cost analysis that flagged a $116K/yr contractor on a booking site. Phase 1 shipped in a week.',
  },
  {
    title: 'Basketball Intelligence Platform — NBA + College',
    role: 'Architect / Lead Engineer',
    status: 'LIVE',
    body: 'Multi-tenant player-development and scouting platform in production with more than half the NBA plus college programs nationwide. Role-based access across organizations, staff, and athletes — video, data, and coaching workflows in one system.',
    stack: ['React', 'Node', 'Postgres'],
    code: {
      caption: 'PATTERN EXCERPT (SANITIZED) — TENANT ISOLATION AT THE MIDDLEWARE LAYER',
      source: `// Every query is tenant-scoped before it reaches a handler —
// a leaked ID from another org resolves to 404, not 403.
export function withOrgScope(handler: ScopedHandler) {
  return async (req: Request, res: Response) => {
    const membership = await Membership.findOne({
      where: { user_id: req.user.id, org_id: req.params.orgId },
    });
    if (!membership) return res.sendStatus(404); // don't confirm existence

    const can = ROLE_GRANTS[membership.role];
    if (!can.includes(req.method)) return res.sendStatus(403);

    req.scope = { orgId: membership.org_id, role: membership.role };
    return handler(req, res);
  };
}`,
    },
  },
  {
    title: 'Therapeutic AI Platform',
    role: 'Architect / Lead Engineer',
    status: 'IN PRODUCTION',
    body: 'AI system built around a 14-step LLM pipeline with a 7-type memory architecture — free-form input in, structured personalized therapeutic output out. Production-hardened: structured outputs, idempotent retries, fail-closed guardrails.',
    stack: ['Node', 'Postgres', 'LLM pipeline'],
    code: {
      caption: 'PATTERN EXCERPT (SANITIZED) — THE FAIL-CLOSED SAFETY GATE',
      source: `// Step 9 of 14: the safety gate. The pipeline fails CLOSED —
// if the classifier errors or times out, output is withheld,
// never passed through.
async function safetyGate(draft: DraftOutput, ctx: SessionCtx) {
  let verdict: SafetyVerdict;
  try {
    verdict = await classify(draft, { timeoutMs: 8000 });
  } catch {
    return { pass: false, action: 'HOLD', reason: 'classifier_unavailable' };
  }
  if (verdict.risk >= ctx.thresholds.hold) {
    await escalate(ctx.sessionId, verdict);
    return { pass: false, action: 'ESCALATE', reason: verdict.category };
  }
  return { pass: true, action: 'DELIVER' };
}`,
    },
  },
  {
    title: 'LMS Rebuild — 657 Files',
    role: 'Lead Engineer',
    status: 'SHIPPED',
    body: 'Full rebuild of a legacy learning-management system: 657 files, 49 Postgres tables, multi-tenant RBAC. Legacy behavior preserved while the stack was modernized underneath it.',
    stack: ['React', 'Node', 'Postgres'],
    code: {
      caption: 'PATTERN EXCERPT (SANITIZED) — PARITY HARNESS FOR THE STRANGLER MIGRATION',
      source: `// Rebuild rule: every rewritten module ships behind a parity
// check — the new implementation runs alongside legacy, diffs
// are logged, and legacy stays authoritative until cutover.
export async function withParity<T>(
  name: string,
  legacy: () => Promise<T>,
  next: () => Promise<T>,
): Promise<T> {
  const [a, b] = await Promise.allSettled([legacy(), next()]);
  if (differ(a, b)) log.warn('parity_mismatch', { name, a, b });
  if (a.status === 'fulfilled') return a.value;
  throw a.reason;
}`,
    },
  },
  {
    title: 'Agentic Outbound Pipeline — Mortgage Lead Platform',
    role: 'Agentic AI Developer',
    status: 'IN PRODUCTION',
    body: 'Agentic pipeline for a mortgage lead marketplace — automated outbound broker outreach with rate-limit handling and idempotent, retry-safe message delivery.',
    stack: ['n8n', 'Node', 'LLM'],
    code: {
      caption: 'PATTERN EXCERPT (SANITIZED) — RETRY-SAFE OUTBOUND DELIVERY',
      source: `// A natural idempotency key means a crashed worker or a
// webhook replay can never double-message a broker.
async function sendOnce(msg: OutboundMsg) {
  const key = hash(\`\${msg.brokerId}:\${msg.leadId}:\${msg.template}\`);
  const claimed = await db.query(
    \`INSERT INTO sends (idem_key, status) VALUES ($1, 'pending')
     ON CONFLICT (idem_key) DO NOTHING RETURNING id\`, [key]);
  if (!claimed.rowCount) return;        // duplicate — already sent
  await rateLimiter.take(msg.brokerId); // per-broker budget
  const res = await deliver(msg);
  await db.query(
    \`UPDATE sends SET status = $2 WHERE idem_key = $1\`,
    [key, res.status]);
}`,
    },
  },
  {
    title: 'Agent Orchestration — Claude Code Router + Subagents',
    role: 'Builder / Operator',
    status: 'IN DAILY USE',
    body: 'Multi-agent development system on Claude Code: a router that classifies incoming work and dispatches to specialized subagents with scoped tools and behavioral files. The workflow behind everything else on this page.',
    stack: ['Claude Code', 'MCP', 'TypeScript'],
    code: {
      caption: 'PATTERN EXCERPT — LANE-BASED DISPATCH, SCOPE AS THE SAFETY MODEL',
      source: `// The router classifies incoming work, then dispatches to a
// subagent with ONLY the tools that job needs.
const LANES: Lane[] = [
  { match: /migration|schema|\\.sql/i,
    agent: 'db-surgeon',  tools: ['Read', 'Bash(psql *)'] },
  { match: /\\.test\\.|spec|coverage/i,
    agent: 'test-runner', tools: ['Read', 'Bash(npm test*)'] },
  { match: /review|audit/i,
    agent: 'reviewer',    tools: ['Read', 'Grep'] },
];

export function route(task: Task): Dispatch {
  const lane = LANES.find(l => l.match.test(task.summary)) ?? DEFAULT_LANE;
  return { agent: lane.agent, tools: lane.tools, prompt: brief(task, lane) };
}`,
    },
  },
  {
    title: 'goodgame.md',
    role: 'Builder',
    status: "LIVE — YOU'RE ON IT",
    body: 'This site. Community-graded behavioral disposition files for Claude Code — the why layer of AI configuration. Leaderboard, archetype quiz, curl-to-install. Full source is public.',
    stack: ['React', 'Node', 'Tailwind'],
    repo: 'https://github.com/TronQuix0te/goodgame.md',
    code: {
      caption: "REAL CODE FROM THIS SITE — THE JUDGE'S RESPONSE HANDLER",
      source: `// Model output is never trusted: every scoring dimension is
// validated and clamped before it touches the leaderboard.
const scores = JSON.parse(text.trim());

const dims = ['archetype_purity', 'consistency',
              'token_efficiency', 'signal_density', 'clarity'] as const;
for (const dim of dims) {
  if (typeof scores[dim] !== 'number' || isNaN(scores[dim])) {
    scores[dim] = 50;
  }
  scores[dim] = Math.max(0, Math.min(100, Math.round(scores[dim] * 10) / 10));
}`,
    },
  },
];

function CodeBlock({ demo }: { demo: CodeDemo }) {
  return (
    <div className="mt-4 border border-t-dim/20 bg-white/[0.02]">
      <div className="px-4 py-2 border-b border-t-dim/20 text-xs text-t-dim/60 uppercase tracking-widest">
        {demo.caption}
      </div>
      <pre className="p-4 text-xs leading-relaxed overflow-x-auto">
        {demo.source.split('\n').map((line, i) => (
          <div key={i} className={line.trimStart().startsWith('//') ? 'text-t-dim/50' : 'text-t-mid'}>
            {line || ' '}
          </div>
        ))}
      </pre>
    </div>
  );
}

export default function Work() {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <div>
      <div className="py-8">
        <div className="text-2xl font-bold text-t-hi uppercase tracking-widest mb-2">WORK</div>
        <div className="text-xs text-t-dim uppercase tracking-widest">
          A RUNNING LOG OF WHAT'S BEEN BUILT — ANONYMIZED. NAMES AND DETAILS SHARED ON CALLS.
        </div>
      </div>

      <div className="py-6">
        {ENTRIES.map((entry, i) => (
          <div key={entry.title}>
            <div className="py-6">
              <div className="flex items-start justify-between gap-6 mb-2">
                <div className="text-base text-t-fg uppercase tracking-wider">{entry.title}</div>
                <span className="text-xs text-t-accent uppercase tracking-widest whitespace-nowrap mt-1">
                  {entry.status}
                </span>
              </div>
              <div className="text-xs text-t-dim/50 uppercase tracking-widest mb-3">{entry.role}</div>
              <div className="text-sm text-t-dim leading-relaxed">{entry.body}</div>
              {entry.stack && (
                <div className="text-xs text-t-dim/50 mt-3 uppercase tracking-widest">
                  {entry.stack.map(s => `#${s}`).join('  ')}
                </div>
              )}
              {entry.repo && (
                <a
                  href={entry.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 mr-6 text-xs text-t-accent/80 hover:text-t-accent transition-colors uppercase tracking-widest"
                >
                  [SOURCE → GITHUB]
                </a>
              )}
              {entry.code && (
                <>
                  <button
                    onClick={() => setOpen(o => ({ ...o, [entry.title]: !o[entry.title] }))}
                    className="mt-3 text-xs text-t-dim hover:text-t-accent transition-colors uppercase tracking-widest"
                  >
                    [{open[entry.title] ? 'HIDE CODE' : 'VIEW CODE'}]
                  </button>
                  {open[entry.title] && <CodeBlock demo={entry.code} />}
                </>
              )}
            </div>
            {i < ENTRIES.length - 1 && <div className="border-b border-t-dim/10" />}
          </div>
        ))}
      </div>
    </div>
  );
}
