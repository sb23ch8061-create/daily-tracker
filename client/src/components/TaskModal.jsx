import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../utils/api';
import './TaskModal.css';

const TaskModal = ({ isOpen, onClose, onTaskAdded, taskToEdit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    duration: 30,
    deadline: '',
    category: 'Personal'
  });

  // Pre-fill form if editing
  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title,
        description: taskToEdit.description || '',
        priority: taskToEdit.priority,
        duration: taskToEdit.duration,
        deadline: taskToEdit.deadline ? new Date(taskToEdit.deadline).toISOString().slice(0, 16) : '',
        category: taskToEdit.category
      });
    } else {
      setFormData({ title: '', description: '', priority: 'Medium', duration: 30, deadline: '', category: 'Personal' });
    }
  }, [taskToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (taskToEdit) {
        // Edit Existing Task
        await api.put(`/tasks/${taskToEdit._id}`, formData);
        alert('Task Updated!');
      } else {
        // Create New Task
        await api.post('/tasks', formData);
      }
      onTaskAdded();
      onClose();
    } catch (err) {
      alert('Error saving task');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>{taskToEdit ? 'Edit Task' : 'Add New Task'}</h2>
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

          <button type="submit" className="auth-btn">
            {taskToEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;