import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import SidebarNav from './SidebarNav';

export default function Layout() {
  return (
    <div className="app-layout">
      <SidebarNav />
      <div className="app-shell">
        <main className="main-content">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}