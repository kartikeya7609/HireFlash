import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Workers from './pages/Workers';
import WorkerDetails from './pages/WorkerDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ChatWidget from './components/ChatWidget';
import { useAuthStore } from './store/useAuthStore';
import api from './api/axios';

// Track page visits silently
function VisitTracker() {
  const location = useLocation();
  const { user } = useAuthStore();
  useEffect(() => {
    api.post('/api/admin/track', {
      path: location.pathname,
      userId: user?._id || null,
      referrer: document.referrer || ''
    }).catch(() => {}); // silent — never block the UI
  }, [location.pathname]);
  return null;
}

function App() {
  const { user } = useAuthStore();

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-container min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <VisitTracker />
        {user && <Navbar />}
        <main className="main-content flex-grow pb-24 md:pb-0">
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/auth" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            
            {/* Protected Core App Routes */}
            <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
            <Route path="/workers" element={user ? <Workers /> : <Navigate to="/login" />} />
            <Route path="/workers/:id" element={user ? <WorkerDetails /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" />} />
            
            {/* Dynamic Fallback Guard */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </main>
        {user && <Footer />}
        {user && <ChatWidget />}
      </div>
    </Router>
  );
}

export default App;
