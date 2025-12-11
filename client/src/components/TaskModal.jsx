import { useState, useEffect } from 'react';
import { X, Eraser } from 'lucide-react';
import api from '../utils/api';
import './TaskModal.css';

const TaskModal = ({ isOpen, onClose, onTaskAdded, taskToEdit }) => {
  // Toggle for custom input
  const [isCustomType, setIsCustomType] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', 
    priority: 'Medium', 
    duration: 30, 
    deadline: '', 
    interest: 3, 
    taskType: 'General', 
    suitableTime: 'Any'
  });

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        title: taskToEdit.title,
        priority: taskToEdit.priority || 'Medium',
        duration: taskToEdit.duration || 30,
        deadline: taskToEdit.deadline ? new Date(taskToEdit.deadline).toISOString().slice(0, 16) : '',
        interest: taskToEdit.interest || 3,
        taskType: taskToEdit.taskType || 'General',
        suitableTime: taskToEdit.suitableTime || 'Any'
      });
      // Check if type is custom
      const standardTypes = ['General', 'Academic', 'Work', 'Fitness', 'Personal'];
      if (!standardTypes.includes(taskToEdit.taskType)) {
        setIsCustomType(true);
      }
    } else {
      // Reset
      setFormData({ title: '', priority: 'Medium', duration: 30, deadline: '', interest: 3, taskType: 'General', suitableTime: 'Any' });
      setIsCustomType(false);
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle Dropdown switching to "Add New"
  const handleTypeChange = (e) => {
    if (e.target.value === 'ADD_NEW') {
      setIsCustomType(true); // Switch to text input
      setFormData({ ...formData, taskType: '' }); // Clear value
    } else {
      setIsCustomType(false);
      setFormData({ ...formData, taskType: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        // Send null if date is empty so backend accepts it
        deadline: formData.deadline ? formData.deadline : null 
      };

      if (taskToEdit) await api.put(`/tasks/${taskToEdit._id}`, payload);
      else await api.post('/tasks', payload);
      
      onTaskAdded();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error saving. Check console.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>{taskToEdit ? 'Edit Task' : 'Add New Task'}</h2>
          <button onClick={onClose} className="modal-close"><X /></button>
        </div>
        
        {/* noValidate stops browser from blocking empty dates */}
        <form onSubmit={handleSubmit} noValidate>
          
          {/* 1. Title (Required) */}
          <div className="form-group">
            <label>Task Name *</label>
            <input 
              className="form-input" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              required 
            />
          </div>

          {/* 2. Duration & Priority */}
          <div className="row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Duration (mins)</label>
              <input type="number" className="form-input" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Priority</label>
              <select className="form-input" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            </div>
          </div>

          {/* 3. Interest & Type */}
          <div className="row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Interest (1-5)</label>
              <input type="number" min="1" max="5" className="form-input" value={formData.interest} onChange={(e) => setFormData({...formData, interest: e.target.value})} />
            </div>
            
            {/* TASK TYPE: Dropdown OR Input */}
            <div className="form-group" style={{ flex: 1 }}>
              <label>Task Type</label>
              {isCustomType ? (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input 
                    className="form-input" 
                    placeholder="Enter new type..." 
                    value={formData.taskType} 
                    onChange={(e) => setFormData({...formData, taskType: e.target.value})} 
                    autoFocus 
                  />
                  <button type="button" onClick={() => setIsCustomType(false)} style={{ background: '#333', border: 'none', color: 'white', padding: '0 10px', borderRadius: '8px', cursor: 'pointer' }}>X</button>
                </div>
              ) : (
                <select className="form-input" value={formData.taskType} onChange={handleTypeChange}>
                  <option value="General">General</option>
                  <option value="Academic">Academic</option>
                  <option value="Work">Work</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Personal">Personal</option>
                  <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#6BFF2C' }}>+ Add New Type</option>
                </select>
              )}
            </div>
          </div>

          {/* 4. Time & Deadline */}
          <div className="row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Suitable Time</label>
              <select className="form-input" value={formData.suitableTime} onChange={(e) => setFormData({...formData, suitableTime: e.target.value})}>
                <option>Any</option><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option>
              </select>
            </div>
            
            {/* Optional Deadline */}
            <div className="form-group" style={{ flex: 1, position: 'relative' }}>
              <label>Deadline (Optional)</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={formData.deadline} 
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})} 
                />
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, deadline: ''})}
                  style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', color: '#FF5555', borderRadius: '8px', cursor: 'pointer', padding: '0 10px' }}
                  title="Clear Date"
                >
                  <Eraser size={16} />
                </button>
              </div>
            </div>
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