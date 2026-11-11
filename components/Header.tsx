import type { Profile } from '@/lib/types';
import NavLinks from './NavLinks';

export default function Header({ profile }: { profile: Profile }) {
  const name = profile.full_name || profile.email || 'Account';
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            P
          </span>
          <span className="brand-name">Pips Ledger</span>
        </div>
        <NavLinks isAdmin={profile.role === 'admin'} />
        <div className="who">
          <div className="who-text">
            <span className="who-name">{name}</span>
            <span className={`role role-${profile.role}`}>{profile.role === 'admin' ? 'Admin' : 'View only'}</span>
          </div>
          <form action="/auth/signout" method="post">
            <button className="btn btn-ghost btn-sm" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
