import axios from 'axios';

// Create a pre-configured axios instance
const api = axios.create({
  baseURL: '', // Empty because we rely on Vite's local dev server proxy configured in vite.config.js
  withCredentials: true, // Enables sharing cookies/credentials between client and API
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
