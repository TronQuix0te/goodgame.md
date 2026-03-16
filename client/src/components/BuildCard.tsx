import { Link } from 'react-router-dom';

interface Build {
  id: number;
  name: string;
  title: string;
  author: string;
  archetype_name: string;
  archetype_color: string;
  gg_score: number | null;
  vote_count: number;
  pull_count: number;
}

function TopCard({ build, rank }: { build: Build; rank: number }) {
  const score = build.gg_score ?? 0;
  const filled = Math.round(score / 5);

  return (
    <Link to={`/build/${build.id}`} className="term-window group block hover:border-gg-muted/50 transition-colors">
      <div className="term-bar">
        <span className="flex-1">@{build.name}</span>
        <span style={{ color: build.archetype_color + '99' }}>{build.archetype_name}</span>
      </div>
      <div className="term-body">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-gg-muted text-xs">#{rank}</span>
          <div className="text-right">
            <span className="text-xl font-bold tabular-nums" style={{ color: build.archetype_color }}>
              {score.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="score-blocks text-[11px] mb-3" style={{ color: build.archetype_color }}>
          {'█'.repeat(filled)}
          <span className="text-gg-border">{'░'.repeat(20 - filled)}</span>
        </div>

        <p className="text-xs text-gg-muted mb-3 line-clamp-2 leading-relaxed">{build.title}</p>

        <div className="flex items-center justify-between text-[10px] text-gg-muted/50">
          <span>{build.author}</span>
          <span>▲{build.vote_count} ↓{build.pull_count}</span>
        </div>
      </div>
    </Link>
  );
}

function ListRow({ build, rank }: { build: Build; rank: number }) {
  const score = build.gg_score ?? 0;

  return (
    <Link
      to={`/build/${build.id}`}
      className="group flex items-center gap-3 px-3 py-2 hover:bg-gg-surface-light transition-colors"
    >
      <span className="text-gg-muted/30 text-[10px] w-5 text-right tabular-nums">{rank}</span>

      <span
        className="text-xs font-bold tabular-nums w-12 text-right"
        style={{ color: build.archetype_color }}
      >
        {score.toFixed(1)}
      </span>

      <span className="text-[10px]" style={{ color: build.archetype_color + '66' }}>│</span>

      <span className="text-gg-text text-xs group-hover:text-white transition-colors flex-shrink-0">
        @{build.name}
      </span>

      <span className="text-[10px]" style={{ color: build.archetype_color + '55' }}>
        [{build.archetype_name}]
      </span>

      <span className="text-xs text-gg-muted/40 truncate flex-1">{build.title}</span>

      <span className="text-[10px] text-gg-muted/30 tabular-nums flex-shrink-0 hidden sm:inline">
        ▲{build.vote_count} ↓{build.pull_count}
      </span>

      <span className="text-[10px] text-gg-muted/20 flex-shrink-0 hidden md:inline">
        {build.author}
      </span>
    </Link>
  );
}

export default function BuildCard({ build, rank }: { build: Build; rank: number }) {
  if (rank <= 3) return <TopCard build={build} rank={rank} />;
  return <ListRow build={build} rank={rank} />;
}
