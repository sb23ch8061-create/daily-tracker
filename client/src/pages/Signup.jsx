import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // <--- 1. NEW IMPORT
import api from '../utils/api';
import './Auth.css';

const Signup = () => {
  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', dob: '', profession: ''
  });
  const [otp, setOtp] = useState('');
  
  // <--- 2. NEW STATE FOR PASSWORD TOGGLE --->
  const [showPassword, setShowPassword] = useState(false); 
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Send Data to Backend (Get OTP)
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      setStep(2); // Move to OTP screen
      alert('PIN sent to your email (Check Server Console)');
    } catch (err) { alert(err.response?.data?.message || 'Signup Failed'); }
  };

  // Step 2: Verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/verify-otp', { email: formData.email, otp });
      localStorage.setItem('token', data.token);
      alert('Account Verified! Logging in...');
      navigate('/dashboard');
    } catch (err) { alert('Invalid OTP'); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">{step === 1 ? 'Create Account' : 'Verify Email'}</h2>
        
        {step === 1 ? (
          <form onSubmit={handleRegister}>
            {/* Name */}
            <div className="form-group">
              <label>Username</label>
              <input name="username" className="form-input" onChange={handleChange} required />
            </div>
            
            {/* Email */}
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" className="form-input" onChange={handleChange} required />
            </div>

            {/* DOB */}
            <div className="form-group">
              <label>Date of Birth</label>
              <input name="dob" type="date" className="form-input" onChange={handleChange} required />
            </div>

            {/* Profession (Dropdown + Type) */}
            <div className="form-group">
              <label>Profession</label>
              <input list="professions" name="profession" className="form-input" onChange={handleChange} placeholder="Select or type..." required />
              <datalist id="professions">
                <option value="Student" />
                <option value="Developer" />
                <option value="Designer" />
                <option value="Manager" />
                <option value="Teacher" />
              </datalist>
            </div>

            {/* Password - UPDATED WITH EYE ICON */}
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} // <--- Dynamic Type
                  className="form-input" 
                  onChange={handleChange} 
                  required 
                  style={{ paddingRight: '40px' }} // Make room for icon
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    color: '#A0A3AD', 
                    cursor: 'pointer' 
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-btn">Next</button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>Enter PIN from Email</label>
              <input 
                type="text" 
                className="form-input" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                placeholder="123456"
                required 
                style={{ textAlign: 'center', letterSpacing: '5px', fontSize: '20px' }}
              />
            </div>
            <button type="submit" className="auth-btn">Verify & Login</button>
          </form>
        )}

        {step === 1 && (
          <p style={{ marginTop: '20px', color: '#A0A3AD', fontSize: '14px' }}>
            Already have an account? <Link to="/login" style={{ color: '#B467FF' }}>Login</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Signup;