import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Plus, Upload, Trash2, Calendar, FileText, Save, X, CheckCircle } from 'lucide-react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeeklyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [availableTypes, setAvailableTypes] = useState(['General', 'Academic', 'Fitness', 'Work', 'Personal']);
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [newTask, setNewTask] = useState({ title: '', time: '09:00', duration: 60, taskType: 'General' });

  // --- NEW STATE FOR AI DRAFTS ---
  const [draftTasks, setDraftTasks] = useState([]); 
  const [showDraftModal, setShowDraftModal] = useState(false);

  useEffect(() => {
    fetchTasks();
    const savedTypes = localStorage.getItem('myTaskTypes');
    if (savedTypes) {
      setAvailableTypes(JSON.parse(savedTypes));
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/weekly');
      setTasks(data);
    } catch (err) { console.error(err); }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/weekly', { ...newTask, day: selectedDay });
      if (!availableTypes.includes(newTask.taskType)) {
        const updatedTypes = [...availableTypes, newTask.taskType];
        setAvailableTypes(updatedTypes);
        localStorage.setItem('myTaskTypes', JSON.stringify(updatedTypes));
      }
      setShowForm(false);
      setNewTask({ title: '', time: '09:00', duration: 60, taskType: 'General' });
      fetchTasks();
    } catch (err) { alert('Error adding task'); }
  };

  const handleDelete = async (id) => {
    if(!confirm('Delete this weekly task?')) return;
    try {
      await api.delete(`/weekly/${id}`);
      fetchTasks();
    } catch (err) { alert('Error deleting'); }
  };

  // --- UPDATED FILE UPLOAD LOGIC ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // 1. Send File
      const { data } = await api.post('/weekly/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      
      // 2. Receive Extracted Drafts
      setDraftTasks(data.tasks); 
      setShowDraftModal(true); // Open Review Modal
      
    } catch (err) { 
      alert('Analysis Failed'); 
    }
    setAnalyzing(false);
  };

  // --- SAVE DRAFTS LOGIC ---
  const saveDrafts = async () => {
      try {
          // Loop through drafts and save each one
          for (const task of draftTasks) {
              await api.post('/weekly', { ...task, source: 'AI Import' });
          }
          alert("All tasks imported successfully!");
          setShowDraftModal(false);
          setDraftTasks([]);
          fetchTasks();
      } catch (err) { alert("Error saving some tasks."); }
  };

  // Helper to edit drafts inside the modal
  const updateDraft = (index, field, value) => {
      const updated = [...draftTasks];
      updated[index][field] = value;
      setDraftTasks(updated);
  };

  return (
    <Layout>
      <div style={{ padding: '0 20px', maxWidth: '1400px', margin: '0 auto' }}>
        
        <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>Default Weekly Tasks</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Calendar size={20} color="var(--accent-purple)"/> Manual Schedule</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px' }}>Click a day in the grid below to add a recurring task.</p>
            <button onClick={() => setShowForm(true)} className="auth-btn" style={{ width: '100%' }}>+ Add Manual Task</button>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={20} color="var(--accent-green)"/> AI Import</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px' }}>Upload an Excel or Image of your schedule.</p>
            <label className="auth-btn" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', opacity: analyzing ? 0.6 : 1 }}>
              {analyzing ? 'Analyzing Image...' : 'Upload File'}
              <input type="file" hidden onChange={handleFileUpload} accept=".xlsx,.xls,.csv,.jpg,.png" disabled={analyzing} />
            </label>
          </div>
        </div>

        {/* --- MANUAL FORM --- */}
        {showForm && (
          <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid var(--accent-purple)' }}>
            <h4>Add New Weekly Task</h4>
            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="form-input" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} style={{ width: '140px' }}>
                {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <input className="form-input" placeholder="Task Title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required style={{ flex: 1, minWidth: '200px' }} />
              <div style={{ position: 'relative' }}>
                <input list="taskTypes" className="form-input" placeholder="Type" value={newTask.taskType} onChange={e => setNewTask({...newTask, taskType: e.target.value})} style={{ width: '140px' }} />
                <datalist id="taskTypes">{availableTypes.map((type, index) => (<option key={index} value={type} />))}</datalist>
              </div>
              <input type="time" className="form-input" value={newTask.time} onChange={e => setNewTask({...newTask, time: e.target.value})} required style={{ width: '110px' }} />
              <input type="number" className="form-input" placeholder="Mins" value={newTask.duration} onChange={e => setNewTask({...newTask, duration: e.target.value})} style={{ width: '80px' }} />
              <button type="submit" className="auth-btn" style={{ width: 'auto', background: 'var(--accent-green)' }}>Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="auth-btn" style={{ width: 'auto', background: '#555' }}>Cancel</button>
            </form>
          </div>
        )}

        {/* --- AI DRAFT REVIEW MODAL --- */}
        {showDraftModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                <div style={{ background: 'var(--bg-card)', padding: '25px', borderRadius: '16px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '22px' }}>Review Extracted Tasks</h3>
                        <button onClick={() => setShowDraftModal(false)} style={{ background: 'none', border: 'none', color: '#FF5555', cursor: 'pointer' }}><X size={24}/></button>
                    </div>
                    
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '10px' }}>Title</th>
                                <th style={{ padding: '10px' }}>Day</th>
                                <th style={{ padding: '10px' }}>Time</th>
                                <th style={{ padding: '10px' }}>Duration</th>
                                <th style={{ padding: '10px' }}>Type</th>
                                <th style={{ padding: '10px' }}>Remove</th>
                            </tr>
                        </thead>
                        <tbody>
                            {draftTasks.map((draft, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '10px' }}><input className="form-input" value={draft.title} onChange={(e) => updateDraft(idx, 'title', e.target.value)} /></td>
                                    <td style={{ padding: '10px' }}>
                                        <select className="form-input" value={draft.day} onChange={(e) => updateDraft(idx, 'day', e.target.value)}>
                                            {daysOfWeek.map(d => <option key={d}>{d}</option>)}
                                        </select>
                                    </td>
                                    <td style={{ padding: '10px' }}><input type="time" className="form-input" value={draft.time} onChange={(e) => updateDraft(idx, 'time', e.target.value)} /></td>
                                    <td style={{ padding: '10px' }}><input type="number" className="form-input" value={draft.duration} onChange={(e) => updateDraft(idx, 'duration', e.target.value)} style={{ width: '60px' }} /></td>
                                    <td style={{ padding: '10px' }}><input className="form-input" value={draft.taskType} onChange={(e) => updateDraft(idx, 'taskType', e.target.value)} style={{ width: '100px' }} /></td>
                                    <td style={{ padding: '10px' }}>
                                        <button onClick={() => setDraftTasks(draftTasks.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#FF5555', cursor: 'pointer' }}><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button onClick={() => setShowDraftModal(false)} className="auth-btn" style={{ background: '#555', width: 'auto' }}>Discard</button>
                        <button onClick={saveDrafts} className="auth-btn" style={{ width: 'auto', background: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle size={18}/> Confirm & Save All
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- GRID VIEW --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '30px' }}>
          {daysOfWeek.map(day => (
            <div key={day} style={{ background: 'var(--bg-card)', borderRadius: '8px', minHeight: '150px', border: '1px solid var(--border-color)' }}>
              <div style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{day}</div>
              <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tasks.filter(t => t.day === day).sort((a,b) => a.time.localeCompare(b.time)).map(task => (
                  <div key={task._id} style={{ background: 'var(--bg-element)', padding: '8px', borderRadius: '6px', fontSize: '12px', borderLeft: '3px solid var(--accent-purple)' }}>
                    <div style={{ fontWeight: 'bold' }}>{task.time}</div>
                    <div style={{ marginBottom: '4px' }}>{task.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', display: 'inline-block' }}>{task.taskType}</div>
                  </div>
                ))}
                <button onClick={() => { setSelectedDay(day); setShowForm(true); }} style={{ width: '100%', padding: '5px', background: 'none', border: '1px dashed var(--text-secondary)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer', marginTop: '5px' }}>+ Add</button>
              </div>
            </div>
          ))}
        </div>

        {/* --- LIST VIEW --- */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', textAlign: 'left' }}>
                <th style={{ padding: '15px' }}>Day</th><th style={{ padding: '15px' }}>Time</th><th style={{ padding: '15px' }}>Task</th><th style={{ padding: '15px' }}>Type</th><th style={{ padding: '15px' }}>Source</th><th style={{ padding: '15px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '15px' }}>{task.day}</td>
                  <td style={{ padding: '15px' }}>{task.time}</td>
                  <td style={{ padding: '15px' }}>{task.title}</td>
                  <td style={{ padding: '15px' }}><span style={{ padding: '4px 8px', borderRadius: '12px', background: 'rgba(180, 103, 255, 0.2)', fontSize: '12px', color: 'var(--accent-purple)' }}>{task.taskType}</span></td>
                  <td style={{ padding: '15px', fontSize: '12px', color: 'var(--text-secondary)' }}>{task.source}</td>
                  <td style={{ padding: '15px' }}><button onClick={() => handleDelete(task._id)} style={{ background: 'none', border: 'none', color: '#FF5555', cursor: 'pointer' }}><Trash2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </Layout>
  );
};

export default WeeklyTasks;