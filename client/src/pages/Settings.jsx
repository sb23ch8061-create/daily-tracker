import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Moon, Sun, Layout as LayoutIcon, List, Database, Trash2, Plus } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [taskTypes, setTaskTypes] = useState([]);
  const [customColumns, setCustomColumns] = useState([]);
  
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('text');
  
  const [categoryPriorities, setCategoryPriorities] = useState({});
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    // 1. Theme
    document.documentElement.setAttribute('data-theme', theme);
    
    // 2. Types & Priorities
    const storedTypes = localStorage.getItem('myTaskTypes');
    const storedPriorities = localStorage.getItem('categoryPriorities');
    
    if (storedTypes) setTaskTypes(JSON.parse(storedTypes));
    else setTaskTypes(['General', 'Academic', 'Fitness', 'Work', 'Personal']);

    if (storedPriorities) setCategoryPriorities(JSON.parse(storedPriorities));

    // 3. Columns
    const storedCols = localStorage.getItem('myCustomColumns');
    if (storedCols) setCustomColumns(JSON.parse(storedCols));
  }, [theme]);

  // --- HANDLERS ---

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) return alert("New passwords don't match");
    try {
      await api.put('/auth/change-password', { currentPassword: passData.current, newPassword: passData.new });
      alert('Password Changed!');
      setPassData({ current: '', new: '', confirm: '' });
    } catch (err) { alert(err.response?.data?.message || 'Error changing password'); }
  };

  const addTaskType = () => {
    const type = prompt("Enter new task type:");
    if (type && !taskTypes.includes(type)) {
      const newTypes = [...taskTypes, type];
      setTaskTypes(newTypes);
      localStorage.setItem('myTaskTypes', JSON.stringify(newTypes));
    }
  };

  const deleteTaskType = (type) => {
    if (!confirm(`Remove "${type}"?`)) return;
    const newTypes = taskTypes.filter(t => t !== type);
    setTaskTypes(newTypes);
    localStorage.setItem('myTaskTypes', JSON.stringify(newTypes));
  };

  const changeCategoryPriority = (type, priority) => {
    const newMap = { ...categoryPriorities, [type]: priority };
    setCategoryPriorities(newMap);
    localStorage.setItem('categoryPriorities', JSON.stringify(newMap));
  };

  const addColumn = () => {
    if (!newColName.trim()) return alert('Enter a column name');
    const newCols = [...customColumns, { name: newColName, type: newColType }];
    setCustomColumns(newCols);
    localStorage.setItem('myCustomColumns', JSON.stringify(newCols));
    setNewColName('');
  };

  const deleteColumn = (colName) => {
    if (!confirm(`Remove database column "${colName}"?`)) return;
    const newCols = customColumns.filter(c => c.name !== colName);
    setCustomColumns(newCols);
    localStorage.setItem('myCustomColumns', JSON.stringify(newCols));
  };

  const setScheduleLayout = (layout) => {
    localStorage.setItem('scheduleLayout', layout);
    alert(`Layout set to: ${layout}. Go to Schedule page to see changes.`);
  };

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>Settings</h2>

        {/* Tabs - Fixed Borders */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid var(--border-color)' }}>
          {['General', 'Database', 'Schedule', 'Security'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} style={{ padding: '10px 20px', background: 'none', border: 'none', color: activeTab === tab.toLowerCase() ? 'var(--accent-green)' : 'var(--text-secondary)', borderBottom: activeTab === tab.toLowerCase() ? '2px solid var(--accent-green)' : 'none', cursor: 'pointer' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* --- GENERAL TAB --- */}
        {activeTab === 'general' && (
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span>App Theme</span>
              <button onClick={toggleTheme} className="auth-btn" style={{ width: 'auto', display: 'flex', gap: '10px' }}>
                {theme === 'dark' ? <Moon size={18}/> : <Sun size={18}/>} {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px', marginBottom: '15px' }}>
                <h4>Task Categories & Priorities</h4>
                <button onClick={addTaskType} style={{ background: 'var(--accent-purple)', border: 'none', color: 'white', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px' }}>+ Add Category</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {taskTypes.map(type => (
                // FIX: Replaced #222 with var(--bg-element)
                <div key={type} style={{ background: 'var(--bg-element)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>{type}</span>
                  
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Default Priority:</span>
                    <select 
                        className="form-input" 
                        style={{ width: '100px', padding: '5px', height: 'auto' }}
                        value={categoryPriorities[type] || 'Medium'}
                        onChange={(e) => changeCategoryPriority(type, e.target.value)}
                    >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Urgent</option>
                    </select>
                    <button onClick={() => deleteTaskType(type)} style={{ background: 'none', border: 'none', color: '#FF5555', cursor: 'pointer' }}><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DATABASE TAB --- */}
        {activeTab === 'database' && (
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: '15px' }}>Manage Custom Columns</h4>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
              <input placeholder="New Column Name" value={newColName} onChange={(e) => setNewColName(e.target.value)} className="form-input" />
              <select value={newColType} onChange={(e) => setNewColType(e.target.value)} className="form-input">
                <option value="text">Text</option><option value="date">Date</option><option value="time">Time</option><option value="number">Number</option>
              </select>
              <button onClick={addColumn} className="auth-btn" style={{ width: 'auto', background: 'var(--accent-green)' }}><Plus size={18}/></button>
            </div>

            {customColumns.length === 0 ? <p style={{color: 'var(--text-secondary)'}}>No custom columns added.</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {customColumns.map((col, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                    <span>{col.name} <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '10px' }}>({col.type})</span></span>
                    <button onClick={() => deleteColumn(col.name)} style={{ background: 'none', border: 'none', color: '#FF5555', cursor: 'pointer' }}><Trash2 size={18}/></button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* --- SCHEDULE TAB --- */}
        {activeTab === 'schedule' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div onClick={() => setScheduleLayout('initial')} style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ height: '80px', background: 'var(--bg-element)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', borderRadius: '8px' }}>[Compact]</div>
              <h4>Initial Interface</h4><p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Compact Grid</p>
            </div>
            <div onClick={() => setScheduleLayout('present')} style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '2px solid var(--accent-green)', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ height: '80px', background: 'var(--bg-element)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', borderRadius: '8px' }}>[24H]</div>
              <h4>Present Interface</h4><p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>24H Timeline</p>
            </div>
            <div onClick={() => setScheduleLayout('professional')} style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ height: '80px', background: 'var(--bg-element)', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', borderRadius: '8px' }}>[List]</div>
              <h4>Professional</h4><p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Agenda List</p>
            </div>
          </div>
        )}

        {/* --- SECURITY TAB --- */}
        {activeTab === 'security' && (
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4>Change Password</h4>
            <form onSubmit={handlePasswordChange} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="password" placeholder="Current Password" className="form-input" value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} required />
              <input type="password" placeholder="New Password" className="form-input" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} required />
              <input type="password" placeholder="Confirm New Password" className="form-input" value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} required />
              <button type="submit" className="auth-btn" style={{ width: 'auto' }}>Update Password</button>
            </form>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Settings;