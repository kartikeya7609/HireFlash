import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Filter, ArrowLeft, ArrowRight, Briefcase, MapPin, SlidersHorizontal, RefreshCw } from 'lucide-react';
import api from '../api/axios';

const Workers = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query parameter parsing
  const categoryParam = searchParams.get('category') || 'All';
  const searchParam = searchParams.get('search') || '';
  const locationParam = searchParams.get('location') || '';
  const professionParam = searchParams.get('profession') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Filter input states
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [searchInput, setSearchInput] = useState(searchParam);
  const [locationFilter, setLocationFilter] = useState(locationParam);
  const [professionFilter, setProfessionFilter] = useState(professionParam);
  const [page, setPage] = useState(pageParam);

  const categories = ['All', 'Plumbing', 'Electrical', 'Tutoring', 'Cleaning', 'Carpentry'];

  // Sync state with URL parameter changes
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSearchInput(searchParam);
    setLocationFilter(locationParam);
    setProfessionFilter(professionParam);
    setPage(pageParam);
  }, [categoryParam, searchParam, locationParam, professionParam, pageParam]);

  // Main TanStack Query Hook replacing useState + useEffect
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['workers', selectedCategory, locationFilter, professionFilter, searchInput, page],
    queryFn: async () => {
      const params = {
        page,
        limit: 6
      };

      if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
      if (locationFilter.trim()) params.location = locationFilter.trim();
      if (professionFilter.trim()) params.profession = professionFilter.trim();
      if (searchInput.trim()) params.search = searchInput.trim();

      const response = await api.get('/api/workers', { params });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const workers = data?.data || [];
  const pagination = data?.pagination || {};
  const totalPages = pagination.pages || 1;
  const totalResults = pagination.total || 0;

  const updateUrlParams = (newParams) => {
    const updated = new URLSearchParams(searchParams);

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || val === 'All') {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });

    if (!newParams.page) {
      updated.set('page', '1');
      setPage(1);
    }

    setSearchParams(updated);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    updateUrlParams({ category: cat });
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchInput('');
    setLocationFilter('');
    setProfessionFilter('');
    setPage(1);
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    updateUrlParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header Metadata block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Professional Directory</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Deploy validated on-demand master technicians in real time.</p>
          </div>
          {!isLoading && (
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
              Matched Records: <strong className="text-slate-900 dark:text-white">{totalResults}</strong>
            </span>
          )}
        </div>

        {/* Categories Dynamic Segmented Slider Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 dark:border-slate-900">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => handleCategorySelect(cat)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all whitespace-nowrap ${selectedCategory === cat
                ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-transparent shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Unified High-Fidelity Omni-Search Bar */}
        <div className="relative w-full max-w-xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400 dark:text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search specialists by name, profession, location, or skills..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              updateUrlParams({ search: e.target.value });
            }}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-500/50 dark:focus:ring-amber-400/50 shadow-sm transition-all text-slate-900 dark:text-white"
          />
        </div>

        {/* Master Directory Grid Result Set Container */}
        <div className="w-full">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-500 text-xxs tracking-widest uppercase font-bold gap-3">
              <div className="w-6 h-6 border-2 border-slate-200 dark:border-slate-800 border-t-amber-500 rounded-full animate-spin" />
              <span>Scanning Network Registries...</span>
            </div>
          ) : error ? (
            <div className="text-center p-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/40 rounded-2xl max-w-lg mx-auto shadow-sm space-y-4">
              <p className="text-sm font-semibold text-rose-500">Failed to sync direct registries.</p>
              <button onClick={() => refetch()} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase rounded-xl">Try Again</button>
            </div>
          ) : workers.length > 0 ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workers.map((worker) => (
                  <div
                    key={worker._id}
                    className="flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
                  >
                    {/* Top Frame Component */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-bold text-sm overflow-hidden flex-shrink-0 shadow-sm">
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
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{worker.user?.name || 'Professional Partner'}</h3>
                        <span className="text-xxs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mt-0.5 truncate">
                          {worker.profession || 'Verified Specialist'}
                        </span>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[10px] rounded-md">
                          {worker.category}
                        </span>
                      </div>
                    </div>

                    {/* Middle description copying block */}
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {worker.description}
                      </p>

                      {/* Rendering dynamic structural skills metadata arrays */}
                      {worker.skills && worker.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {worker.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 px-2 py-0.5 rounded-md text-[10px] text-slate-500 font-medium">
                              {skill}
                            </span>
                          ))}
                          {worker.skills.length > 3 && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center font-medium pl-1">
                              +{worker.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Direct statistics readouts */}
                      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-1">
                          <Star size={13} className="fill-amber-500 text-amber-500" />
                          <span className="font-bold text-slate-800 dark:text-slate-200">{worker.rating?.toFixed(1) || '5.0'}</span>
                        </div>
                        <div>•</div>
                        <div>{worker.experience} Yrs Exp</div>
                        <div className="ml-auto flex items-center gap-0.5 truncate max-w-[110px]">
                          <MapPin size={12} className="flex-shrink-0 text-slate-300" />
                          <span className="truncate">{worker.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Plate Action Controller */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-black text-slate-900 dark:text-white">${worker.hourlyRate}</span>
                        <span className="text-[10px] font-medium text-slate-400">/hr</span>
                      </div>
                      <button
                        onClick={() => navigate(`/workers/${worker._id}`)}
                        className="px-4 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wide rounded-xl transition-all hover:bg-amber-600 dark:hover:bg-amber-400 dark:hover:text-slate-950 hover:text-white shadow-sm"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fully Unified Corporate Pagination Segment */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-900">
                  <button
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-slate-950 transition-all"
                  >
                    <ArrowLeft size={13} /> Previous
                  </button>

                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Page <strong className="text-slate-900 dark:text-white">{page}</strong> of {totalPages}
                  </span>

                  <button
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-slate-950 transition-all"
                  >
                    Next <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* System Empty Results Fallback Frame */
            <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-lg mx-auto shadow-sm space-y-5">
              <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center mx-auto text-amber-500">
                <RefreshCw size={16} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold tracking-tight">No Specialists Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Your current configurations matched zero indexed database nodes. Reset attributes or sync mock samples.
                </p>
              </div>
              <button
                className="px-5 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:bg-amber-600 dark:hover:bg-amber-400 dark:hover:text-slate-950 hover:text-white"
                onClick={async () => {
                  try {
                    const res = await api.post('/api/seed');
                    if (res.data.success) refetch();
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Auto-Seed Matrix Logs
              </button>
            </div>
          )}
        </div>

      </div>
    </div>

  );
};

export default Workers;