import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Archetype { id: string; name: string; color: string; }
interface Season { id: number; name: string; model_tag: string; is_active: number; }

export default function Leaderboard() {
  const [builds, setBuilds] = useState<any[]>([]);
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [featured, setFeatured] = useState<any>(null);
  const [trending, setTrending] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [seasonId, setSeasonId] = useState<number | undefined>(undefined);
  const [view, setView] = useState<'board' | 'trending'>('board');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ archetypes: Archetype[] }>('/archetypes').then(d => setArchetypes(d.archetypes)).catch(() => {});
    api<{ seasons: Season[] }>('/seasons').then(d => setSeasons(d.seasons)).catch(() => {});
    api<{ build: any }>('/builds/featured').then(d => setFeatured(d.build)).catch(() => {});
    api<{ builds: any[] }>('/builds/trending').then(d => setTrending(d.builds)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('archetype', filter);
    if (seasonId) params.set('season_id', String(seasonId));
    const qs = params.toString() ? `?${params}` : '';
    api<{ builds: any[] }>(`/builds/leaderboard${qs}`)
      .then(data => setBuilds(data.builds))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, seasonId]);

  const activeSeason = seasons.find(s => s.is_active);
  const currentSeason = seasonId ? seasons.find(s => s.id === seasonId) : activeSeason;
  const totalPulls = builds.reduce((s, b) => s + (b.pull_count || 0), 0);
  const displayBuilds = view === 'trending' ? trending : builds;

  return (
    <div>
      {/* Install */}
      <div className="mb-6">
        <div className="text-xs text-t-dim uppercase tracking-widest mb-1">INSTALL ANY BUILD</div>
        <div className="text-sm sm:text-lg text-t-hi overflow-x-auto">
          $ curl goodgame.md/@name {'>'} goodgame.md<span className="cursor-blink ml-1" />
        </div>
      </div>

      {/* Featured Build of the Week */}
      {featured && (
        <Link to={`/build/${featured.name}`} className="block py-4 mb-4 border border-t-accent/20 px-4 hover:border-t-accent/40 transition-colors">
          <div className="text-xs text-t-accent uppercase tracking-widest mb-2">BUILD OF THE WEEK</div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-base sm:text-lg font-bold text-t-hi">@{featured.name}</span>
              <span className="text-xs sm:text-sm text-t-dim ml-3 uppercase tracking-widest">{featured.archetype_name}</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-t-accent">{(featured.gg_score ?? 0).toFixed(1)}</span>
          </div>
          <div className="text-xs text-t-dim mt-1">{featured.title}</div>
        </Link>
      )}

      {/* Stats */}
      <div className="flex gap-10 py-6 uppercase tracking-widest">
        <div>
          <span className="text-2xl sm:text-3xl font-bold text-t-accent">{builds.length}</span>
          <span className="text-xs text-t-dim ml-2">BUILDS</span>
        </div>
        <div>
          <span className="text-2xl sm:text-3xl font-bold text-t-accent">{totalPulls}</span>
          <span className="text-xs text-t-dim ml-2">PULLS</span>
        </div>
      </div>

      {/* Season Switcher */}
      {seasons.length > 1 && (
        <div className="flex flex-wrap gap-3 py-3 text-xs uppercase tracking-widest">
          <span className="text-t-dim">SEASON:</span>
          {seasons.map(s => (
            <button
              key={s.id}
              onClick={() => setSeasonId(s.id === seasonId ? undefined : s.id)}
              className={`transition-colors ${
                (seasonId === s.id || (!seasonId && s.is_active))
                  ? 'text-t-accent'
                  : 'text-t-dim hover:text-t-accent'
              }`}
            >
              {s.name}{s.is_active ? '' : ' (ENDED)'}
            </button>
          ))}
        </div>
      )}

      {/* View Toggle + Archetype Filters */}
      <div className="flex flex-wrap gap-3 sm:gap-6 py-4 text-xs sm:text-sm uppercase tracking-widest">
        <button
          onClick={() => setView('board')}
          className={`transition-colors ${view === 'board' ? 'text-t-accent' : 'text-t-dim hover:text-t-accent'}`}
        >
          BOARD
        </button>
        <button
          onClick={() => setView('trending')}
          className={`transition-colors ${view === 'trending' ? 'text-t-accent' : 'text-t-dim hover:text-t-accent'}`}
        >
          TRENDING
        </button>
        <span className="text-t-dim/30">|</span>
        <button
          onClick={() => { setFilter(''); setView('board'); }}
          className={`transition-colors ${!filter && view === 'board' ? 'text-t-accent' : 'text-t-dim hover:text-t-accent'}`}
        >
          ALL
        </button>
        {archetypes.map(a => (
          <button
            key={a.id}
            onClick={() => { setFilter(filter === a.id ? '' : a.id); setView('board'); }}
            className={`transition-colors ${filter === a.id ? 'text-t-accent' : 'text-t-dim hover:text-t-accent'}`}
          >
            {a.name}
          </button>
        ))}
      </div>

      {/* Build List */}
      <div className="py-4">
        {loading && view === 'board' ? (
          <div className="text-t-dim text-sm uppercase tracking-widest py-12">
            LOADING<span className="cursor-blink" />
          </div>
        ) : displayBuilds.length === 0 ? (
          <div className="text-t-dim text-sm uppercase tracking-widest py-12">NO BUILDS FOUND</div>
        ) : (
          <>
            {/* Desktop: terminal table */}
            <div className="hidden sm:block">
              <pre className="text-sm leading-loose">
                <span className="text-t-dim">
                  {'  # '}{' SCORE'.padEnd(8)}{'NAME'.padEnd(24)}{'TYPE'.padEnd(14)}
                  {view === 'trending' ? 'RECENT'.padEnd(8) : 'PULLS'.padEnd(8)}TITLE{'\n'}
                </span>
                <span className="text-t-dim/30">{'─'.repeat(78)}{'\n'}</span>
                {displayBuilds.map((b, i) => {
                  const rank = String(i + 1).padStart(3);
                  const score = (b.gg_score ?? 0).toFixed(1).padStart(5).padEnd(8);
                  const champ = b.is_champion ? '★ ' : '  ';
                  const name = `@${b.name}`.slice(0, 20).padEnd(22);
                  const type = b.archetype_name.toLowerCase().padEnd(14);
                  const pullCol = view === 'trending'
                    ? String(b.recent_pulls || 0).padEnd(8)
                    : String(b.pull_count).padEnd(8);
                  const title = (b.title || '').slice(0, 28);
                  const isTop3 = i < 3;

                  return (
                    <Link key={b.id} to={`/build/${b.name}`} className="block hover:bg-t-accent/5 transition-colors">
                      <span className={isTop3 ? 'text-t-accent font-bold' : 'text-t-dim'}>{rank} </span>
                      <span className={isTop3 ? 'text-t-accent font-bold' : 'text-t-fg'}>{score}</span>
                      <span className={b.is_champion ? 'text-t-accent' : 'text-t-dim/0'}>{champ}</span>
                      <span className={isTop3 ? 'text-t-hi font-bold' : 'text-t-fg'}>{name}</span>
                      <span className="text-t-dim">{type}</span>
                      <span className="text-t-dim">{pullCol}</span>
                      <span className="text-t-dim/60">{title}</span>
                      {'\n'}
                    </Link>
                  );
                })}
                <span className="text-t-dim/30">{'\n'}{'─'.repeat(78)}{'\n'}</span>
                <span className="text-t-dim">
                  {displayBuilds.length} results
                  {view === 'trending' ? ' · last 7 days' : ''}
                  {currentSeason && view === 'board' ? ` · ${currentSeason.name}` : ''}{'\n'}
                </span>
              </pre>
            </div>

            {/* Mobile: card list */}
            <div className="sm:hidden space-y-1">
              {displayBuilds.map((b, i) => (
                <Link
                  key={b.id}
                  to={`/build/${b.name}`}
                  className="flex items-center py-3 border-b border-t-dim/10 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-8 text-right text-xs text-t-dim">{i + 1}</div>
                  <div className="w-14 text-right text-base font-bold text-t-accent ml-2">
                    {(b.gg_score ?? 0).toFixed(1)}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-t-hi font-bold truncate">@{b.name}</span>
                      {b.is_champion ? <span className="text-t-accent text-xs">★</span> : null}
                    </div>
                    <div className="text-xs text-t-dim uppercase tracking-widest">
                      {b.archetype_name} &middot; {view === 'trending' ? `${b.recent_pulls || 0} RECENT` : `${b.pull_count} PULLS`}
                    </div>
                  </div>
                </Link>
              ))}
              <div className="text-xs text-t-dim uppercase tracking-widest py-4">
                {displayBuilds.length} results
                {view === 'trending' ? ' · last 7 days' : ''}
                {currentSeason && view === 'board' ? ` · ${currentSeason.name}` : ''}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
