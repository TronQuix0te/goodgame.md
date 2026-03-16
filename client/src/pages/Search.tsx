import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const doSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query || query.length < 2) return;
    setLoading(true);
    try {
      const data = await api<{ builds: any[] }>(`/builds/search?q=${encodeURIComponent(query)}`);
      setResults(data.builds);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link to="/" className="text-xs text-t-dim uppercase tracking-widest hover:text-t-accent transition-colors">
        &larr; BACK TO BOARD
      </Link>

      <div className="py-8">
        <div className="text-2xl font-bold text-t-hi uppercase tracking-widest mb-2">SEARCH</div>
      </div>

      <form onSubmit={doSearch} className="py-4">
        <div className="flex items-center border-b border-t-dim/30 pb-2">
          <span className="text-t-dim mr-2">&gt;</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-t-hi text-lg flex-1 uppercase tracking-wider"
            placeholder="SEARCH BUILDS..."
            autoFocus
          />
          <button type="submit" disabled={loading || query.length < 2}
            className="text-sm text-t-hi hover:text-t-accent uppercase tracking-widest disabled:text-t-dim ml-4">
            [{loading ? '...' : 'SEARCH'}]
          </button>
        </div>
      </form>

      <div className="py-4">
        {searched && results.length === 0 && (
          <div className="text-t-dim text-sm uppercase tracking-widest py-8">NO RESULTS</div>
        )}
        {results.map(b => (
          <Link
            key={b.id}
            to={`/build/${b.name}`}
            className="flex items-center py-4 border-b border-t-dim/10 hover:bg-white/[0.02] transition-colors group"
          >
            <span className="text-lg font-bold text-t-hi w-16 text-right">
              {(b.gg_score ?? 0).toFixed(1)}
            </span>
            <div className="ml-6 flex-1 min-w-0">
              <div className="text-sm text-t-fg uppercase tracking-wider group-hover:text-t-accent transition-colors">
                @{b.name}
              </div>
              <div className="text-xs text-t-dim uppercase tracking-widest mt-0.5">
                {b.archetype_name} &middot; BY {b.author}
                {b.is_champion ? ' · CHAMPION' : ''}
              </div>
            </div>
            <span className="text-xs text-t-dim uppercase tracking-widest">
              {b.pull_count} PULLS
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
