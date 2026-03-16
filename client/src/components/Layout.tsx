import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import Noise from './Noise';

const ASCII_LOGO = `  ██████  ██████
 ██       ██
 ██   ██  ██   ██
 ██   ██  ██   ██
  ██████   ██████`;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    api<{ unread: number }>('/notifications').then(d => setUnreadCount(d.unread)).catch(() => {});
  }, [user, location.pathname]);

  const navLink = (to: string, label: string, match?: (p: string) => boolean) => {
    const active = match ? match(location.pathname) : location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setMenuOpen(false)}
        className={`transition-colors ${active ? 'text-t-accent' : 'text-t-dim hover:text-t-accent'}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col px-5 sm:px-8 py-6 max-w-[900px]">
      {/* Nav */}
      <nav className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8 text-sm uppercase tracking-widest">
            <Link to="/" className="text-t-hi font-bold hover:text-t-accent transition-colors">GG.MD</Link>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLink('/', 'BOARD')}
              {navLink('/search', 'SEARCH')}
              {navLink('/compare', 'COMPARE')}
              {navLink('/quiz', 'QUIZ')}
              {navLink('/blog', 'BLOG', p => p.startsWith('/blog'))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm uppercase tracking-widest">
            {user ? (
              <>
                {navLink('/submit', 'SUBMIT')}
                <Link
                  to="/notifications"
                  onClick={() => setMenuOpen(false)}
                  className={`transition-colors ${location.pathname === '/notifications' ? 'text-t-accent' : 'text-t-dim hover:text-t-accent'}`}
                >
                  {unreadCount > 0 ? `(${unreadCount})` : ''}NOTIF
                </Link>
                {navLink('/profile', `@${user.username.toUpperCase()}`)}
                {user.is_admin && navLink('/admin', 'ADMIN')}
                <button onClick={logout} className="text-t-dim hover:text-t-red transition-colors uppercase">LOGOUT</button>
              </>
            ) : (
              <Link to="/login" className="text-t-hi hover:text-t-accent transition-colors uppercase tracking-widest">LOGIN</Link>
            )}
          </div>
          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-t-dim hover:text-t-accent text-sm uppercase tracking-widest"
          >
            [{menuOpen ? 'CLOSE' : 'MENU'}]
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden flex flex-col gap-3 pt-4 pb-2 text-sm uppercase tracking-widest border-t border-t-dim/20 mt-4">
            {navLink('/', 'BOARD')}
            {navLink('/search', 'SEARCH')}
            {navLink('/compare', 'COMPARE')}
            {navLink('/quiz', 'QUIZ')}
            {navLink('/blog', 'BLOG', p => p.startsWith('/blog'))}
            {user ? (
              <>
                {navLink('/submit', 'SUBMIT')}
                <Link
                  to="/notifications"
                  onClick={() => setMenuOpen(false)}
                  className={`transition-colors ${location.pathname === '/notifications' ? 'text-t-accent' : 'text-t-dim hover:text-t-accent'}`}
                >
                  NOTIFICATIONS{unreadCount > 0 ? ` (${unreadCount})` : ''}
                </Link>
                {navLink('/profile', `@${user.username.toUpperCase()}`)}
                {user.is_admin && navLink('/admin', 'ADMIN')}
                <button onClick={() => { logout(); setMenuOpen(false); }} className="text-t-dim hover:text-t-red transition-colors uppercase text-left">LOGOUT</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-t-hi hover:text-t-accent transition-colors">LOGIN</Link>
            )}
          </div>
        )}
      </nav>

      {/* ASCII hero on home only */}
      {isHome && (
        <div className="mb-6">
          <pre className="text-t-hi text-xs sm:text-sm leading-none mb-6 select-none">{ASCII_LOGO}</pre>
          <div className="text-2xl sm:text-4xl font-extralight tracking-widest text-t-hi uppercase mb-4">
            GOODGAME.MD
          </div>
          <div className="text-sm sm:text-base text-t-mid tracking-wider uppercase mb-4">
            BEHAVIORAL DISPOSITION FILES FOR CLAUDE CODE
          </div>
          <div className="text-t-dim text-sm tracking-wide">
            THE WHY LAYER OF AI CONFIGURATION — COMMUNITY GRADED, CURL TO INSTALL
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 py-4">
        {children}
      </main>

      {/* Footer */}
      <div className="mt-8 text-t-dim text-xs select-none overflow-hidden whitespace-nowrap">
        <Noise length={100} speed={60} />
      </div>
      <div className="mt-2 text-xs text-t-dim uppercase tracking-widest flex flex-col sm:flex-row justify-between gap-1">
        <span>GOODGAME.MD — BEHAVIORAL FILES FOR CLAUDE CODE</span>
        <Link to="/build/blitz" className="text-t-accent/60 hover:text-t-accent transition-colors">
          BUILT WITH @BLITZ
        </Link>
      </div>
    </div>
  );
}
