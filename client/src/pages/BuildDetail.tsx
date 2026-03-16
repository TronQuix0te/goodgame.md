import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { copyToClipboard } from '../lib/clipboard';
import { useAuth } from '../context/AuthContext';
import ScoreBar from '../components/ScoreBar';

export default function BuildDetail() {
  const { name: buildName } = useParams<{ name: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [build, setBuild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [voted, setVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rejudging, setRejudging] = useState(false);
  const [forking, setForking] = useState(false);
  const [forkName, setForkName] = useState('');
  const [contentExpanded, setContentExpanded] = useState(false);

  useEffect(() => {
    if (!buildName) return;
    api<any>(`/builds/${buildName}`)
      .then(data => {
        setBuild(data);
        setVoted(data.has_voted);
        setVoteCount(data.vote_count);
        setEditTitle(data.title);
        setEditDesc(data.description || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [buildName]);

  const handleCopy = async () => {
    if (!build) return;
    const ok = await copyToClipboard(build.content);
    if (ok) {
      setCopied(true);
      api(`/builds/${build.name}/copy`, { method: 'POST' }).catch(() => {});
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVote = async () => {
    if (!user || !build) return;
    const data = await api<{ voted: boolean; vote_count: number }>(`/builds/${build.name}/vote`, {
      method: 'POST',
    });
    setVoted(data.voted);
    setVoteCount(data.vote_count);
  };

  const handleSaveEdit = async () => {
    if (!build) return;
    const updated = await api<any>(`/builds/${build.name}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: editTitle, description: editDesc }),
    });
    setBuild({ ...build, ...updated });
    setEditing(false);
  };

  const handleTogglePublish = async () => {
    if (!build) return;
    const updated = await api<any>(`/builds/${build.name}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_published: !build.is_published }),
    });
    setBuild({ ...build, ...updated });
  };

  const handleRejudge = async () => {
    if (!build) return;
    setRejudging(true);
    try {
      await api(`/builds/${build.name}/rejudge`, { method: 'POST' });
      // Reload build to get new scores
      const data = await api<any>(`/builds/${build.name}`);
      setBuild(data);
    } catch (err: any) {
      console.error('Re-judge failed:', err);
    } finally {
      setRejudging(false);
    }
  };

  const handleFork = async () => {
    if (!build || !forkName) return;
    try {
      const data = await api<any>(`/builds/${build.name}/fork`, {
        method: 'POST',
        body: JSON.stringify({ name: forkName }),
      });
      navigate(`/build/${data.name}`);
    } catch (err: any) {
      console.error('Fork failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!build) return;
    await api(`/builds/${build.name}`, { method: 'DELETE' });
    navigate('/profile');
  };

  if (loading) return <div className="text-t-dim text-center py-16 text-sm uppercase tracking-widest">LOADING<span className="cursor-blink" /></div>;
  if (!build) return <div className="text-t-dim text-center py-16 text-sm uppercase tracking-widest">BUILD NOT FOUND</div>;

  const score = build.score;
  const isOwner = build.is_owner;

  return (
    <div>
      <Link to="/" className="text-xs text-t-dim uppercase tracking-widest hover:text-t-accent transition-colors">
        &larr; BACK TO BOARD
      </Link>

      {/* Header */}
      <div className="py-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl sm:text-5xl font-bold text-t-hi uppercase tracking-wider">
            @{build.name}
          </div>
          {build.is_champion === 1 && (
            <span className="text-xs text-t-accent border border-t-accent/40 px-2 py-0.5 uppercase tracking-widest">CHAMPION</span>
          )}
          {!build.is_published && (
            <span className="text-xs text-t-red border border-t-red/40 px-2 py-0.5 uppercase tracking-widest">UNPUBLISHED</span>
          )}
        </div>
        <div className="text-sm text-t-dim uppercase tracking-widest mb-2">
          {build.archetype_name} &middot; V{build.current_version} &middot; BY <Link to={`/user/${build.author}`} className="hover:text-t-accent">{build.author}</Link>
        </div>
        {build.forked_from_build && (
          <div className="text-xs text-t-dim uppercase tracking-widest mb-2">
            FORKED FROM <Link to={`/build/${build.forked_from_build.name}`} className="text-t-accent hover:text-t-hi">@{build.forked_from_build.name}</Link> BY {build.forked_from_build.author}
          </div>
        )}
        {build.fork_count > 0 && (
          <div className="text-xs text-t-dim uppercase tracking-widest mb-2">{build.fork_count} FORK{build.fork_count !== 1 ? 'S' : ''}</div>
        )}

        {editing ? (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-t-dim uppercase tracking-widest mb-1">TITLE</div>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="bg-transparent border-b border-t-dim/30 outline-none text-t-hi w-full py-1"
              />
            </div>
            <div>
              <div className="text-xs text-t-dim uppercase tracking-widest mb-1">DESCRIPTION</div>
              <input
                type="text"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                className="bg-transparent border-b border-t-dim/30 outline-none text-t-mid w-full py-1"
              />
            </div>
            <div className="flex gap-4 text-sm uppercase tracking-widest">
              <button onClick={handleSaveEdit} className="text-t-accent hover:text-t-hi">[SAVE]</button>
              <button onClick={() => setEditing(false)} className="text-t-dim hover:text-t-hi">[CANCEL]</button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-base text-t-mid">{build.title}</div>
            {build.description && <div className="text-sm text-t-dim mt-1">{build.description}</div>}
          </>
        )}
      </div>

      {/* Owner controls */}
      {isOwner && !editing && (
        <div className="flex gap-4 pb-6 text-xs uppercase tracking-widest">
          <button onClick={() => setEditing(true)} className="text-t-dim hover:text-t-accent">[EDIT]</button>
          <button onClick={handleRejudge} disabled={rejudging} className="text-t-dim hover:text-t-accent disabled:text-t-dim/50">
            [{rejudging ? 'JUDGING...' : 'RE-JUDGE'}]
          </button>
          <button onClick={handleTogglePublish} className="text-t-dim hover:text-t-accent">
            [{build.is_published ? 'UNPUBLISH' : 'PUBLISH'}]
          </button>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="text-t-dim hover:text-t-red">[DELETE]</button>
          ) : (
            <span>
              <span className="text-t-red">DELETE? </span>
              <button onClick={handleDelete} className="text-t-red hover:text-t-hi">[YES]</button>
              <button onClick={() => setConfirmDelete(false)} className="text-t-dim hover:text-t-hi ml-2">[NO]</button>
            </span>
          )}
        </div>
      )}

      {/* Score */}
      {score && (
        <div className="py-8">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs text-t-dim uppercase tracking-widest">COMPOSITE SCORE</span>
            <span className="text-5xl font-bold text-t-accent">{score.composite.toFixed(1)}</span>
          </div>

          <div className="space-y-3">
            <ScoreBar label="PURITY" value={score.archetype_purity} />
            <ScoreBar label="CONSIST" value={score.consistency} />
            <ScoreBar label="TOKENS" value={score.token_efficiency} />
            <ScoreBar label="SIGNAL" value={score.signal_density} />
            <ScoreBar label="CLARITY" value={score.clarity} />
          </div>

          {score.reasoning && (
            <div className="text-sm text-t-dim leading-relaxed mt-4 py-4">
              {score.reasoning}
            </div>
          )}
          <div className="text-xs text-t-dim/50 mt-2 uppercase tracking-widest">JUDGE: {score.judge_model}</div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-12 py-8">
        <div>
          <div className="text-2xl font-bold text-t-accent">{voteCount}</div>
          <div className="text-xs text-t-dim uppercase tracking-widest mt-1">VOTES</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-t-accent">{build.pull_count}</div>
          <div className="text-xs text-t-dim uppercase tracking-widest mt-1">PULLS</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-6 py-4 text-sm uppercase tracking-widest">
        <button onClick={handleCopy} className={`hover:text-t-accent transition-colors ${copied ? 'text-t-accent' : 'text-t-dim'}`}>
          [{copied ? 'COPIED' : 'COPY CONTENT'}]
        </button>
        {user && (
          <button onClick={handleVote} className={`hover:text-t-accent transition-colors ${voted ? 'text-t-accent' : 'text-t-dim'}`}>
            [VOTE]
          </button>
        )}
        {user && !isOwner && (
          <button onClick={() => setForking(!forking)} className="text-t-dim hover:text-t-accent">
            [FORK]
          </button>
        )}
      </div>

      {/* Fork form */}
      {forking && (
        <div className="flex gap-4 items-end pb-4">
          <div className="flex-1">
            <div className="flex items-center border-b border-t-dim/30 pb-1">
              <span className="text-t-dim mr-2">@</span>
              <input
                type="text"
                value={forkName}
                onChange={e => setForkName(e.target.value)}
                placeholder="your-fork-name"
                className="bg-transparent border-none outline-none text-t-hi flex-1 uppercase tracking-wider text-sm"
                autoFocus
              />
            </div>
          </div>
          <button onClick={handleFork} disabled={!forkName}
            className="text-sm text-t-accent hover:text-t-hi uppercase tracking-widest disabled:text-t-dim">
            [CREATE FORK]
          </button>
        </div>
      )}

      {/* Install */}
      <div className="py-8">
        <div className="text-xs text-t-dim uppercase tracking-widest mb-2">INSTALL</div>
        <div className="text-base text-t-hi">
          $ curl goodgame.md/@{build.name} {'>'} goodgame.md
          <button
            onClick={() => copyToClipboard(`curl goodgame.md/@${build.name} > goodgame.md`)}
            className="text-t-dim hover:text-t-accent ml-4 text-xs uppercase tracking-widest"
          >
            [COPY]
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-t-dim uppercase tracking-widest">GOODGAME.MD</span>
          <span className="text-xs text-t-dim uppercase tracking-widest">
            {build.versions?.[0]?.line_count || '?'}L &middot; {build.versions?.[0]?.word_count || '?'}W
          </span>
        </div>
        <pre className={`text-xs sm:text-sm text-t-mid whitespace-pre-wrap leading-relaxed border-l-2 border-t-dim/20 pl-4 sm:pl-6 ${!contentExpanded && build.content.split('\n').length > 20 ? 'max-h-64 overflow-hidden relative' : ''}`}>
          {build.content}
          {!contentExpanded && build.content.split('\n').length > 20 && (
            <span className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent" />
          )}
        </pre>
        {build.content.split('\n').length > 20 && (
          <button
            onClick={() => setContentExpanded(!contentExpanded)}
            className="text-xs text-t-dim hover:text-t-accent uppercase tracking-widest mt-2"
          >
            [{contentExpanded ? 'COLLAPSE' : 'EXPAND FULL CONTENT'}]
          </button>
        )}
      </div>

      {/* Versions */}
      {build.versions && build.versions.length > 1 && (
        <div className="py-6">
          <div className="text-xs text-t-dim uppercase tracking-widest mb-4">VERSIONS</div>
          {build.versions.map((v: any) => (
            <div key={v.id} className="flex items-center justify-between py-2 text-sm border-b border-t-dim/10">
              <span className={v.version === build.current_version ? 'text-t-accent' : 'text-t-dim'}>
                V{v.version} {v.version === build.current_version && '← CURRENT'}
              </span>
              <span className="text-t-dim text-xs uppercase tracking-widest">
                {v.line_count}L &middot; {v.word_count}W &middot; {v.byte_size}B
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Embed Badge */}
      <div className="py-6 border-t border-t-dim/10">
        <div className="text-xs text-t-dim uppercase tracking-widest mb-2">EMBED BADGE</div>
        <div className="flex items-center gap-4">
          <img src={`/api/builds/${build.name}/badge`} alt="gg.md score" />
          <button
            onClick={() => copyToClipboard(`[![gg.md](https://goodgame.md/api/builds/${build.name}/badge)](https://goodgame.md/build/${build.name})`)}
            className="text-xs text-t-dim hover:text-t-accent uppercase tracking-widest"
          >
            [COPY MARKDOWN]
          </button>
        </div>
      </div>

      {/* Related Builds */}
      {build.related && build.related.length > 0 && (
        <div className="py-6 border-t border-t-dim/10">
          <div className="text-xs text-t-dim uppercase tracking-widest mb-4">RELATED {build.archetype_name} BUILDS</div>
          {build.related.map((r: any) => (
            <Link
              key={r.id}
              to={`/build/${r.name}`}
              className="flex items-center py-2 border-b border-t-dim/10 hover:bg-white/[0.02] transition-colors group"
            >
              <span className="text-sm font-bold text-t-hi w-12 text-right">{(r.gg_score ?? 0).toFixed(1)}</span>
              <span className="text-sm text-t-fg uppercase tracking-wider ml-4 group-hover:text-t-accent">@{r.name}</span>
              <span className="text-xs text-t-dim ml-3">BY {r.author}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
