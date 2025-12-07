import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, ArrowLeft, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../utils/api';

const FocusMode = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const task = location.state?.task; // Get task passed from Dashboard

  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      setIsActive(false);
      new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
      alert(isBreak ? 'Break is over! Back to work.' : 'Focus session complete! Take a break.');
      setIsBreak(!isBreak);
      setTimeLeft(isBreak ? 25 * 60 : 5 * 60); // Toggle between 25m and 5m
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
    setIsBreak(false);
  };

  const markCompleted = async () => {
    if (!task) return;
    try {
        await api.put(`/tasks/${task._id}/status`, { status: 'Completed' });
        alert('Task Completed!');
        navigate('/dashboard');
    } catch (err) { alert('Error updating task'); }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!task) return <Layout><div style={{padding: 40}}>Please select a task from Dashboard first.</div></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px' }}>
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div style={{ background: 'var(--bg-card)', padding: '60px', borderRadius: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <h2 style={{ fontSize: '24px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            {isBreak ? '☕ Break Time' : '🔥 Focus Mode'}
          </h2>
          <h1 style={{ fontSize: '36px', marginBottom: '40px', color: 'white' }}>{task.title}</h1>

          <div style={{ fontSize: '120px', fontWeight: 'bold', fontFamily: 'monospace', color: isBreak ? '#6BFF2C' : '#B467FF', marginBottom: '40px' }}>
            {formatTime(timeLeft)}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' }}>
            <button onClick={toggleTimer} style={{ padding: '16px 32px', borderRadius: '50px', border: 'none', background: isActive ? '#FF5555' : 'white', color: isActive ? 'white' : 'black', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isActive ? <Pause /> : <Play />} {isActive ? 'Pause' : 'Start'}
            </button>
            <button onClick={resetTimer} style={{ padding: '16px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'white', cursor: 'pointer' }}>
              <RotateCcw />
            </button>
          </div>

          <button onClick={markCompleted} style={{ background: 'none', border: 'none', color: 'var(--accent-green)', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
            <CheckCircle size={20} /> Mark Task as Done
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default FocusMode;