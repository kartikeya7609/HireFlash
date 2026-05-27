import axios from 'axios';

// Strip any accidental trailing slash from the env var
// e.g. https://hireflash.onrender.com/ → https://hireflash.onrender.com
const rawBase = import.meta.env.VITE_API_URL || '';
const BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
