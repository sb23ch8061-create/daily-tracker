import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // Import Icons
import api from '../utils/api';
import './Auth.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Toggle State
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      localStorage.setItem('token', data.token);
      alert('Login Successful!');
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Login Failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email or Username</label>
            <input type="text" className="form-input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Enter email or username" required />
          </div>

          {/* PASSWORD FIELD WITH EYE ICON */}
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password" 
                required 
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#A0A3AD', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <Link to="/forgot-password" style={{ color: '#A0A3AD', fontSize: '12px', textDecoration: 'none' }}>Forgot Password?</Link>
          </div>
          <button type="submit" className="auth-btn">Sign In</button>
        </form>
        <p style={{ marginTop: '20px', color: '#A0A3AD', fontSize: '14px' }}>
          Don't have an account? <Link to="/register" style={{ color: '#B467FF' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;