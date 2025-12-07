import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('token', data.token);
      alert('Account Created Successfully!');
      navigate('/'); // Redirect to dashboard (later)
    } catch (err) {
      alert(err.response?.data?.message || 'Signup Failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>
        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              name="username"
              className="form-input"
              onChange={handleChange}
              placeholder="Choose a username"
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email"
              className="form-input"
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              className="form-input"
              onChange={handleChange}
              placeholder="Choose a strong password"
              required
            />
          </div>
          <button type="submit" className="auth-btn" style={{ background: 'linear-gradient(90deg, #6BFF2C, #0E0F17)' }}>
            Sign Up
          </button> {/* Using Green accent for Signup to distinguish */}
        </form>
        <p style={{ marginTop: '20px', color: '#A0A3AD', fontSize: '14px' }}>
          Already have an account? <Link to="/login" style={{ color: '#B467FF' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;