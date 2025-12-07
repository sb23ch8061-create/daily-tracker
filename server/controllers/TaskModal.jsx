import { useState } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';
import './TaskModal.css';

const TaskModal = ({ isOpen, onClose, onTaskAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    duration: 30,
    deadline: '',
    category: 'Personal'
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', formData);
      onTaskAdded(); // Refresh the list
      onClose(); // Close modal
      setFormData({ title: '', description: '', priority: 'Medium', duration: 30, deadline: '', category: 'Personal' }); // Reset
    } catch (err) {
      alert('Error adding task');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>Add New Task</h2>
          <button onClick={onClose} className="modal-close"><X /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Name</label>
            <input 
              className="form-input" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              required 
            />
          </div>

          <div className="row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Duration (mins)</label>
              <input 
                type="number" 
                className="form-input" 
                value={formData.duration} 
                onChange={(e) => setFormData({...formData, duration: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Priority</label>
              <select 
                className="form-input"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Deadline (Optional)</label>
            <input 
              type="datetime-local" 
              className="form-input"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
            />
          </div>

          <button type="submit" className="auth-btn">Create Task</button>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;