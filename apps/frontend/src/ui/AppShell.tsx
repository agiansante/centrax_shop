import { LogOut, Search } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';

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
          <button className="navButton active" onClick={() => navigate('/')}>
            Campagne
          </button>
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
