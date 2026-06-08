import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../utils/navItems';

export default function SidebarNav() {
  return (
    <aside className="sidebar-nav" aria-label="Desktop navigation">
      <div className="sidebar-brand">
        <span className="sidebar-logo">LN</span>
        <div>
          <strong>Local Nook</strong>
          <p>Community gems</p>
        </div>
      </div>

      <nav className="sidebar-links">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={20} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <p className="sidebar-tagline">No ads. No sponsors. Just locals.</p>
    </aside>
  );
}