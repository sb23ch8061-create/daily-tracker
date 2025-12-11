import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { ChevronLeft, ChevronRight, X, RotateCcw, Trash2, Undo, Redo, Save, List, Grid } from 'lucide-react';

const getLocalDateString = (date) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const Schedule = () => {
  const [viewMode, setViewMode] = useState(localStorage.getItem('scheduleLayout') || 'present');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, task: null });
  const [rescheduleModal, setRescheduleModal] = useState(null);

  const [history, setHistory] = useState([]); 
  const [future, setFuture] = useState([]);   
  const [unsavedChanges, setUnsavedChanges] = useState([]); 

  const scrollContainerRef = useRef(null);
  const hours = Array.from({ length: 24 }, (_, i) => i); 
  const HEADER_HEIGHT = '60px';
  
  const startOfWeek = getStartOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getCurrentTimePosition = () => {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes(); 
  };
  const [nowMetric, setNowMetric] = useState(getCurrentTimePosition());
  
  useEffect(() => {
      const t = setInterval(() => setNowMetric(getCurrentTimePosition()), 60000);
      return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (viewMode === 'present' && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 360; 
    }
  }, [viewMode]);

  const fetchSchedule = async () => {
    try {
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      const startStr = getLocalDateString(startOfWeek);
      const endStr = getLocalDateString(endOfWeek);
      const { data } = await api.get(`/schedule?start=${startStr}&end=${endStr}`);
      setTasks(data);
    } catch (err) { console.error("Schedule Fetch Error", err); }
  };

  useEffect(() => { if (unsavedChanges.length === 0) fetchSchedule(); }, [currentDate]);

  // --- HANDLERS (UNCHANGED) ---
  const handleSaveChanges = async () => {
      if (unsavedChanges.length === 0) return;
      try {
          for (const action of unsavedChanges) {
              switch (action.type) {
                  case 'MOVE': await api.put(`/schedule/move-task/${action.id}`, { newStart: action.newStart, newEnd: action.newEnd }); setHistory(prev => [...prev, action]); break;
                  case 'CANCEL': await api.post('/schedule/exception', { weeklyTaskId: action.weeklyId, date: action.date, action: 'cancelled' }); setHistory(prev => [...prev, action]); break;
                  case 'DELETE': await api.delete(`/tasks/${action.taskId}`); setHistory(prev => [...prev, action]); break;
                  case 'RESCHEDULE': const { data } = await api.post('/schedule/exception', { weeklyTaskId: action.weeklyId, date: action.date, action: 'rescheduled', newDate: action.redoParams.newDate, newTime: action.redoParams.newTime }); setHistory(prev => [...prev, { ...action, newTaskId: data.newTask._id }]); break;
              }
          }
          setUnsavedChanges([]); alert("Changes Saved Successfully!"); fetchSchedule();
      } catch (err) { alert("Error saving changes."); }
  };

  const handleUndo = async () => {
    if (unsavedChanges.length > 0) {
        const action = unsavedChanges[unsavedChanges.length - 1]; setUnsavedChanges(unsavedChanges.slice(0, -1));
        if (action.type === 'MOVE') setTasks(tasks.map(t => t._id === action.id ? { ...t, start: action.oldStart, end: action.oldEnd } : t));
        if (action.type === 'CANCEL') setTasks(tasks.map(t => (t.originalId === action.weeklyId && t.dateString === action.date) ? { ...t, isCancelled: false } : t));
        if (action.type === 'DELETE') setTasks([...tasks, { ...action.taskData, _id: action.taskId }]);
        if (action.type === 'RESCHEDULE') setTasks(tasks.filter(t => t._id !== action.tempId).map(t => (t.originalId === action.weeklyId && t.dateString === action.date) ? { ...t, isCancelled: false } : t));
        return;
    }
    if (history.length > 0) {
        const action = history[history.length - 1]; const newHistory = history.slice(0, -1);
        try {
            if(action.type === 'MOVE') await api.put(`/schedule/move-task/${action.id}`, { newStart: action.oldStart, newEnd: action.oldEnd });
            if(action.type === 'CANCEL') await api.delete('/schedule/exception', { data: { weeklyTaskId: action.weeklyId, date: action.date } });
            if(action.type === 'RESCHEDULE') await api.delete('/schedule/exception', { data: { weeklyTaskId: action.weeklyId, date: action.date, deleteNewTaskId: action.newTaskId } });
            if(action.type === 'DELETE') { await api.post('/tasks', action.taskData); }
            setFuture(prev => [...prev, action]); setHistory(newHistory); fetchSchedule();
        } catch (err) { alert('Undo failed'); }
    }
  };

  const handleRedo = async () => {
    if (future.length === 0) return;
    const action = future[future.length - 1]; const newFuture = future.slice(0, -1);
    try {
      if(action.type === 'MOVE') await api.put(`/schedule/move-task/${action.id}`, { newStart: action.newStart, newEnd: action.newEnd });
      if(action.type === 'CANCEL') await api.post('/schedule/exception', { weeklyTaskId: action.weeklyId, date: action.date, action: 'cancelled' });
      if(action.type === 'DELETE') await api.delete(`/tasks/${action.redoId}`);
      setHistory(prev => [...prev, action]); setFuture(newFuture); fetchSchedule();
    } catch (err) { alert('Redo failed'); }
  };

  const handleContextMenu = (e, task) => {
      if (!task.isCancelled && !task.isUnsaved) { 
          e.preventDefault(); e.stopPropagation(); 
          setMenu({ visible: true, x: e.pageX, y: e.pageY, task }); 
      }
  };

  const handleCancelInstance = async () => {
    if (!menu.task) return;
    if (confirm(`Cancel "${menu.task.title}"?`)) {
        const date = menu.task.dateString; const id = menu.task.originalId;
        setTasks(tasks.map(t => t._id === menu.task._id ? { ...t, isCancelled: true } : t));
        setUnsavedChanges(prev => [...prev, { type: 'CANCEL', weeklyId: id, date: date }]);
        setMenu({ ...menu, visible: false });
    }
  };
  const handleDeleteNormalTask = async () => {
      if (!menu.task) return;
      if (confirm(`Delete "${menu.task.title}"?`)) {
          setTasks(tasks.filter(t => t._id !== menu.task._id));
          setUnsavedChanges(prev => [...prev, { type: 'DELETE', taskId: menu.task._id, taskData: { title: menu.task.title, startTime: menu.task.start, endTime: menu.task.end } }]);
          setMenu({ ...menu, visible: false });
      }
  };
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    const task = rescheduleModal.task;
    const newDateStr = e.target.newDate.value; const newTimeStr = e.target.newTime.value;
    const date = task.dateString; const id = task.originalId;
    let updatedTasks = tasks.map(t => t._id === task._id ? { ...t, isCancelled: true } : t);
    const startD = new Date(newDateStr); const [h, m] = newTimeStr.split(':'); startD.setHours(h, m, 0, 0);
    const durationMs = new Date(task.end) - new Date(task.start); const endD = new Date(startD.getTime() + durationMs);
    const tempId = `temp-${Date.now()}`;
    updatedTasks.push({ _id: tempId, title: task.title, start: startD, end: endD, type: 'normal', priority: 'High', isFixed: false, isUnsaved: true });
    setTasks(updatedTasks);
    setUnsavedChanges(prev => [...prev, { type: 'RESCHEDULE', weeklyId: id, date: date, tempId: tempId, redoParams: { newDate: newDateStr, newTime: newTimeStr } }]);
    setRescheduleModal(null);
  };

  const handleDrop = async (e, day, hour) => {
      e.preventDefault(); if (!draggedTask) return;
      const newStart = new Date(day); newStart.setHours(hour, 0, 0, 0);
      if (draggedTask.type === 'weekly') {
        const date = draggedTask.dateString; const id = draggedTask.originalId;
        const newTimeStr = `${String(hour).padStart(2, '0')}:00`; const newDateStr = getLocalDateString(newStart);
        let updatedTasks = tasks.map(t => t._id === draggedTask._id ? { ...t, isCancelled: true } : t);
        const durationMs = new Date(draggedTask.end) - new Date(draggedTask.start); const newEnd = new Date(newStart.getTime() + durationMs);
        const tempId = `temp-${Date.now()}`;
        updatedTasks.push({ _id: tempId, title: draggedTask.title, start: newStart, end: newEnd, type: 'normal', priority: 'High', isFixed: false, isUnsaved: true });
        setTasks(updatedTasks);
        setUnsavedChanges(prev => [...prev, { type: 'RESCHEDULE', weeklyId: id, date: date, tempId: tempId, redoParams: { newDate: newDateStr, newTime: newTimeStr } }]);
      } else {
        if (draggedTask.isUnsaved) { alert("Save changes first."); return; }
        const durationMs = new Date(draggedTask.end) - new Date(draggedTask.start); const newEnd = new Date(newStart.getTime() + durationMs);
        const oldStart = draggedTask.start; const oldEnd = draggedTask.end;
        const updatedTasks = tasks.map(t => t._id === draggedTask._id ? { ...t, start: newStart, end: newEnd } : t);
        setTasks(updatedTasks); setDraggedTask(null);
        setUnsavedChanges(prev => [...prev, { type: 'MOVE', id: draggedTask._id, oldStart, oldEnd, newStart, newEnd }]);
      }
  };
  const handleDragStart = (e, task) => { if (!task.isCancelled) { setDraggedTask(task); e.dataTransfer.effectAllowed = 'move'; }};
  const handleDragOver = (e) => { e.preventDefault(); };

  const getTaskStyle = (task) => {
    const startHour = new Date(task.start).getHours(); const startMin = new Date(task.start).getMinutes();
    const durationMin = (new Date(task.end) - new Date(task.start)) / 60000;
    const top = startHour * 60 + startMin; const height = durationMin; 
    const baseStyle = { top: `${top}px`, height: `${height}px`, position: 'absolute', width: '95%', borderRadius: '6px', padding: '4px', fontSize: '12px' };
    if (task.isCancelled) return { ...baseStyle, backgroundColor: 'transparent', border: task.exceptionType === 'rescheduled' ? '2px dashed #ffe600' : '2px dashed #FF5555', color: task.exceptionType === 'rescheduled' ? '#ffe600' : '#FF5555', zIndex: 1, pointerEvents: 'none' };
    if (task.isUnsaved) return { ...baseStyle, backgroundColor: '#444', border: '2px dashed var(--accent-green)', zIndex: 20, cursor: 'not-allowed', opacity: 0.8 };
    
    // FIX: Replaced hardcoded #444 with var(--bg-element)
    const activeStyle = { ...baseStyle, backgroundColor: task.isFixed ? 'var(--accent-purple)' : 'var(--bg-element)', borderLeft: `4px solid ${task.isFixed ? '#FF66E5' : 'var(--accent-green)'}`, zIndex: task.isFixed ? 10 : 20, cursor: 'grab' };
    if (draggedTask && draggedTask._id === task._id) return { ...activeStyle, opacity: 0.5, cursor: 'grabbing' };
    return activeStyle;
  };

  // --- RENDERERS ---

  const renderProfessionalLayout = () => (
    <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', height: '100%', overflowY: 'auto' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><List /> Agenda View</h3>
      {days.map(day => {
        const dayTasks = tasks.filter(t => new Date(t.start).getDate() === day.getDate()).sort((a,b) => new Date(a.start) - new Date(b.start));
        return (
          <div key={day} style={{ marginBottom: '20px' }}>
            <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '5px', color: day.toDateString() === new Date().toDateString() ? 'var(--accent-green)' : 'var(--text-primary)' }}>{day.toDateString()}</h4>
            {dayTasks.length === 0 ? <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>No tasks scheduled.</p> : dayTasks.map(t => (
              // FIX: Replaced #222 with var(--bg-element)
              <div key={t._id} onContextMenu={(e) => handleContextMenu(e, t)} style={{ display: 'flex', gap: '20px', padding: '12px', background: 'var(--bg-element)', marginBottom: '8px', borderRadius: '8px', opacity: t.isCancelled ? 0.5 : 1, borderLeft: `3px solid ${t.isCancelled ? '#FF5555' : 'var(--accent-purple)'}`, cursor: 'context-menu' }}>
                <span style={{ color: 'var(--accent-green)', fontFamily: 'monospace', minWidth: '80px' }}>{new Date(t.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                <span style={{ textDecoration: t.isCancelled ? 'line-through' : 'none' }}>{t.title}</span>
                {t.isCancelled && <span style={{ color: '#FF5555', fontSize: '10px', marginLeft: 'auto' }}>CANCELLED</span>}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  );

  const renderInitialLayout = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', height: '100%', overflowY: 'auto' }}>
        {days.map(day => (
            <div key={day} style={{ minHeight: '300px', background: 'var(--bg-card)', borderRadius: '12px', padding: '10px' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                {tasks.filter(t => new Date(t.start).getDate() === day.getDate()).map(t => (
                    // FIX: Replaced #333 with var(--bg-element)
                    <div key={t._id} onContextMenu={(e) => handleContextMenu(e, t)} style={{ background: 'var(--bg-element)', padding: '8px', marginBottom: '5px', borderRadius: '6px', fontSize: '12px', borderLeft: '3px solid var(--accent-purple)', cursor: 'context-menu' }}>
                        <div style={{ fontWeight: 'bold' }}>{t.title}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{new Date(t.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                    </div>
                ))}
            </div>
        ))}
    </div>
  );

  const renderPresentLayout = () => (
    <div ref={scrollContainerRef} style={{ display: 'flex', flex: 1, overflowY: 'auto', position: 'relative', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <div style={{ width: '60px', borderRight: '1px solid var(--border-color)', background: 'var(--bg-card)', position: 'sticky', left: 0, zIndex: 30 }}>
            <div style={{ height: HEADER_HEIGHT, borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 35 }}></div>
            {hours.map(h => ( <div key={h} style={{ height: '60px', borderBottom: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', paddingTop: '5px' }}>{h}:00</div> ))}
        </div>
        {days.map(day => {
            const dayTasks = tasks.filter(t => new Date(t.start).getDate() === day.getDate());
            const isToday = day.toDateString() === new Date().toDateString();
            return (
                // FIX: Replaced #121218 with var(--bg-grid)
                <div key={day} style={{ flex: 1, minWidth: '120px', borderRight: '1px solid var(--border-color)', position: 'relative', background: 'var(--bg-grid)' }}>
                    <div style={{ height: HEADER_HEIGHT, boxSizing: 'border-box', textAlign: 'center', padding: '10px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 25 }}>
                        <div style={{ fontWeight: 'bold', color: isToday ? 'var(--accent-green)' : 'var(--text-primary)' }}>{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{day.getDate()}</div>
                    </div>
                    <div style={{ position: 'relative', height: `${hours.length * 60}px` }}>
                        {hours.map(h => ( <div key={h} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, day, h)} style={{ height: '60px', borderBottom: '1px solid var(--border-color)', boxSizing: 'border-box' }} /> ))}
                        {isToday && ( <div style={{ position: 'absolute', top: `${nowMetric}px`, left: 0, right: 0, height: '2px', backgroundColor: '#FF0000', zIndex: 22, pointerEvents: 'none' }}><div style={{ position: 'absolute', left: '-5px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: 'red' }} /></div> )}
                        {dayTasks.map(task => (
                            <div key={task._id} style={getTaskStyle(task)} draggable={!task.isCancelled && !task.isUnsaved} onDragStart={(e) => handleDragStart(e, task)} onContextMenu={(e) => handleContextMenu(e, task)}>
                                <div style={{ fontWeight: 'bold' }}>{task.title}</div>
                                {!task.isCancelled && ( <div>{new Date(task.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(task.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div> )}
                                {task.isCancelled && ( <div style={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>{task.exceptionType === 'rescheduled' ? '(Rescheduled)' : '(Cancelled)'}</div> )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
    </div>
  );

  return (
    <Layout>
      <div style={{ padding: '20px', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }} onClick={() => setMenu({...menu, visible: false})}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '28px' }}>Weekly Schedule</h2>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                {unsavedChanges.length > 0 && ( <button onClick={handleSaveChanges} className="auth-btn" style={{ width: 'auto', padding: '8px 16px', background: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 2s infinite' }}> <Save size={18} /> Save Changes ({unsavedChanges.length}) </button> )}
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={handleUndo} disabled={history.length === 0 && unsavedChanges.length === 0} style={{ background: '#333', border: '1px solid #555', color: (history.length === 0 && unsavedChanges.length === 0) ? '#555' : 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer' }} title="Undo"> <Undo size={18} /> </button>
                    <button onClick={handleRedo} disabled={future.length === 0} style={{ background: '#333', border: '1px solid #555', color: future.length === 0 ? '#555' : 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer' }} title="Redo"> <Redo size={18} /> </button>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '5px', cursor: 'pointer', borderRadius: '4px' }}><ChevronLeft /></button>
                    <span style={{ minWidth: '150px', textAlign: 'center' }}>{startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(new Date(startOfWeek).setDate(startOfWeek.getDate()+6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '5px', cursor: 'pointer', borderRadius: '4px' }}><ChevronRight /></button>
                </div>
            </div>
        </div>

        {/* --- VIEW SWITCHER --- */}
        {viewMode === 'initial' && renderInitialLayout()}
        {viewMode === 'professional' && renderProfessionalLayout()}
        {viewMode === 'present' && renderPresentLayout()}

        {/* Context Menu */}
        {menu.visible && (
            <div style={{ position: 'fixed', top: menu.y, left: menu.x, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', zIndex: 1000, padding: '5px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                {menu.task.isFixed ? (
                    <>
                        <div onClick={handleCancelInstance} style={{ padding: '8px 12px', cursor: 'pointer', color: '#FF5555', display: 'flex', gap: '8px', alignItems: 'center' }}> <X size={16} /> Cancel Class </div>
                        <div onClick={() => { setRescheduleModal({ task: menu.task }); setMenu({...menu, visible: false}); }} style={{ padding: '8px 12px', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', gap: '8px', alignItems: 'center' }}> <RotateCcw size={16} /> Reschedule </div>
                    </>
                ) : (
                    <div onClick={handleDeleteNormalTask} style={{ padding: '8px 12px', cursor: 'pointer', color: '#FF5555', display: 'flex', gap: '8px', alignItems: 'center' }}> <Trash2 size={16} /> Delete Task </div>
                )}
            </div>
        )}

        {/* Reschedule Modal */}
        {rescheduleModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', minWidth: '300px' }}>
                    <h3>Reschedule "{rescheduleModal.task.title}"</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '15px' }}>Original slot will be cancelled. New task will be created pending save.</p>
                    <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input name="newDate" type="date" className="form-input" required />
                        <input name="newTime" type="time" className="form-input" required />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setRescheduleModal(null)} className="auth-btn" style={{ background: '#555', width: 'auto' }}>Cancel</button>
                            <button type="submit" className="auth-btn" style={{ width: 'auto' }}>Confirm</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    </Layout>
  );
};

export default Schedule;