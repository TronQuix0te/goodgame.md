import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

const ARCHETYPE_DETAILS: Record<string, { color: string; philosophy: string; strengths: string[]; weaknesses: string[]; ideal: string }> = {
  gofast: {
    color: '#ff2020',
    philosophy: 'Speed is the priority. The fastest path to feedback is shipping. Asking questions is slower than guessing and iterating. Wrong code that exists is more useful than correct code that does not.',
    strengths: ['Maximum velocity on well-understood tasks', 'No analysis paralysis', 'Great for prototyping and MVPs', 'Matches senior devs who think faster than they type'],
    weaknesses: ['Can miss edge cases', 'May need cleanup passes later', 'Not ideal for safety-critical code', 'Can feel reckless on unfamiliar codebases'],
    ideal: 'Prototyping, hackathons, solo projects, well-understood domains, experienced developers who want Claude to match their pace.',
  },
  control: {
    color: '#2080ff',
    philosophy: 'Correctness is the priority. Understanding before action. Every ambiguity is a potential bug. The cost of asking a question is always less than the cost of fixing a wrong assumption in production.',
    strengths: ['Catches edge cases early', 'Produces well-documented code', 'Great for complex systems', 'Ideal for regulated industries'],
    weaknesses: ['Slower iteration speed', 'Can over-engineer simple tasks', 'May ask obvious questions', 'Analysis paralysis on clear tasks'],
    ideal: 'Production systems, security-sensitive code, team environments where correctness matters more than speed, onboarding into unfamiliar codebases.',
  },
  midrange: {
    color: '#20cc60',
    philosophy: 'Context determines approach. Some tasks need speed, others need caution. The best behavioral mode is the one that matches the current situation, not a fixed ideology.',
    strengths: ['Adaptable to any situation', 'Good judgment on when to ask vs act', 'Natural for most developers', 'Low friction across task types'],
    weaknesses: ['No strong advantage in any extreme', 'Can be indecisive', 'Jack of all trades', 'Less predictable than pure archetypes'],
    ideal: 'General-purpose development, teams with mixed experience levels, projects that vary between exploration and production hardening.',
  },
  tempo: {
    color: '#ffaa20',
    philosophy: 'Every token matters. Compression is a virtue. The best instruction is the shortest one that changes behavior. If it can be said in fewer words, it should be.',
    strengths: ['Extremely efficient responses', 'Low context consumption', 'Forces clear thinking', 'Great signal-to-noise ratio'],
    weaknesses: ['Can be too terse for learning', 'May skip helpful context', 'Not ideal for onboarding', 'Can feel abrupt'],
    ideal: 'Experienced developers who value brevity, token-budget-conscious workflows, high-volume sessions where context window matters.',
  },
  combo: {
    color: '#aa20ff',
    philosophy: 'Specialization beats generalization. A behavioral file tuned for one specific workflow will outperform a general-purpose file every time. First-principles thinking over convention.',
    strengths: ['Highly optimized for specific use cases', 'Creative problem solving', 'Challenges assumptions', 'Unique behavioral profiles'],
    weaknesses: ['May not transfer well across tasks', 'Can be too opinionated', 'Harder to score against pure archetypes', 'Niche appeal'],
    ideal: 'Specialized workflows (DevOps, data pipelines, API design), developers with strong opinions about how Claude should behave in their domain.',
  },
};

export default function ArchetypeDetail() {
  const { id } = useParams<{ id: string }>();
  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const archetype = id ? ARCHETYPE_DETAILS[id.toLowerCase()] : null;
  const archId = id?.toUpperCase() || '';

  useEffect(() => {
    if (!id) return;
    api<{ builds: any[] }>(`/builds/leaderboard?archetype=${id.toUpperCase()}&limit=10`)
      .then(d => setBuilds(d.builds))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (!archetype) return <div className="text-t-dim text-center py-16 text-sm uppercase tracking-widest">ARCHETYPE NOT FOUND</div>;

  return (
    <div>
      <Link to="/" className="text-xs text-t-dim uppercase tracking-widest hover:text-t-accent transition-colors">
        &larr; BACK TO BOARD
      </Link>

      <div className="py-10">
        <div className="text-4xl font-bold uppercase tracking-widest mb-4" style={{ color: archetype.color }}>
          {archId}
        </div>
        <div className="text-sm text-t-mid leading-relaxed max-w-xl">{archetype.philosophy}</div>
      </div>

      <div className="grid grid-cols-2 gap-8 py-6">
        <div>
          <div className="text-xs text-t-dim uppercase tracking-widest mb-3">STRENGTHS</div>
          {archetype.strengths.map((s, i) => (
            <div key={i} className="text-sm text-t-mid py-1">+ {s}</div>
          ))}
        </div>
        <div>
          <div className="text-xs text-t-dim uppercase tracking-widest mb-3">WEAKNESSES</div>
          {archetype.weaknesses.map((w, i) => (
            <div key={i} className="text-sm text-t-dim py-1">- {w}</div>
          ))}
        </div>
      </div>

      <div className="py-6">
        <div className="text-xs text-t-dim uppercase tracking-widest mb-3">IDEAL FOR</div>
        <div className="text-sm text-t-mid">{archetype.ideal}</div>
      </div>

      <div className="py-6 border-t border-t-dim/10">
        <div className="text-xs text-t-dim uppercase tracking-widest mb-4">TOP {archId} BUILDS</div>
        {loading ? (
          <div className="text-t-dim text-sm uppercase tracking-widest">LOADING<span className="cursor-blink" /></div>
        ) : builds.length === 0 ? (
          <div className="text-t-dim text-sm uppercase tracking-widest">NO BUILDS YET</div>
        ) : (
          builds.map(b => (
            <Link
              key={b.id}
              to={`/build/${b.name}`}
              className="flex items-center py-3 border-b border-t-dim/10 hover:bg-white/[0.02] transition-colors group"
            >
              <span className="text-lg font-bold text-t-hi w-16 text-right">{(b.gg_score ?? 0).toFixed(1)}</span>
              <div className="ml-6 flex-1">
                <span className="text-sm text-t-fg uppercase tracking-wider group-hover:text-t-accent">@{b.name}</span>
                <span className="text-xs text-t-dim ml-3">BY {b.author}</span>
              </div>
              <span className="text-xs text-t-dim">{b.pull_count} PULLS</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
