import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    api<any>(`/users/${username}`)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="text-t-dim text-center py-16 text-sm uppercase tracking-widest">LOADING<span className="cursor-blink" /></div>;
  if (!profile) return <div className="text-t-dim text-center py-16 text-sm uppercase tracking-widest">USER NOT FOUND</div>;

  return (
    <div>
      <Link to="/" className="text-xs text-t-dim uppercase tracking-widest hover:text-t-accent transition-colors">
        &larr; BACK TO BOARD
      </Link>

      <div className="py-8">
        <div className="flex items-center gap-4 mb-2">
          {profile.avatar_url && (
            <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full opacity-80" />
          )}
          <div>
            <div className="text-3xl font-bold text-t-hi uppercase tracking-wider">@{profile.username}</div>
            {profile.display_name !== profile.username && (
              <div className="text-sm text-t-dim uppercase tracking-widest">{profile.display_name}</div>
            )}
          </div>
        </div>
        <div className="text-xs text-t-dim uppercase tracking-widest mt-4">{profile.builds.length} BUILDS</div>
      </div>

      <div className="py-4">
        {profile.builds.length === 0 ? (
          <div className="text-t-dim text-sm uppercase tracking-widest py-8">NO PUBLISHED BUILDS</div>
        ) : (
          profile.builds.map((b: any) => (
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
                  {b.is_champion ? ' · CHAMPION' : ''}
                </div>
              </div>
              <span className="text-xs text-t-dim uppercase tracking-widest">
                {b.pull_count} PULLS
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
