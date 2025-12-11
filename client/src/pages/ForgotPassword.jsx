import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1=Email, 2=OTP & New Pass
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigate = useNavigate();

  // Send OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(2);
      alert('PIN sent to email (Check Console)');
    } catch (err) { alert('User not found'); }
  };

  // Verify & Reset
  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      alert('Password Changed! Please Login.');
      navigate('/login');
    } catch (err) { alert('Invalid PIN or expired'); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>
        
        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label>Enter Registered Email</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="auth-btn">Send PIN</button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label>Enter PIN (From Terminal)</label>
              <input type="text" className="form-input" value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ textAlign: 'center', letterSpacing: '5px' }} />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <button type="submit" className="auth-btn">Change Password</button>
          </form>
        )}
        
        <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#666', marginTop: '15px', cursor: 'pointer', width: '100%' }}>Back to Login</button>
      </div>
    </div>
  );
};

export default ForgotPassword;