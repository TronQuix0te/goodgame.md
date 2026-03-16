import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [username, setUsername] = useState('');
  const [error, setError] = useState(params.get('error') || '');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showLegacy, setShowLegacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(username);
      else await register(username);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="text-2xl font-bold text-t-hi uppercase tracking-widest mb-2">
        LOGIN
      </div>
      <div className="text-xs text-t-dim uppercase tracking-widest mb-8">SIGN IN TO SUBMIT AND VOTE</div>

      {error && <div className="text-t-red text-sm mb-6 uppercase tracking-wider">ERROR: {error}</div>}

      {/* GitHub OAuth */}
      <div className="py-8">
        <a
          href="/api/auth/github"
          className="inline-block text-sm text-t-hi hover:text-t-accent uppercase tracking-widest border border-t-dim/30 px-6 py-3 hover:border-t-accent transition-colors"
        >
          [SIGN IN WITH GITHUB]
        </a>
      </div>

      {/* Legacy username auth */}
      <div className="pt-6 border-t border-t-dim/10">
        {!showLegacy ? (
          <button
            onClick={() => setShowLegacy(true)}
            className="text-xs text-t-dim uppercase tracking-widest hover:text-t-accent"
          >
            USE USERNAME INSTEAD
          </button>
        ) : (
          <>
            <div className="text-xs text-t-dim uppercase tracking-widest mb-4">
              {mode === 'login' ? 'USERNAME LOGIN' : 'REGISTER'}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <div className="flex items-center border-b border-t-dim/30 pb-2">
                  <span className="text-t-dim mr-2">&gt;</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="bg-transparent border-none outline-none text-t-hi text-lg flex-1 uppercase tracking-wider"
                    placeholder="ENTER USERNAME"
                    autoFocus
                    required
                  />
                  <span className="cursor-blink" />
                </div>
              </div>

              <button type="submit" disabled={loading || !username}
                className="text-sm text-t-hi hover:text-t-accent uppercase tracking-widest disabled:text-t-dim transition-opacity">
                [{loading ? '...' : mode === 'login' ? 'LOGIN' : 'REGISTER'}]
              </button>
            </form>

            <div className="text-xs text-t-dim uppercase tracking-widest pt-4">
              {mode === 'login' ? (
                <>NO ACCOUNT? <button onClick={() => setMode('register')} className="text-t-hi hover:text-t-accent">[REGISTER]</button></>
              ) : (
                <>HAVE ACCOUNT? <button onClick={() => setMode('login')} className="text-t-hi hover:text-t-accent">[LOGIN]</button></>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
