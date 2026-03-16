import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuild, setSelectedBuild] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{ day: string; pulls: number }[]>([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api<any[]>('/users/me/builds')
      .then(setBuilds)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const loadAnalytics = async (buildName: string) => {
    if (selectedBuild === buildName) { setSelectedBuild(null); return; }
    setSelectedBuild(buildName);
    try {
      const data = await api<{ daily_pulls: { day: string; pulls: number }[] }>(`/builds/${buildName}/analytics?days=30`);
      setAnalytics(data.daily_pulls);
    } catch {
      setAnalytics([]);
    }
  };

  if (!user) return null;

  const maxPulls = Math.max(1, ...analytics.map(d => d.pulls));

  return (
    <div>
      <div className="py-8">
        <div className="text-3xl font-bold text-t-hi uppercase tracking-wider mb-2">
          @{user.username}
        </div>
        <div className="text-xs text-t-dim uppercase tracking-widest">{builds.length} BUILDS</div>
      </div>

      {loading ? (
        <div className="text-t-dim text-center py-16 text-sm uppercase tracking-widest">LOADING<span className="cursor-blink" /></div>
      ) : builds.length === 0 ? (
        <div className="py-16 text-sm uppercase tracking-widest">
          <span className="text-t-dim">NO BUILDS YET. </span>
          <Link to="/submit" className="text-t-hi hover:text-t-accent">[SUBMIT]</Link>
        </div>
      ) : (
        <div className="py-6">
          {builds.map(b => (
            <div key={b.id}>
              <div className="flex items-center py-4 border-b border-t-dim/10 hover:bg-white/[0.02] transition-colors group">
                <Link to={`/build/${b.name}`} className="flex items-center flex-1 min-w-0">
                  <span className="text-lg font-bold text-t-hi w-16 text-right">
                    {(b.gg_score ?? 0).toFixed(1)}
                  </span>
                  <div className="ml-6 flex-1 min-w-0">
                    <div className="text-sm text-t-fg uppercase tracking-wider group-hover:text-t-accent transition-colors">
                      @{b.name}
                    </div>
                    <div className="text-xs text-t-dim uppercase tracking-widest mt-0.5">
                      {b.archetype_name} &middot; V{b.current_version} &middot; {b.pull_count} PULLS
                      {!b.is_published && ' · UNPUBLISHED'}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => loadAnalytics(b.name)}
                  className="text-xs text-t-dim hover:text-t-accent uppercase tracking-widest ml-4"
                >
                  [{selectedBuild === b.name ? 'HIDE' : 'ANALYTICS'}]
                </button>
              </div>

              {/* Pull chart */}
              {selectedBuild === b.name && analytics.length > 0 && (
                <div className="py-4 pl-22">
                  <div className="text-xs text-t-dim uppercase tracking-widest mb-3">PULLS — LAST 30 DAYS</div>
                  <div className="flex items-end gap-px h-20">
                    {analytics.map(d => (
                      <div
                        key={d.day}
                        title={`${d.day}: ${d.pulls} pulls`}
                        className="flex-1 bg-t-accent/60 hover:bg-t-accent transition-colors min-w-[3px]"
                        style={{ height: `${(d.pulls / maxPulls) * 100}%`, minHeight: d.pulls > 0 ? '2px' : '0' }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-t-dim mt-1">
                    <span>{analytics[0]?.day.slice(5)}</span>
                    <span>{analytics[analytics.length - 1]?.day.slice(5)}</span>
                  </div>
                </div>
              )}
              {selectedBuild === b.name && analytics.length === 0 && (
                <div className="py-4 text-xs text-t-dim uppercase tracking-widest">NO PULL DATA YET</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
