import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Imported useNavigate
import api from '../utils/api';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Initialize navigation hook

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      alert('Login Successful!');
      navigate('/dashboard'); // <--- THIS WAS MISSING. Now it redirects!
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
            <label>Email Address</label>
            <input 
              type="email" 
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
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