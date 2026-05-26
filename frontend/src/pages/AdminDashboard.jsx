import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Activity,
  Search,
  Sparkles,
  TrendingUp,
  Sliders,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import api from '../api/axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('analytics');

  // Search filters
  const [userSearch, setUserSearch] = useState('');
  const [workerSearch, setWorkerSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');

  // 1. Fetch system statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await api.get('/api/admin/stats');
      return response.data.data;
    },
    enabled: !!user && user.role === 'admin'
  });

  // 2. Fetch all users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const response = await api.get('/api/admin/users');
      return response.data.data;
    },
    enabled: !!user && user.role === 'admin'
  });

  // 3. Fetch all bookings
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: async () => {
      const response = await api.get('/api/admin/bookings');
      return response.data.data;
    },
    enabled: !!user && user.role === 'admin'
  });

  // 4. Mutation to toggle user ban status
  const banMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await api.put(`/api/admin/users/${userId}/ban`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    }
  });

  // 5. Mutation to toggle worker verification status
  const verifyMutation = useMutation({
    mutationFn: async (workerProfileId) => {
      const response = await api.put(`/api/admin/workers/${workerProfileId}/verify`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md shadow-xl">
          <ShieldAlert className="mx-auto text-rose-500 mb-4" size={32} />
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Access Control Warning</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
            Administrative credentials are required to mount this core database interface.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:opacity-90"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const stats = statsData || {
    users: { total: 0, customers: 0, workers: 0, admins: 0, banned: 0 },
    profiles: { total: 0, verified: 0 },
    bookings: { total: 0, pending: 0, accepted: 0, completed: 0, cancelled: 0 },
    financials: { grossVolume: 0 },
    categoryDistribution: []
  };

  const users = usersData || [];
  const bookings = bookingsData || [];

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const term = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  // Filtered bookings list
  const filteredBookings = bookings.filter((b) => {
    const term = bookingSearch.toLowerCase();
    const customerName = b.customerId?.name || '';
    const workerName = b.workerId?.name || '';
    return (
      customerName.toLowerCase().includes(term) ||
      workerName.toLowerCase().includes(term) ||
      (b.serviceType && b.serviceType.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER PANEL */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1 z-10 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full">
              <Sparkles size={11} /> Global Controller Deck
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1.5">
              Marketplace Command Center
            </h1>
            <p className="text-slate-400 text-xs max-w-xl">
              System monitoring, active operator verification, global booking queues, and strict access control parameters.
            </p>
          </div>
          <div className="flex items-center gap-3 z-10">
            <div className="text-right hidden md:block">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Security Node</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5 justify-end">
                <ShieldCheck size={13} /> ACTIVE ADMIN
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm">
              AD
            </div>
          </div>
        </div>

        {/* MASTER GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* SIDE NAVIGATION PANEL */}
          <aside className="lg:col-span-1 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Logistics Routing</h3>
            <nav className="space-y-1">
              {[
                { id: 'analytics', label: 'Analytics Deck', icon: <TrendingUp size={14} /> },
                { id: 'users', label: 'Operator Directory', icon: <Users size={14} /> },
                { id: 'bookings', label: 'Global Logs', icon: <Calendar size={14} /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-md'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* MAIN WORKSPACE PANEL */}
          <main className="lg:col-span-3 space-y-6">
            
            {/* 1. ANALYTICS DECK VIEW */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fade-in">
                {/* Stats Dashboard Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Market Capital', val: `$${stats.financials.grossVolume}`, icon: <DollarSign size={15} />, tint: 'text-emerald-600 bg-emerald-500/10' },
                    { label: 'Active Users', val: stats.users.total, icon: <Users size={15} />, tint: 'text-indigo-600 bg-indigo-500/10' },
                    { label: 'Total Schedule Tickets', val: stats.bookings.total, icon: <Calendar size={15} />, tint: 'text-amber-600 bg-amber-500/10' },
                    { label: 'Verification Rate', val: `${stats.profiles.total ? Math.round((stats.profiles.verified / stats.profiles.total) * 100) : 0}%`, icon: <ShieldCheck size={15} />, tint: 'text-slate-900 dark:text-white bg-slate-950/5 dark:bg-white/5' }
                  ].map((stat, sIdx) => (
                    <div key={sIdx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center gap-3 shadow-sm">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.tint}`}>
                        {stat.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">{stat.label}</span>
                        <h4 className="text-lg font-black tracking-tight mt-0.5">{stat.val}</h4>
                      </div>
                    </div>
                  ))}
                </div>

                {/* VISUAL CHARTS PLATE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Category Distribution chart */}
                  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Category Service Density</h4>
                      <Layers size={14} className="text-slate-400" />
                    </div>
                    <div className="space-y-3 pt-2">
                      {stats.categoryDistribution.map((dist, idx) => {
                        const totalWorkers = stats.profiles.total || 1;
                        const percent = Math.round((dist.workers / totalWorkers) * 100);
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-slate-700 dark:text-slate-300">{dist.category}</span>
                              <span className="text-slate-500">{dist.workers} specialists ({percent}%)</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                style={{ width: `${percent}%` }}
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Booking Status Allocation ratio */}
                  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ticket Fulfillment Allocations</h4>
                      <Activity size={14} className="text-slate-400" />
                    </div>
                    <div className="flex items-center justify-center py-4 relative">
                      {/* Interactive SVG Circular Donut Chart */}
                      <svg className="w-36 h-36" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3"
                          strokeDasharray={`${stats.bookings.total ? Math.round((stats.bookings.pending / stats.bookings.total) * 100) : 0} ${100 - (stats.bookings.total ? Math.round((stats.bookings.pending / stats.bookings.total) * 100) : 0)}`}
                          strokeDashoffset="25" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-lg font-black">{stats.bookings.total}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-black">Tickets</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xxs font-bold uppercase tracking-wider pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-1.5 text-amber-500">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Pending: {stats.bookings.pending}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-indigo-500">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>Accepted: {stats.bookings.accepted}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Completed: {stats.bookings.completed}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-500">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Cancelled: {stats.bookings.cancelled}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 2. OPERATOR DIRECTORY VIEW */}
            {activeTab === 'users' && (
              <div className="space-y-4 animate-fade-in">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users by name, email address, or administrative role parameters..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-900 uppercase tracking-wider text-[9px]">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">System Override</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((u) => (
                            <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                              <td className="p-4 font-black text-slate-900 dark:text-white">{u.name}</td>
                              <td className="p-4 font-medium">{u.email}</td>
                              <td className="p-4">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  u.role === 'admin' ? 'bg-rose-500/10 text-rose-600' :
                                  u.role === 'worker' ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-500/10 text-indigo-600'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                                  u.isBanned ? 'bg-rose-500' : 'bg-emerald-500'
                                }`} />
                              </td>
                              <td className="p-4 text-right">
                                {u.role !== 'admin' && (
                                  <button
                                    onClick={() => banMutation.mutate(u._id)}
                                    className={`px-3 py-1 font-bold text-[9px] uppercase tracking-wider rounded-md transition-all ${
                                      u.isBanned
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-white dark:bg-slate-800 text-rose-600 border border-rose-200 dark:border-rose-950 hover:bg-rose-50'
                                    }`}
                                  >
                                    {u.isBanned ? 'Unban Account' : 'Ban Operator'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-slate-400">
                              No operators match query search parameters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. GLOBAL LOG QUEUE VIEW */}
            {activeTab === 'bookings' && (
              <div className="space-y-4 animate-fade-in">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search global registries by customer, specialist, or service category..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-900 uppercase tracking-wider text-[9px]">
                          <th className="p-4">Ref Log</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Assigned Expert</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Scheduled Date</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                        {filteredBookings.length > 0 ? (
                          filteredBookings.map((b) => {
                            const shortId = b._id ? b._id.slice(-6).toUpperCase() : 'BKG';
                            return (
                              <tr key={b._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                                <td className="p-4 font-black text-slate-900 dark:text-white">#{shortId}</td>
                                <td className="p-4 font-medium">{b.customerId?.name || 'Client Node'}</td>
                                <td className="p-4 font-medium">{b.workerId?.name || 'Specialist Node'}</td>
                                <td className="p-4">
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded text-[10px] font-semibold text-slate-500">
                                    {b.serviceType}
                                  </span>
                                </td>
                                <td className="p-4">
                                  {b.bookingDate ? new Date(b.bookingDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="p-4 font-bold text-slate-900 dark:text-white">${b.hourlyRate}/hr</td>
                                <td className="p-4">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    b.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                                    b.status === 'accepted' ? 'bg-indigo-500/10 text-indigo-600' :
                                    b.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                  }`}>
                                    {b.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="7" className="p-8 text-center text-slate-400">
                              No log registries match query search parameters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
