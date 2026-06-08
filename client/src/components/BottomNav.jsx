import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../utils/navItems';

export default function BottomNav() {
  return (
    <nav className="bottom-nav mobile-only" aria-label="Mobile navigation">
      {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}