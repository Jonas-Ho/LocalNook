import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, MapPin, Shield, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="page profile-page">
        <header className="page-header">
          <div>
            <p className="eyebrow">Your nook</p>
            <h1>Profile</h1>
          </div>
        </header>
        <div className="empty-state">
          <h2>Sign in to your account</h2>
          <p>Save gems, upvote spots, and share your own discoveries.</p>
          <button className="btn primary" onClick={() => navigate('/login')}>
            Sign in
          </button>
          <button className="btn secondary" onClick={() => navigate('/register')}>
            Create account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Your nook</p>
          <h1>Profile</h1>
        </div>
      </header>

      <div className="profile-card">
        <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat">
          <Star size={18} />
          <span>Trust level {user.trustLevel}</span>
        </div>
        <div className="stat">
          <MapPin size={18} />
          <span>{user.addedPlaces?.length || 0} gems added</span>
        </div>
        {user.role === 'admin' && (
          <div className="stat admin">
            <Shield size={18} />
            <span>Admin</span>
          </div>
        )}
      </div>

      <nav className="profile-menu">
        <Link to="/my-places" className="menu-item">
          <span>My submissions</span>
          <ChevronRight size={18} />
        </Link>
        <Link to="/saved" className="menu-item">
          <span>Saved gems</span>
          <ChevronRight size={18} />
        </Link>
      </nav>

      <button className="btn secondary full logout-btn" onClick={logout}>
        <LogOut size={18} /> Sign out
      </button>
    </div>
  );
}