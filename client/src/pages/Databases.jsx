import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Save, Trash2, Plus, X } from 'lucide-react';
import TaskModal from '../components/TaskModal';

const Databases = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [customColumns, setCustomColumns] = useState([]);
  const [showColModal, setShowColModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState('text');

  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    const savedCols = localStorage.getItem('myCustomColumns');
    if (savedCols) setCustomColumns(JSON.parse(savedCols));
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      
      // --- NEW LOGIC: Auto-detect Overdue Tasks ---
      const now = new Date();
      const updatedData = data.map(task => {
        // Check if task has a deadline AND is in the past
        if (task.deadline && new Date(task.deadline) < now) {
             // Only update if it's currently 'Pending' (don't touch Completed or already Delay)
             if (task.status !== 'Completed' && task.status !== 'Delay' && task.status !== 'Cancelled') {
                 
                 // 1. Update Database silently
                 api.put(`/tasks/${task._id}`, { status: 'Delay' });
                 
                 // 2. Update Local View immediately
                 return { ...task, status: 'Delay' };
             }
        }
        return task;
      });
      // --------------------------------------------

      setTasks(updatedData);
    } catch (err) { console.error(err); }
  };

  const addColumn = () => {
    if (!newColName.trim()) return alert('Enter a column name');
    const newCols = [...customColumns, { name: newColName, type: newColType }];
    setCustomColumns(newCols);
    localStorage.setItem('myCustomColumns', JSON.stringify(newCols));
    setShowColModal(false);
    setNewColName('');
  };

  const deleteColumn = (colName) => {
    if(!confirm(`Delete column "${colName}"?`)) return;
    const newCols = customColumns.filter(c => c.name !== colName);
    setCustomColumns(newCols);
    localStorage.setItem('myCustomColumns', JSON.stringify(newCols));
  };

  const handleChange = (id, field, value, isCustom = false) => {
    setTasks(tasks.map(t => {
      if (t._id !== id) return t;
      if (isCustom) {
        const currentCustom = t.customValues || {};
        return { ...t, customValues: { ...currentCustom, [field]: value } };
      }
      return { ...t, [field]: value };
    }));
  };

  const saveRow = async (task) => {
    try {
      setLoading(true);
      await api.put(`/tasks/${task._id}`, task);
      setLoading(false);
      alert('Row Saved');
      fetchTasks(); // Refresh to ensure strict sync
    } catch (err) { alert('Error saving'); setLoading(false); }
  };

  const handleDelete = async (id) => {
    if(!confirm('Delete row?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) { alert('Error deleting'); }
  };

  return (
    <Layout>
      <div style={{ padding: '0 20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '28px' }}>Task Database</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowTaskModal(true)} 
              className="auth-btn" 
              style={{ width: 'auto', background: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Plus size={16} /> New Task
            </button>
            <button onClick={() => setShowColModal(true)} className="auth-btn" style={{ width: 'auto', background: 'var(--accent-purple)' }}>
              <Plus size={16} /> Add Column
            </button>
            <button onClick={() => window.location.reload()} className="auth-btn" style={{ width: 'auto' }}>
              Refresh Data
            </button>
          </div>
        </div>

        {showColModal && (
          <div style={{ marginBottom: '20px', padding: '20px', background: '#1e1e2e', border: '1px solid #444', borderRadius: '10px' }}>
            <h4>Add New Column</h4>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <input placeholder="Column Name" value={newColName} onChange={(e) => setNewColName(e.target.value)} className="form-input" />
              <select value={newColType} onChange={(e) => setNewColType(e.target.value)} className="form-input">
                <option value="text">Text</option><option value="date">Date</option><option value="time">Time</option><option value="number">Number</option>
              </select>
              <button onClick={addColumn} className="auth-btn" style={{ width: '100px', background: 'var(--accent-green)' }}>Save</button>
              <button onClick={() => setShowColModal(false)} className="auth-btn" style={{ width: '100px', background: '#FF5555' }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '2000px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '15px', minWidth: '200px' }}>Task Name</th>
                <th style={{ padding: '15px', minWidth: '120px' }}>Priority</th>
                <th style={{ padding: '15px', minWidth: '130px' }}>Status</th>
                <th style={{ padding: '15px', minWidth: '180px' }}>Deadline</th>
                <th style={{ padding: '15px', minWidth: '100px' }}>Days Left</th>
                <th style={{ padding: '15px', minWidth: '100px' }}>Time (Min)</th>
                <th style={{ padding: '15px', minWidth: '100px' }}>Interest</th>
                <th style={{ padding: '15px', minWidth: '150px' }}>Type</th>
                <th style={{ padding: '15px', minWidth: '150px' }}>Suitable Time</th>
                {customColumns.map((col, idx) => (
                  <th key={idx} style={{ padding: '15px', minWidth: '180px', position: 'relative' }}>
                    {col.name}
                    <button onClick={() => deleteColumn(col.name)} style={{ position: 'absolute', right: '5px', top: '15px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>x</button>
                  </th>
                ))}
                <th style={{ padding: '15px', minWidth: '100px', position: 'sticky', right: 0, background: 'var(--bg-card)', borderLeft: '1px solid #333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px' }}><input className="form-input" value={task.title} onChange={(e) => handleChange(task._id, 'title', e.target.value)} /></td>
                  <td style={{ padding: '10px' }}>
                    <select className="form-input" value={task.priority} onChange={(e) => handleChange(task._id, 'priority', e.target.value)}>
                      <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                    </select>
                  </td>
                  
                  {/* STATUS COLUMN (Updated to show Delay in Red) */}
                  <td style={{ padding: '10px' }}>
                    <select 
                      className="form-input" 
                      value={task.status} 
                      onChange={(e) => handleChange(task._id, 'status', e.target.value)} 
                      style={{ 
                        color: task.status === 'Delay' ? '#FF5555' : 
                               task.status === 'Completed' ? 'var(--accent-green)' : 'white',
                        fontWeight: task.status === 'Delay' ? 'bold' : 'normal'
                      }}
                    >
                      <option>Pending</option><option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Delay</option><option>Cancelled</option>
                    </select>
                  </td>

                  <td style={{ padding: '10px' }}>
                    <input type="datetime-local" className="form-input" value={task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ''} onChange={(e) => handleChange(task._id, 'deadline', e.target.value)} />
                  </td>
                  <td style={{ padding: '10px', color: task.daysLeft < 0 ? '#FF5555' : 'var(--accent-green)', fontWeight: 'bold' }}>{task.daysLeft} days</td>
                  <td style={{ padding: '10px' }}><input type="number" className="form-input" value={task.duration} onChange={(e) => handleChange(task._id, 'duration', e.target.value)} /></td>
                  <td style={{ padding: '10px' }}><input type="number" min="1" max="5" className="form-input" value={task.interest} onChange={(e) => handleChange(task._id, 'interest', e.target.value)} /></td>
                  <td style={{ padding: '10px' }}>
                     <input list="types" className="form-input" value={task.taskType} onChange={(e) => handleChange(task._id, 'taskType', e.target.value)} />
                     <datalist id="types"><option value="Academic"/><option value="Fitness"/><option value="Work"/><option value="Personal"/></datalist>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <select className="form-input" value={task.suitableTime} onChange={(e) => handleChange(task._id, 'suitableTime', e.target.value)}>
                      <option>Any</option><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option><option>Late Night</option>
                    </select>
                  </td>

                  {customColumns.map((col, idx) => (
                    <td key={idx} style={{ padding: '10px' }}>
                      <input 
                        type={col.type} 
                        className="form-input" 
                        value={(task.customValues && task.customValues[col.name]) || ''} 
                        onChange={(e) => handleChange(task._id, col.name, e.target.value, true)} 
                      />
                    </td>
                  ))}

                  <td style={{ padding: '10px', display: 'flex', gap: '10px', position: 'sticky', right: 0, background: 'var(--bg-card)', borderLeft: '1px solid #333' }}>
                    <button onClick={() => saveRow(task)} style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer' }}><Save size={18} /></button>
                    <button onClick={() => handleDelete(task._id)} style={{ background: 'none', border: 'none', color: '#FF5555', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <TaskModal 
          isOpen={showTaskModal} 
          onClose={() => setShowTaskModal(false)} 
          onTaskAdded={fetchTasks} 
        />

      </div>
    </Layout>
  );
};

export default Databases;