import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Droplet, Zap, BookOpen, Sparkles, Hammer,
  Star, Compass, ArrowRight, Sun, Moon, MapPin, Briefcase
} from 'lucide-react';
import api from '../api/axios';
import { useThemeStore } from '../store/useThemeStore';

const Home = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { theme, toggleTheme } = useThemeStore();

  const isDarkMode = theme === 'luxury';

  // Context-aware dynamic categories (semantic tinting optimized for light/dark)
  const categories = [
    { name: 'Plumbing', icon: <Droplet size={24} />, desc: 'Pipes, leaks, repairs', color: 'dark:text-amber-400 text-amber-600 bg-amber-500/10' },
    { name: 'Electrical', icon: <Zap size={24} />, desc: 'Wiring, fixtures, setup', color: 'dark:text-orange-400 text-orange-600 bg-orange-500/10' },
    { name: 'Tutoring', icon: <BookOpen size={24} />, desc: 'Math, Science, Language', color: 'dark:text-emerald-400 text-emerald-600 bg-emerald-500/10' },
    { name: 'Cleaning', icon: <Sparkles size={24} />, desc: 'Homes, offices, deep clean', color: 'dark:text-rose-400 text-rose-600 bg-rose-500/10' },
    { name: 'Carpentry', icon: <Hammer size={24} />, desc: 'Furniture, framing, repairs', color: 'dark:text-purple-400 text-purple-600 bg-purple-500/10' }
  ];

  // TanStack Query replacing standard useEffect
  const { data: workersData, isLoading, refetch } = useQuery({
    queryKey: ['featuredWorkers'],
    queryFn: async () => {
      const response = await api.get('/api/workers');
      return response.data.data.slice(0, 3);
    }
  });

  const featuredWorkers = workersData || [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/workers?search=${encodeURIComponent(searchTerm)}`);
    } else {
      navigate('/workers');
    }
  };

  return (
    <div className="min-h-screen relative transition-colors duration-300 overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">

      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleTheme}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm hover:scale-105 active:scale-95 transition-all text-slate-700 dark:text-slate-300"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-700" />}
        </button>
      </div>

      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-amber-500/[0.04] dark:bg-amber-400/[0.02] rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] bg-emerald-500/[0.03] dark:bg-emerald-400/[0.01] rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 md:pt-36 md:pb-28">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none mb-6">
            Find and Hire <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Top Specialists</span> Instantly
          </h1>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Deploy validated on-demand master technicians, carpenters, tutors, and cleaners in real time with transparent pricing.
          </p>

          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search by specialty, location, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow w-full px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold rounded-xl hover:bg-amber-600 dark:hover:bg-amber-400 dark:hover:text-slate-950 transition-all shadow-sm whitespace-nowrap"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Explore Our Specializations</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/workers?category=${cat.name}`)}
              className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.color}`}>
                {cat.icon}
              </div>
              <h3 className="font-bold text-sm mb-1">{cat.name}</h3>
              <p className="text-xxs text-slate-400 dark:text-slate-500">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Professionals Section */}
      <section className="py-16 px-4 bg-slate-100/50 dark:bg-slate-900/20 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 text-center sm:text-left">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Highly Demanded Partners</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Schedules are open for direct deployment calls</p>
            </div>
            <button
              onClick={() => navigate('/workers')}
              className="flex items-center gap-2 group text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 px-5 py-2.5 rounded-xl transition-all"
            >
              Browse All Specialists
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-2 border-slate-400 dark:border-slate-600 border-t-slate-900 dark:border-t-white rounded-full animate-spin"></div>
            </div>
          ) : featuredWorkers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredWorkers.map((worker) => (
                <div key={worker._id} className="flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">

                  {/* Meta Unit Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-100 font-bold overflow-hidden shadow-sm flex-shrink-0">
                      {worker.profileImageUrl ? (
                        <img
                          src={worker.profileImageUrl}
                          alt={worker.user?.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        worker.user?.name?.charAt(0) || 'W'
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-50 truncate">{worker.user?.name || 'Professional Partner'}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Briefcase size={12} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{worker.profession || 'Specialist'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Copy Section */}
                  <div className="p-6 flex-grow">
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mb-6">
                      {worker.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                      <div className="flex items-center gap-1">
                        <Star size={13} className="fill-amber-500 text-amber-500" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{worker.rating?.toFixed(1) || '5.0'}</span>
                      </div>
                      <div>•</div>
                      <div>{worker.experience} Yrs Exp</div>
                      <div className="ml-auto flex items-center gap-1 text-slate-400">
                        <MapPin size={12} />
                        <span className="truncate max-w-[100px]">{worker.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Matrix Bottom Plate */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-slate-900 dark:text-slate-50">${worker.hourlyRate}</span>
                      <span className="text-xxs text-slate-400 dark:text-slate-500 font-medium"> / hr</span>
                    </div>
                    <button
                      onClick={() => navigate(`/workers/${worker._id}`)}
                      className="px-4 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-semibold text-xs rounded-xl hover:bg-amber-600 dark:hover:bg-amber-400 dark:hover:text-slate-950 hover:text-white transition-all"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Database Empty System Handling */
            <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl mx-auto shadow-sm">
              <Compass size={32} className="mx-auto text-amber-500 mb-4" />
              <h3 className="font-bold text-base mb-1">No Active Listings Tracked</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                The database registry returns empty configurations. Seed structural mock data records directly.
              </p>
              <button
                className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold rounded-xl hover:bg-amber-600 dark:hover:bg-amber-400 dark:hover:text-slate-950 hover:text-white transition-all"
                onClick={async () => {
                  try {
                    const res = await api.post('/api/seed');
                    if (res.data.success) refetch();
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Auto-Seed System Database
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;