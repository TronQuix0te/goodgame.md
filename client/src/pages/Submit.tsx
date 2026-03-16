import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Archetype { id: string; name: string; color: string; }

export default function Submit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [archetypes, setArchetypes] = useState<Archetype[]>([]);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [archetypeId, setArchetypeId] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ archetypes: Archetype[] }>('/archetypes').then(d => setArchetypes(d.archetypes)).catch(() => {});
  }, []);

  if (!user) {
    return (
      <div className="py-16 text-sm uppercase tracking-widest">
        <span className="text-t-dim">LOGIN REQUIRED. </span>
        <a href="/login" className="text-t-hi hover:text-t-accent">[LOGIN]</a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api<any>('/builds', {
        method: 'POST',
        body: JSON.stringify({ name, title, description, archetype_id: archetypeId, content }),
      });
      navigate(`/build/${data.name}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const slug = name.toLowerCase().replace(/[^a-z0-9_-]/g, '');

  return (
    <div>
      <div className="text-2xl font-bold text-t-hi uppercase tracking-widest mb-2">SUBMIT BUILD</div>
      <div className="text-xs text-t-dim uppercase tracking-widest mb-8">SHARE YOUR BEHAVIORAL DISPOSITION FILE</div>

      <form onSubmit={handleSubmit} className="py-8">
        <div className="mb-8">
          <div className="text-xs text-t-dim uppercase tracking-widest mb-3">SLUG</div>
          <div className="flex items-center border-b border-t-dim/30 pb-2">
            <span className="text-t-dim mr-1">@</span>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="MY-BUILD" maxLength={40} required
              className="bg-transparent border-none outline-none text-t-hi text-base flex-1 uppercase tracking-wider placeholder:text-t-dim/30" />
          </div>
          {slug && <div className="text-xs text-t-dim mt-2 uppercase tracking-widest">→ GOODGAME.MD/@{slug.toUpperCase()}</div>}
        </div>

        <div className="mb-8">
          <div className="text-xs text-t-dim uppercase tracking-widest mb-3">TITLE</div>
          <div className="border-b border-t-dim/30 pb-2">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="WHAT THIS BUILD DOES" required
              className="w-full bg-transparent border-none outline-none text-t-hi text-base uppercase tracking-wider placeholder:text-t-dim/30" />
          </div>
        </div>

        <div className="mb-8">
          <div className="text-xs text-t-dim uppercase tracking-widest mb-3">DESCRIPTION <span className="text-t-dim/30">(OPTIONAL)</span></div>
          <div className="border-b border-t-dim/30 pb-2">
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="LONGER DESCRIPTION"
              className="w-full bg-transparent border-none outline-none text-t-fg text-base tracking-wider placeholder:text-t-dim/30" />
          </div>
        </div>

        <div className="my-8">
          <div className="text-xs text-t-dim uppercase tracking-widest mb-4">ARCHETYPE</div>
          <div className="flex flex-wrap gap-4 text-sm uppercase tracking-widest">
            {archetypes.map(a => (
              <button key={a.id} type="button" onClick={() => setArchetypeId(a.id)}
                className={`transition-opacity ${archetypeId === a.id ? 'text-t-hi' : 'text-t-dim hover:text-t-mid'}`}>
                {archetypeId === a.id ? `[${a.name}]` : a.name}
              </button>
            ))}
          </div>
        </div>

        <div className="my-8">
          <div className="text-xs text-t-dim uppercase tracking-widest mb-3">CONTENT</div>
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="PASTE BEHAVIORAL FILE..."
            rows={10} required
            className="w-full bg-transparent border border-t-dim/20 outline-none text-t-mid p-4 text-sm leading-relaxed resize-y focus:border-t-dim/50 placeholder:text-t-dim/20" />
          {content && (
            <div className="text-xs text-t-dim mt-2 uppercase tracking-widest">
              {content.split('\n').length}L &middot; {content.trim().split(/\s+/).length}W &middot; {new Blob([content]).size}B
            </div>
          )}
        </div>

        {error && <div className="text-t-red text-sm mb-6 uppercase tracking-wider">ERROR: {error}</div>}

        <button type="submit"
          disabled={submitting || !name || !title || !archetypeId || !content}
          className="text-sm text-t-hi hover:text-t-accent uppercase tracking-widest disabled:text-t-dim transition-opacity">
          [{submitting ? 'SUBMITTING...' : 'SUBMIT'}]
        </button>
      </form>
    </div>
  );
}
