import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, BarChart2, Calendar, Clock, LogOut, Repeat, Settings, MessageSquare } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/schedule', label: 'Schedule', icon: <Calendar size={20} /> },
    { path: '/databases', label: 'Databases', icon: <Database size={20} /> },
    { path: '/weekly-tasks', label: 'Weekly Tasks', icon: <Repeat size={20} /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart2 size={20} /> },
    { path: '/focus', label: 'Focus Mode', icon: <Clock size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
    { path: '/feedback', label: 'Feedback', icon: <MessageSquare size={20} /> },
  ];

  return (
    // FIX: Using CSS variables for color and background
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', transition: 'background-color 0.3s' }}>
      
      {/* Sidebar: Fixed border color variable */}
      <div style={{ width: '250px', backgroundColor: 'var(--bg-card)', padding: '20px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', background: 'linear-gradient(to right, #B467FF, #6BFF2C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          DailyTracker
        </h1>

        {/* Clock: Fixed background and border */}
        <div style={{ marginBottom: '30px', padding: '15px', background: 'var(--bg-main)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-green)', fontFamily: 'monospace' }}>
                {currentTime.toLocaleTimeString([], { hour12: false })}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                textDecoration: 'none',
                // Text color logic
                color: location.pathname === item.path ? 'white' : 'var(--text-secondary)',
                backgroundColor: location.pathname === item.path ? 'var(--accent-purple)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 'auto' }}>
            <button 
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', color: '#FF5555', cursor: 'pointer', padding: '12px', width: '100%', textAlign: 'left', marginBottom: '10px' }}
            >
              <LogOut size={20} /> Logout
            </button>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                Made by Beluga
            </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
};

export default Layout;