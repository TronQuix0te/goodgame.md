import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import ScoreBar from '../components/ScoreBar';
import BuildAutocomplete from '../components/BuildAutocomplete';

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [nameA, setNameA] = useState(params.get('a') || '');
  const [nameB, setNameB] = useState(params.get('b') || '');

  const doCompare = () => {
    if (!nameA || !nameB) return;
    setLoading(true);
    setParams({ a: nameA, b: nameB });
    api<any>(`/builds/compare?a=${nameA}&b=${nameB}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (params.get('a') && params.get('b')) doCompare();
  }, []);

  const dims = ['archetype_purity', 'consistency', 'token_efficiency', 'signal_density', 'clarity'] as const;
  const labels: Record<string, string> = {
    archetype_purity: 'PURITY', consistency: 'CONSIST', token_efficiency: 'TOKENS',
    signal_density: 'SIGNAL', clarity: 'CLARITY',
  };

  return (
    <div>
      <Link to="/" className="text-xs text-t-dim uppercase tracking-widest hover:text-t-accent transition-colors">
        &larr; BACK TO BOARD
      </Link>

      <div className="py-8">
        <div className="text-2xl font-bold text-t-hi uppercase tracking-widest mb-2">COMPARE</div>
        <div className="text-xs text-t-dim uppercase tracking-widest">SIDE-BY-SIDE BUILD COMPARISON</div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end py-4">
        <div className="flex-1">
          <div className="text-xs text-t-dim uppercase tracking-widest mb-1">BUILD A</div>
          <BuildAutocomplete value={nameA} onChange={setNameA} placeholder="type to search..." />
        </div>
        <div className="text-t-dim text-sm uppercase tracking-widest pb-1">VS</div>
        <div className="flex-1">
          <div className="text-xs text-t-dim uppercase tracking-widest mb-1">BUILD B</div>
          <BuildAutocomplete value={nameB} onChange={setNameB} placeholder="type to search..." />
        </div>
        <button
          onClick={doCompare}
          disabled={!nameA || !nameB || loading}
          className="text-sm text-t-hi hover:text-t-accent uppercase tracking-widest disabled:text-t-dim pb-1"
        >
          [{loading ? '...' : 'COMPARE'}]
        </button>
      </div>

      {data && (
        <div className="py-6">
          {/* Score comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            {[data.a, data.b].map((build: any, i: number) => (
              <div key={i}>
                <Link to={`/build/${build.name}`} className="text-lg font-bold text-t-hi uppercase tracking-wider hover:text-t-accent">
                  @{build.name}
                </Link>
                <div className="text-xs text-t-dim uppercase tracking-widest mt-1">
                  {build.archetype_name} &middot; BY {build.author}
                </div>
                <div className="text-4xl font-bold text-t-accent mt-4">
                  {build.score?.composite?.toFixed(1) || '—'}
                </div>
                <div className="mt-4 space-y-2">
                  {dims.map(d => (
                    <ScoreBar key={d} label={labels[d]} value={build.score?.[d] || 0} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Delta */}
          {data.a.score && data.b.score && (
            <div className="py-6 border-t border-t-dim/10">
              <div className="text-xs text-t-dim uppercase tracking-widest mb-4">DELTA (A - B)</div>
              <div className="space-y-2">
                {dims.map(d => {
                  const delta = (data.a.score[d] - data.b.score[d]).toFixed(1);
                  const isPositive = parseFloat(delta) > 0;
                  return (
                    <div key={d} className="flex justify-between text-sm">
                      <span className="text-t-dim uppercase tracking-widest">{labels[d]}</span>
                      <span className={isPositive ? 'text-t-accent' : parseFloat(delta) < 0 ? 'text-t-red' : 'text-t-dim'}>
                        {isPositive ? '+' : ''}{delta}
                      </span>
                    </div>
                  );
                })}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-t-dim/10">
                  <span className="text-t-dim uppercase tracking-widest">COMPOSITE</span>
                  <span className={
                    data.a.score.composite > data.b.score.composite ? 'text-t-accent' :
                    data.a.score.composite < data.b.score.composite ? 'text-t-red' : 'text-t-dim'
                  }>
                    {(data.a.score.composite - data.b.score.composite) > 0 ? '+' : ''}
                    {(data.a.score.composite - data.b.score.composite).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Content side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-t border-t-dim/10">
            {[data.a, data.b].map((build: any, i: number) => (
              <div key={i}>
                <div className="text-xs text-t-dim uppercase tracking-widest mb-3">@{build.name}</div>
                <pre className="text-xs text-t-mid whitespace-pre-wrap leading-relaxed border-l-2 border-t-dim/20 pl-4 max-h-96 overflow-y-auto">
                  {build.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
