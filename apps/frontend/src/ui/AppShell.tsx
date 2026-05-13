import { LogOut, Search, Settings } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export function AppShell() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Search size={22} />
          <span>Dropship Intel</span>
        </div>
        <nav>
          <NavLink className={({ isActive }) => (isActive ? 'navButton active' : 'navButton')} to="/">
            Campagne
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'navButton active' : 'navButton')} to="/configuration">
            <Settings size={16} />
            Configurazione
          </NavLink>
        </nav>
        <button
          className="iconTextButton"
          onClick={() => {
            localStorage.removeItem('accessToken');
            navigate('/login');
          }}
        >
          <LogOut size={16} />
          Esci
        </button>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
