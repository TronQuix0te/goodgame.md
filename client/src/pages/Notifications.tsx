import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api<{ notifications: any[]; unread: number }>('/notifications')
      .then(d => {
        setNotifications(d.notifications);
        // Mark all as read on view
        if (d.unread > 0) api('/notifications/read', { method: 'POST' }).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div>
      <Link to="/" className="text-xs text-t-dim uppercase tracking-widest hover:text-t-accent transition-colors">
        &larr; BACK TO BOARD
      </Link>

      <div className="py-8">
        <div className="text-2xl font-bold text-t-hi uppercase tracking-widest mb-2">NOTIFICATIONS</div>
      </div>

      {loading ? (
        <div className="text-t-dim text-sm uppercase tracking-widest py-8">LOADING<span className="cursor-blink" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-t-dim text-sm uppercase tracking-widest py-8">NO NOTIFICATIONS YET</div>
      ) : (
        <div className="space-y-1">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`py-3 border-b border-t-dim/10 ${n.is_read ? '' : 'bg-t-accent/5'}`}
            >
              <div className="flex items-center justify-between">
                {n.link ? (
                  <Link to={n.link} className="text-sm text-t-fg hover:text-t-accent uppercase tracking-wider">
                    {n.message}
                  </Link>
                ) : (
                  <span className="text-sm text-t-fg uppercase tracking-wider">{n.message}</span>
                )}
                <span className="text-xs text-t-dim uppercase tracking-widest ml-4 shrink-0">
                  {n.type}
                </span>
              </div>
              <div className="text-xs text-t-dim mt-1">
                {new Date(n.created_at + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
