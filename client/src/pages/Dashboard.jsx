import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Added
import { Plus, Zap, Trash2, CheckCircle, Circle, Edit2, Play } from 'lucide-react'; // Added Play
import Layout from '../components/Layout';
import TaskModal from '../components/TaskModal';
import api from '../utils/api';

const Dashboard = () => {
  const navigate = useNavigate(); // Added
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [nlpText, setNlpText] = useState('');

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (err) { console.error('Failed to fetch tasks'); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleNlpSubmit = async (e) => {
    e.preventDefault();
    if (!nlpText.trim()) return;
    try {
      await api.post('/tasks/nlp', { text: nlpText });
      setNlpText('');
      fetchTasks();
      alert('Task auto-created!');
    } catch (err) { alert('Failed to parse text'); }
  };

  const toggleComplete = async (task) => {
    try {
      const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
      await api.put(`/tasks/${task._id}/status`, { status: newStatus });
      fetchTasks();
    } catch (err) { alert('Error updating task'); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) { alert('Error deleting task'); }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
    setShowModal(false);
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '5px' }}>Dashboard</h2>
            <p style={{ color: 'var(--text-secondary)' }}>You have {tasks.length} tasks.</p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={async () => {
                try {
                  await api.post('/tasks/auto-schedule');
                  fetchTasks(); 
                  alert('Schedule Generated!');
                } catch (err) { alert('Scheduling Failed'); }
              }}
              className="auth-btn"
              style={{ width: 'auto', padding: '12px 24px', background: 'var(--accent-purple)' }}
            >
               Ai Schedule
            </button>
            <button onClick={() => setShowModal(true)} className="auth-btn" style={{ width: 'auto', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={20} /> New Task
            </button>
          </div>
        </div>

        <form onSubmit={handleNlpSubmit} style={{ marginBottom: '40px', position: 'relative' }}>
          <Zap size={20} style={{ position: 'absolute', left: '20px', top: '18px', color: 'var(--accent-green)' }} />
          <input 
            type="text" 
            placeholder="Type naturally: 'Gym tomorrow at 6am for 1 hour'"
            value={nlpText}
            onChange={(e) => setNlpText(e.target.value)}
            style={{ width: '100%', padding: '16px 16px 16px 50px', backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontSize: '16px' }}
          />
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {tasks.map((task) => (
            <div key={task._id} style={{ 
              backgroundColor: 'var(--bg-card)', 
              padding: '24px', 
              borderRadius: '16px',
              borderLeft: `4px solid ${task.priority === 'High' ? '#FF5555' : task.priority === 'Medium' ? '#B467FF' : '#6BFF2C'}`,
              opacity: task.status === 'Completed' ? 0.5 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#A0A3AD', textTransform: 'uppercase' }}>{task.category}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Play Button */}
                  <button onClick={() => navigate('/focus', { state: { task } })} style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer' }} title="Start Focus"><Play size={18} /></button>
                  {/* Edit Button */}
                  <button onClick={() => openEditModal(task)} style={{ background: 'none', border: 'none', color: '#A0A3AD', cursor: 'pointer' }}><Edit2 size={18} /></button>
                  {/* Delete Button */}
                  <button onClick={() => handleDelete(task._id)} style={{ background: 'none', border: 'none', color: '#FF5555', cursor: 'pointer' }}><Trash2 size={18} /></button>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
                <button onClick={() => toggleComplete(task)} style={{ background: 'none', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', padding: 0 }}>
                  {task.status === 'Completed' ? <CheckCircle size={24} /> : <Circle size={24} />}
                </button>
                <h3 style={{ fontSize: '18px', margin: 0, textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>{task.title}</h3>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginLeft: '40px' }}>
                {task.startTime ? new Date(task.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pending'}
              </p>
            </div>
          ))}
        </div>

        <TaskModal 
          isOpen={showModal} 
          onClose={handleCloseModal} 
          onTaskAdded={fetchTasks} 
          taskToEdit={editingTask} 
        />
      </div>
    </Layout>
  );
};

export default Dashboard;