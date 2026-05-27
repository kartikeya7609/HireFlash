import axios from 'axios';

// In development: baseURL is '' so Vite proxy forwards /api → localhost:5000
// In production (Vercel): VITE_API_URL must be set to the Render backend URL
//   e.g. https://hireflash-api.onrender.com
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
