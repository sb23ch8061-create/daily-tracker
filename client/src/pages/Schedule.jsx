import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../utils/api';

const Schedule = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await api.get('/tasks');
        // Filter tasks for selected date
        const filtered = data.filter(t => {
          if (!t.startTime) return false;
          const tDate = new Date(t.startTime);
          return tDate.toDateString() === selectedDate.toDateString();
        });
        setTasks(filtered);
      } catch (err) { console.error('Error loading schedule'); }
    };
    fetchTasks();
  }, [selectedDate]);

  // Generate hours from 8 AM to 10 PM
  const hours = Array.from({ length: 15 }, (_, i) => i + 8);

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header / Date Picker */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', margin: 0 }}>Daily Timeline</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--bg-card)', padding: '10px 20px', borderRadius: '50px' }}>
            <button onClick={() => changeDate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><ChevronLeft /></button>
            <span style={{ fontSize: '16px', fontWeight: 'bold', minWidth: '120px', textAlign: 'center' }}>
              {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <button onClick={() => changeDate(1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><ChevronRight /></button>
          </div>
        </div>

        {/* Timeline Grid */}
        <div style={{ position: 'relative', paddingLeft: '60px' }}>
          {/* Vertical Line */}
          <div style={{ position: 'absolute', left: '59px', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>

          {hours.map(hour => {
            // Find tasks starting in this hour
            const slotTasks = tasks.filter(t => new Date(t.startTime).getHours() === hour);

            return (
              <div key={hour} style={{ display: 'flex', marginBottom: '30px', minHeight: '60px' }}>
                {/* Time Label */}
                <div style={{ width: '50px', position: 'absolute', left: 0, color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'right' }}>
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </div>

                {/* Task Card (if exists) */}
                <div style={{ flex: 1, paddingLeft: '20px' }}>
                  {slotTasks.length > 0 ? (
                    slotTasks.map(task => (
                      <div key={task._id} style={{
                        background: 'var(--bg-card)',
                        padding: '15px 20px',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${task.priority === 'High' ? '#FF5555' : '#B467FF'}`,
                        marginBottom: '10px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                      }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{task.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                          {new Date(task.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {task.duration} min
                        </div>
                      </div>
                    ))
                  ) : (
                    // Empty Slot visual
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginTop: '10px' }}></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </Layout>
  );
};

export default Schedule;