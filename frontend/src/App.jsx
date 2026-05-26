import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Workers from './pages/Workers';
import WorkerDetails from './pages/WorkerDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChatWidget from './components/ChatWidget';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const { user } = useAuthStore();

  return (
    <Router>
      <div className="app-container min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
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
