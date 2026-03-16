import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newModelTag, setNewModelTag] = useState('');
  const [confirmEnd, setConfirmEnd] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.is_admin) { navigate('/'); return; }
    loadSeasons();
  }, [user, navigate]);

  const loadSeasons = () => {
    api<{ seasons: any[] }>('/admin/seasons')
      .then(data => setSeasons(data.seasons))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api('/admin/seasons', {
        method: 'POST',
        body: JSON.stringify({ name: newName, model_tag: newModelTag }),
      });
      setNewName('');
      setNewModelTag('');
      loadSeasons();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEndSeason = async (id: number) => {
    try {
      await api(`/admin/seasons/${id}/end`, { method: 'POST' });
      setConfirmEnd(null);
      loadSeasons();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user?.is_admin) return null;

  return (
    <div>
      <div className="py-8">
        <div className="text-2xl font-bold text-t-hi uppercase tracking-widest mb-2">ADMIN</div>
        <div className="text-xs text-t-dim uppercase tracking-widest">SEASON MANAGEMENT</div>
      </div>

      {error && <div className="text-t-red text-sm mb-6 uppercase tracking-wider">ERROR: {error}</div>}

      {/* Create Season */}
      <div className="py-6 border-b border-t-dim/10">
        <div className="text-xs text-t-dim uppercase tracking-widest mb-4">NEW SEASON</div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <div className="text-xs text-t-dim uppercase tracking-widest mb-1">NAME</div>
            <div className="flex items-center border-b border-t-dim/30 pb-1">
              <span className="text-t-dim mr-2">&gt;</span>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. SONNET 4.5 ERA"
                className="bg-transparent border-none outline-none text-t-hi flex-1 uppercase tracking-wider"
                required
              />
            </div>
          </div>
          <div>
            <div className="text-xs text-t-dim uppercase tracking-widest mb-1">MODEL TAG</div>
            <div className="flex items-center border-b border-t-dim/30 pb-1">
              <span className="text-t-dim mr-2">&gt;</span>
              <input
                type="text"
                value={newModelTag}
                onChange={e => setNewModelTag(e.target.value)}
                placeholder="e.g. claude-sonnet-4-5-20260101"
                className="bg-transparent border-none outline-none text-t-hi flex-1 tracking-wider"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={!newName || !newModelTag}
            className="text-sm text-t-hi hover:text-t-accent uppercase tracking-widest disabled:text-t-dim">
            [CREATE SEASON]
          </button>
          <div className="text-xs text-t-dim uppercase tracking-widest">
            CREATING A NEW SEASON AUTOMATICALLY ENDS THE CURRENT ONE
          </div>
        </form>
      </div>

      {/* Season List */}
      <div className="py-6">
        <div className="text-xs text-t-dim uppercase tracking-widest mb-4">ALL SEASONS</div>
        {loading ? (
          <div className="text-t-dim text-sm uppercase tracking-widest">LOADING<span className="cursor-blink" /></div>
        ) : (
          <div className="space-y-4">
            {seasons.map(s => (
              <div key={s.id} className="py-3 border-b border-t-dim/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-t-hi font-bold uppercase tracking-wider">{s.name}</span>
                    {s.is_active ? (
                      <span className="text-xs text-t-accent ml-3 border border-t-accent/40 px-2 py-0.5 uppercase tracking-widest">ACTIVE</span>
                    ) : (
                      <span className="text-xs text-t-dim ml-3 uppercase tracking-widest">ENDED</span>
                    )}
                  </div>
                  {s.is_active && (
                    confirmEnd === s.id ? (
                      <span className="text-xs uppercase tracking-widest">
                        <span className="text-t-red">END SEASON? </span>
                        <button onClick={() => handleEndSeason(s.id)} className="text-t-red hover:text-t-hi">[YES]</button>
                        <button onClick={() => setConfirmEnd(null)} className="text-t-dim hover:text-t-hi ml-2">[NO]</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmEnd(s.id)} className="text-xs text-t-dim hover:text-t-red uppercase tracking-widest">
                        [END SEASON]
                      </button>
                    )
                  )}
                </div>
                <div className="text-xs text-t-dim uppercase tracking-widest mt-1">
                  {s.model_tag} &middot; STARTED {s.starts_at?.slice(0, 10)}
                  {s.ends_at && ` · ENDED ${s.ends_at.slice(0, 10)}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
