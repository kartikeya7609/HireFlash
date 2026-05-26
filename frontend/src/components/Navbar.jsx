import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Sun, Moon, Menu, X, ArrowRight, Search } from 'lucide-react';
import { BrandLogo, BRAND_NAME } from './BrandLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keep HTML document theme attribute synchronized
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'luxury') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  const isDarkMode = theme === 'luxury';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">

          {/* Commercial Brand Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 dark:text-white transition-transform duration-200 active:scale-95">
            <BrandLogo size={28} />
            <span>{BRAND_NAME}</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-xs font-semibold uppercase tracking-wider transition-colors ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/workers"
              className={({ isActive }) =>
                `text-xs font-semibold uppercase tracking-wider transition-colors ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'}`
              }
            >
              Find Services
            </NavLink>

            {user ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'}`
                  }
                >
                  <LayoutDashboard size={13} />
                  Dashboard
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors"
                >
                  <LogOut size={13} />
                  Logout ({user.name.split(' ')[0]})
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-600 dark:hover:bg-amber-400 dark:hover:text-slate-950 hover:text-white transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}

            {/* Theme Dynamic Controller */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
          </nav>

        </div>
      </header>

      {/* Mobile/Tablet Bottom Navigation Bar (Glassmorphic, Icon-only) */}
      {user && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden w-[90%] max-w-sm bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-2xl px-5 py-3.5 flex items-center justify-between gap-2 transition-all">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `p-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`
            }
          >
            <BrandLogo size={18} />
          </NavLink>
          
          <NavLink
            to="/workers"
            className={({ isActive }) =>
              `p-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`
            }
          >
            <Search size={18} />
          </NavLink>
          
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `p-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`
            }
          >
            <LayoutDashboard size={18} />
          </NavLink>
          
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
          </button>
          
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl text-rose-500 dark:text-rose-400 hover:text-rose-600 transition-all duration-200"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </nav>
      )}
    </>
  );
};

export default Navbar;