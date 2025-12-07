import ChatWidget from './ChatWidget'; // Imported ChatWidget
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, BarChart2, LogOut } from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Schedule', icon: <Calendar size={20} />, path: '/schedule' },
    { name: 'Analytics', icon: <BarChart2 size={20} />, path: '/analytics' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        backgroundColor: 'var(--bg-card)',
        padding: '30px 20px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '22px', marginBottom: '40px', paddingLeft: '10px' }}>
          Daily<span style={{ color: 'var(--accent-purple)' }}>Tracker</span>
        </h1>

        <nav style={{ flex: 1 }}>
          {menuItems.map((item) => (
            <div 
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '12px',
                cursor: 'pointer',
                color: location.pathname === item.path ? 'var(--bg-primary)' : 'var(--text-secondary)',
                backgroundColor: location.pathname === item.path ? 'var(--accent-green)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              {item.icon}
              <span style={{ fontWeight: location.pathname === item.path ? 600 : 400 }}>{item.name}</span>
            </div>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#FF5555',
            cursor: 'pointer',
            marginTop: 'auto'
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {children}
      </div>

      {/* Floating Chat Widget Added Here */}
      <ChatWidget />
    </div>
  );
};

export default Layout;