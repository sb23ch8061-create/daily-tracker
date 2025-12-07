import axios from 'axios';

// Automatically use Cloud URL if built for production, otherwise use Localhost
const BASE_URL = import.meta.env.MODE === 'production' 
  ? 'https://daily-tracker-bnnh.onrender.com/api' 
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
});

// Auto-attach token if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;