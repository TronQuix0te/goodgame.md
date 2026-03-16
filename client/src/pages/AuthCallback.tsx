import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      loginWithToken(token).then(() => navigate('/')).catch(() => navigate('/login?error=auth_failed'));
    } else {
      navigate('/login?error=no_token');
    }
  }, []);

  return (
    <div className="text-t-dim text-center py-16 text-sm uppercase tracking-widest">
      AUTHENTICATING<span className="cursor-blink" />
    </div>
  );
}
