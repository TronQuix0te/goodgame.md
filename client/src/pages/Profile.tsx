import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [builds, setBuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api<any[]>('/users/me/builds')
      .then(setBuilds)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;

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
                  {b.archetype_name} &middot; V{b.current_version}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
