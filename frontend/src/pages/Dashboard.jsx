import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import AdminDashboard from './AdminDashboard';
import {
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Activity,
  AlertCircle,
  Shield,
  Star,
  MapPin,
  Settings,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  LogOut,
  ChevronRight,
  TrendingUp,
  Upload,
  Loader2
} from 'lucide-react';
import api from '../api/axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();

  if (user && user.role === 'admin') {
    return <AdminDashboard />;
  }
  const createOrGetChannel = useChatStore((state) => state.createOrGetChannel);

  const handleChatInitiate = (booking) => {
    const otherParty = user.role === 'worker' ? booking.customerId : booking.workerId;
    if (!otherParty) return;

    const otherUserId = otherParty._id || otherParty;
    const otherUserName = otherParty.name || 'Member';
    createOrGetChannel(otherUserId, otherUserName);
  };
  const [activeTab, setActiveTab] = useState('bookings');

  // Worker Profile Form States
  const [hasProfile, setHasProfile] = useState(false);
  const [category, setCategory] = useState('Plumbing');
  const [profession, setProfession] = useState('');
  const [skills, setSkills] = useState('');
  const [hourlyRate, setHourlyRate] = useState('30');
  const [experience, setExperience] = useState('3');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [availability, setAvailability] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Image preview before upload (instant visual response)
    const localPreviewUrl = URL.createObjectURL(file);
    setImagePreview(localPreviewUrl);
    setIsUploading(true);
    setActionError('');
    setActionSuccess('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setIsUploading(false);
      if (response.data.success) {
        setProfileImageUrl(response.data.url);
        setImagePreview(''); // clear temp local preview since we now have official URL
        setActionSuccess('Profile image successfully uploaded and cached.');
      } else {
        setActionError(response.data.message || 'Image upload failed.');
      }
    } catch (err) {
      setIsUploading(false);
      console.error('File upload error:', err);
      setActionError(err.response?.data?.message || 'Error uploading file. Check configuration.');
    }
  };

  // Status Configurations
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Bookings Synchronization
  const { data: bookingsData, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await api.get('/api/bookings');
      return response.data.data;
    },
    enabled: !!user,
  });

  const bookings = bookingsData || [];

  // Status Mutator
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, action }) => {
      let endpoint = '';
      if (action === 'accept') endpoint = `/api/bookings/${bookingId}/accept`;
      else if (action === 'reject') endpoint = `/api/bookings/${bookingId}/reject`;
      else if (action === 'complete') endpoint = `/api/bookings/${bookingId}/complete`;
      else if (action === 'cancel') endpoint = `/api/bookings/${bookingId}/cancel`;

      const response = await api.put(endpoint);
      return response.data;
    },
    onSuccess: () => {
      setActionSuccess(`Pipeline sequence updated successfully.`);
      refetchBookings();
    },
    onError: (err) => {
      console.error(err);
      setActionError(err.response?.data?.message || 'Error processing action request');
    }
  });

  const updateBookingStatus = (bookingId, action) => {
    setActionSuccess('');
    setActionError('');
    updateStatusMutation.mutate({ bookingId, action });
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'worker') {
      const wp = user.workerProfile;
      if (wp) {
        setHasProfile(true);
        setCategory(wp.category || 'Plumbing');
        setProfession(wp.profession || '');
        setSkills(Array.isArray(wp.skills) ? wp.skills.join(', ') : wp.skills || '');
        setHourlyRate(wp.hourlyRate?.toString() || '30');
        setExperience(wp.experience?.toString() || '3');
        setLocation(wp.location || '');
        setDescription(wp.description || '');
        setProfileImageUrl(wp.profileImageUrl || '');
        setAvailability(wp.availability !== false);
      } else {
        setHasProfile(false);
        setLocation(user.address || '');
      }
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
    window.location.reload();
  };

  const validateForm = () => {
    const errors = {};
    if (!profession.trim()) errors.profession = 'Professional title is required';
    if (!skills.trim()) errors.skills = 'Please add at least one specialty skill';
    if (!hourlyRate || Number(hourlyRate) <= 0) errors.hourlyRate = 'Pricing rate must be greater than 0';
    if (!experience || Number(experience) < 0) errors.experience = 'Experience cannot be a negative value';
    if (!location.trim()) errors.location = 'Operational location city is required';
    if (!description.trim()) errors.description = 'A short professional bio description is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const profileMutation = useMutation({
    mutationFn: async (payload) => {
      const endpoint = '/api/workers/profile';
      const response = hasProfile
        ? await api.put(endpoint, payload)
        : await api.post(endpoint, payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        const updatedUser = { ...user, workerProfile: data.data };
        setUser(updatedUser);
        setHasProfile(true);
        setIsEditing(false);
        setActionSuccess(hasProfile ? 'Service profile configurations updated.' : 'Specialist credentials listed successfully.');
      } else {
        setActionError(data.message || 'Action failed.');
      }
    },
    onError: (err) => {
      console.error(err);
      setActionError(err.response?.data?.message || 'Operation failed. Verify parameters.');
    }
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setActionSuccess('');
    setActionError('');

    if (!validateForm()) return;

    const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
    const payload = {
      category,
      profession,
      skills: skillsArray,
      hourlyRate: Number(hourlyRate),
      experience: Number(experience),
      location,
      description,
      profileImageUrl,
      availability
    };

    profileMutation.mutate(payload);
  };

  if (!user) return null;

  // Real-time Metrics Processing
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  let financialSum = 0;
  bookings.forEach(b => {
    if (b.status === 'completed' || b.status === 'accepted') {
      financialSum += (b.hourlyRate || 30) * 3; // Baseline standardization matrix allocation
    }
  });

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* ASIDE PANEL: System Control Deck Navigation */}
          <aside className="lg:col-span-1 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/60">
              <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-black text-sm overflow-hidden flex-shrink-0 shadow-sm">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt={user.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                ) : user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">{user.name}</h3>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block mt-0.5">{user.role} Partner</span>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => { setActiveTab('bookings'); setActionSuccess(''); setActionError(''); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'bookings'
                    ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
              >
                <Calendar size={14} />
                <span>{user.role === 'worker' ? 'Job Requests' : 'My Schedule'}</span>
              </button>

              {user.role === 'worker' && (
                <button
                  onClick={() => { setActiveTab('listing'); setActionSuccess(''); setActionError(''); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'listing'
                      ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                    }`}
                >
                  <Layers size={14} />
                  <span>Service Profile</span>
                </button>
              )}

              <button
                onClick={() => { setActiveTab('profile'); setActionSuccess(''); setActionError(''); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === 'profile'
                    ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
              >
                <Settings size={14} />
                <span>Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/5 transition-all pt-4"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </nav>
          </aside>

          {/* MAIN CONTAINER: Workspace Controller */}
          <main className="lg:col-span-3 space-y-6">

            {/* Action Status Indicators */}
            {actionSuccess && (
              <div className="p-3 rounded-xl text-center text-xs font-semibold border border-emerald-200/60 dark:border-emerald-950/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                ✓ {actionSuccess}
              </div>
            )}
            {actionError && (
              <div className="p-3 rounded-xl text-center text-xs font-semibold border border-rose-200/60 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
                ⚠ {actionError}
              </div>
            )}

            {/* TAB 1: Bookings Management Pipeline */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-900">
                  <div>
                    <h2 className="text-xl font-black tracking-tight">{user.role === 'worker' ? 'Task Deployment Logs' : 'Service Orders Hub'}</h2>
                    <p className="text-xxs text-slate-400 uppercase tracking-wider mt-0.5">Real-time asynchronous syncing node active</p>
                  </div>
                </div>

                {/* Analytical Micro-Matrix Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Logs', val: totalBookings, icon: <Briefcase size={14} />, tint: 'text-slate-500 bg-slate-100 dark:bg-slate-900' },
                    { label: 'Pending Action', val: pendingBookings, icon: <Activity size={14} />, tint: 'text-amber-600 bg-amber-500/10' },
                    { label: 'Completed Jobs', val: completedBookings, icon: <CheckCircle size={14} />, tint: 'text-emerald-600 bg-emerald-500/10' },
                    { label: user.role === 'worker' ? 'Gross Revenue' : 'Gross Spent', val: `$${financialSum}`, icon: <DollarSign size={14} />, tint: 'text-slate-900 dark:text-white bg-slate-900/5 dark:bg-white/5' }
                  ].map((statCard, statIdx) => (
                    <div key={statIdx} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center gap-3 shadow-sm">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${statCard.tint}`}>
                        {statCard.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold block truncate">{statCard.label}</span>
                        <h4 className="text-base font-black tracking-tight text-slate-950 dark:text-white mt-0.5">{statCard.val}</h4>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Data Matrix Execution Plate */}
                {bookings.length > 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-900 uppercase tracking-wider text-[10px]">
                            <th className="p-4">Ref Log</th>
                            <th className="p-4">{user.role === 'worker' ? 'Customer Profile' : 'Assigned Expert'}</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Deployment Window</th>
                            <th className="p-4">Hourly Cost</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Operational Flags</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                          {bookings.map((booking) => {
                            const shortId = booking._id ? booking._id.slice(-6).toUpperCase() : 'BKG';
                            return (
                              <tr key={booking._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                                <td className="p-4 font-black text-slate-900 dark:text-white">#{shortId}</td>
                                <td className="p-4">
                                  <div className="font-semibold text-slate-950 dark:text-slate-50">
                                    {user.role === 'worker' ? (booking.customerId?.name || 'Customer Partner') : (booking.workerId?.name || 'Specialist Partner')}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                    {user.role === 'worker' ? (booking.customerId?.email || 'N/A') : (booking.workerId?.email || 'N/A')}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded text-[10px] font-semibold text-slate-500">
                                    {booking.serviceType || 'General'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="font-medium">{booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'}</div>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5"><Clock size={10} />{booking.timeSlot}</div>
                                </td>
                                <td className="p-4 font-bold text-slate-900 dark:text-white">${booking.hourlyRate}/hr</td>
                                <td className="p-4">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${booking.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                                      booking.status === 'accepted' ? 'bg-indigo-500/10 text-indigo-600' :
                                        booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                    }`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex flex-col sm:flex-row items-center justify-end gap-1.5">
                                    {user.role === 'worker' && booking.status === 'pending' && (
                                      <>
                                        <button onClick={() => updateBookingStatus(booking._id, 'accept')} className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wide rounded-md hover:bg-emerald-700 transition-all">Accept</button>
                                        <button onClick={() => updateBookingStatus(booking._id, 'reject')} className="px-2.5 py-1 bg-white dark:bg-slate-800 text-rose-600 border border-rose-200 dark:border-rose-950 font-bold text-[10px] uppercase tracking-wide rounded-md hover:bg-rose-500/5 transition-all">Decline</button>
                                      </>
                                    )}

                                    {user.role === 'worker' && booking.status === 'accepted' && (
                                      <button onClick={() => updateBookingStatus(booking._id, 'complete')} className="px-3 py-1 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-[10px] uppercase tracking-wide rounded-md hover:opacity-90 transition-all">Mark Complete</button>
                                    )}

                                    {user.role === 'customer' && booking.status === 'pending' && (
                                      <button onClick={() => updateBookingStatus(booking._id, 'cancel')} className="px-3 py-1 bg-white dark:bg-slate-800 text-rose-600 border border-rose-200 dark:border-rose-950 font-bold text-[10px] uppercase tracking-wide rounded-md hover:bg-rose-500/5 transition-all">Cancel Request</button>
                                    )}

                                    <button 
                                      onClick={() => handleChatInitiate(booking)} 
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] uppercase tracking-wide rounded-md transition-all"
                                    >
                                      Chat
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-lg mx-auto shadow-sm space-y-4">
                    <AlertCircle size={28} className="mx-auto text-slate-400" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm">No Active Registries Logged</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                        {user.role === 'worker' ? 'No client entities have locked down variable scheduling allocations with your node yet.' : 'You do not hold any verified active logistics tickets inside our system routing.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Service Listing Profile Management */}
            {user.role === 'worker' && activeTab === 'listing' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-900">
                  <div>
                    <h2 className="text-xl font-black tracking-tight">Public Directory Distribution</h2>
                    <p className="text-xxs text-slate-400 uppercase tracking-wider mt-0.5">Control search appearance telemetry nodes</p>
                  </div>
                  {hasProfile && !isEditing && (
                    <button onClick={() => { setIsEditing(true); setActionSuccess(''); setActionError(''); }} className="px-4 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-600 dark:hover:bg-amber-400 transition-all">Modify Distribution Card</button>
                  )}
                </div>

                {/* Onboarding State Initialization Form */}
                {!hasProfile && (
                  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-6 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Sparkles size={18} />
                      <h3 className="font-bold text-sm uppercase tracking-wide">Initialize System Deployment</h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                      You are not indexing inside the master directory node. Formulate credential arrays below to instantiate client search traffic logging sequences.
                    </p>

                    <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs" noValidate>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold uppercase tracking-wider text-slate-400">Operational Category</label>
                          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none">
                            <option value="Plumbing">Plumbing</option>
                            <option value="Electrical">Electrical</option>
                            <option value="Tutoring">Tutoring</option>
                            <option value="Cleaning">Cleaning</option>
                            <option value="Carpentry">Carpentry</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold uppercase tracking-wider text-slate-400">Professional Title</label>
                          <input type="text" placeholder="E.g. Certified HVAC Engineer" value={profession} onChange={(e) => setProfession(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border outline-none ${formErrors.profession ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold uppercase tracking-wider text-slate-400">Skillset Signatures (Comma Seperated Matrix)</label>
                        <input type="text" placeholder="Drain clearing, circuit layouts, structural frame mapping" value={skills} onChange={(e) => setSkills(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border outline-none ${formErrors.skills ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold uppercase tracking-wider text-slate-400">Hourly Cost ($)</label>
                          <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border outline-none ${formErrors.hourlyRate ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold uppercase tracking-wider text-slate-400">Experience (Years)</label>
                          <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border outline-none ${formErrors.experience ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold uppercase tracking-wider text-slate-400">Regional Core Base</label>
                          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border outline-none ${formErrors.location ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                          <label className="font-bold uppercase tracking-wider text-slate-400">Avatar Image Source Endpoint</label>
                          <input type="text" placeholder="https://source.unsplash.com/random" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none text-slate-900 dark:text-white" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold uppercase tracking-wider text-slate-400">Profile picture upload</label>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                          <div className="relative w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                            {imagePreview || profileImageUrl ? (
                              <img 
                                src={imagePreview || profileImageUrl} 
                                alt="Avatar Preview" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <UserIcon size={24} className="text-slate-400" />
                            )}
                            {isUploading && (
                              <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                                <Loader2 size={16} className="text-white animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              <label className="px-3.5 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                                <Upload size={10} />
                                <span>Choose Image</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleFileUpload} 
                                  className="hidden" 
                                />
                              </label>
                              {(imagePreview || profileImageUrl) && (
                                <button 
                                  type="button" 
                                  onClick={() => { setProfileImageUrl(''); setImagePreview(''); }}
                                  className="px-2.5 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-rose-500/20 active:scale-95 transition-all"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1.5 tracking-normal normal-case">
                              JPG, PNG, GIF, or WEBP. Max size 10MB. Cloudinary CDN integration active.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold uppercase tracking-wider text-slate-400">Professional Bio Core Details</label>
                        <textarea rows="4" placeholder="Draft specialized tooling, background checkpoints cleared, references..." value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border outline-none resize-none ${formErrors.description ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                      </div>

                      <button type="submit" disabled={profileMutation.isPending} className="w-full py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold uppercase tracking-wider rounded-xl transition-all hover:bg-amber-600 dark:hover:bg-amber-400 shadow-sm">
                        {profileMutation.isPending ? 'Deploying Configurations...' : 'Deploy Directory Listing'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Split Operational/Preview Frame Workspace */}
                {hasProfile && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Panel Left: Modification parameters */}
                    {isEditing ? (
                      <div className="lg:col-span-3 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Update Dynamic Metadata</h3>
                          <button onClick={() => { setIsEditing(false); setFormErrors({}); }} className="text-xxs uppercase tracking-widest font-bold text-slate-400 hover:text-slate-950 dark:hover:text-white">Cancel</button>
                        </div>

                        <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs" noValidate>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="font-bold uppercase tracking-wider text-slate-400">Service Category</label>
                              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none text-slate-900 dark:text-white">
                                <option value="Plumbing">Plumbing</option>
                                <option value="Electrical">Electrical</option>
                                <option value="Tutoring">Tutoring</option>
                                <option value="Cleaning">Cleaning</option>
                                <option value="Carpentry">Carpentry</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="font-bold uppercase tracking-wider text-slate-400">Professional Title</label>
                              <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border outline-none ${formErrors.profession ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold uppercase tracking-wider text-slate-400">Skills Core Metrics Array</label>
                            <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border outline-none ${formErrors.skills ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="font-bold uppercase tracking-wider text-slate-400">Hourly Rate Base ($)</label>
                              <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border outline-none ${formErrors.hourlyRate ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                            </div>
                            <div className="space-y-1.5">
                              <label className="font-bold uppercase tracking-wider text-slate-400">Experience Frame (Yrs)</label>
                              <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border outline-none ${formErrors.experience ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="font-bold uppercase tracking-wider text-slate-400">Regional Deployment Base</label>
                              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border outline-none ${formErrors.location ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                            </div>
                            <div className="space-y-1.5 flex flex-col justify-end">
                              <label className="font-bold uppercase tracking-wider text-slate-400">Avatar Stream Target</label>
                              <input type="text" value={profileImageUrl} onChange={(e) => setProfileImageUrl(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none text-slate-900 dark:text-white" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold uppercase tracking-wider text-slate-400">Profile image upload</label>
                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                              <div className="relative w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                                {imagePreview || profileImageUrl ? (
                                  <img 
                                    src={imagePreview || profileImageUrl} 
                                    alt="Avatar Preview" 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <UserIcon size={24} className="text-slate-400" />
                                )}
                                {isUploading && (
                                  <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                                    <Loader2 size={16} className="text-white animate-spin" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center gap-2">
                                  <label className="px-3.5 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                                    <Upload size={10} />
                                    <span>Choose Image</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      onChange={handleFileUpload} 
                                      className="hidden" 
                                    />
                                  </label>
                                  {(imagePreview || profileImageUrl) && (
                                    <button 
                                      type="button" 
                                      onClick={() => { setProfileImageUrl(''); setImagePreview(''); }}
                                      className="px-2.5 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-rose-500/20 active:scale-95 transition-all"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                                <p className="text-[9px] text-slate-400 mt-1.5 tracking-normal normal-case">
                                  JPG, PNG, GIF, or WEBP. Max size 10MB. Cloudinary CDN integration active.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="py-2">
                            <button type="button" onClick={() => setAvailability(!availability)} className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {availability ? <ToggleRight size={26} className="text-emerald-500" /> : <ToggleLeft size={26} className="text-slate-400" />}
                              <span>Broadcast Search Registry Availability (Toggles routing access)</span>
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-bold uppercase tracking-wider text-slate-400">Profile Bio Summary</label>
                            <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} className={`w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border outline-none resize-none ${formErrors.description ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`} />
                          </div>

                          <button type="submit" disabled={profileMutation.isPending} className="w-full py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all">
                            {profileMutation.isPending ? 'Committing Modifications...' : 'Commit Modifications'}
                          </button>
                        </form>
                      </div>
                    ) : (
                      <>
                        {/* Live Previews Container Card */}
                        <div className="lg:col-span-2 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
                          <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-bold text-sm overflow-hidden flex-shrink-0 shadow-sm">
                              {profileImageUrl ? (
                                <img src={profileImageUrl} alt={user.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              ) : user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-md">{category}</span>
                              <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-1">{user.name}</h3>
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-0.5 truncate">{profession || 'Unassigned Specialization'}</span>
                            </div>
                          </div>

                          <div className="p-5 flex-grow space-y-4">
                            <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-950">
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Rate Base</span>
                                <strong className="text-xs tracking-tight">${hourlyRate}/hr</strong>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Experience</span>
                                <strong className="text-xs tracking-tight">{experience} Yrs</strong>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Location</span>
                                <strong className="text-xs tracking-tight truncate block max-w-[80px] mx-auto">📍 {location || 'Not Set'}</strong>
                              </div>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed border-t border-slate-100 dark:border-slate-800/50 pt-3">
                              {description || 'Account credentials description bio container currently initialized empty.'}
                            </p>

                            <div className="flex flex-wrap gap-1 pt-1">
                              {skills.split(',').map((skill, idx) => (
                                <span key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 px-2 py-0.5 rounded-md text-[10px] text-slate-500 font-medium">
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
                            <div className="flex items-center gap-1"><Star size={13} className="fill-amber-500 text-amber-500" /><span>5.0 (Aggregate Matrix)</span></div>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${availability ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                              ● {availability ? 'Active Routing' : 'De-scheduled'}
                            </span>
                          </div>
                        </div>

                        {/* Panel Right: System logs analytics matrix */}
                        <div className="lg:col-span-1 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl space-y-5">
                          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-400">
                            <TrendingUp size={14} className="text-amber-500" />
                            <h3 className="text-xs font-bold uppercase tracking-wider">Distribution Clicks</h3>
                          </div>

                          <div className="space-y-3 font-semibold text-xs">
                            <div className="flex justify-between"><span className="text-slate-400 font-medium">Search Visibility</span><span>2,491 records</span></div>
                            <div className="flex justify-between"><span className="text-slate-400 font-medium">Profile Impressions</span><span>412 views</span></div>
                            <div className="flex justify-between"><span className="text-slate-400 font-medium">Log Routing Matrix</span><span className="text-emerald-600 dark:text-emerald-400">11.8%</span></div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 space-y-3 text-xxs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <h4 className="text-xs font-bold tracking-normal text-slate-700 dark:text-slate-300 normal-case">Verification Compliance</h4>
                            <div className="flex items-center gap-2"><CheckCircle size={13} className="text-emerald-500 flex-shrink-0" /><span>Identity Validated</span></div>
                            <div className="flex items-center gap-2"><CheckCircle size={13} className="text-emerald-500 flex-shrink-0" /><span>Background Evaluation Passed</span></div>
                            <div className="flex items-center gap-2"><CheckCircle size={13} className="text-emerald-500 flex-shrink-0" /><span>Tooling Audit Cleared</span></div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Account Profile Settings Sheet */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-200 dark:border-slate-900">
                  <h2 className="text-xl font-black tracking-tight">Verified Profile Identities</h2>
                  <p className="text-xxs text-slate-400 uppercase tracking-wider mt-0.5">Core account configuration matrices</p>
                </div>

                <div className="max-w-xl space-y-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {[
                    { label: 'Full Account Handle', val: user.name, type: 'text' },
                    { label: 'Routing Electronic Mail', val: user.email, type: 'email' },
                    { label: 'Primary Contact Node', val: user.phone || 'Not Logged', type: 'text' },
                    { label: 'Operational Dispatch Address', val: user.address || 'Not Logged', type: 'text' }
                  ].map((field, fieldIdx) => (
                    <div key={fieldIdx} className="space-y-1.5">
                      <label>{field.label}</label>
                      <input type={field.type} readOnly value={field.val} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm cursor-not-allowed normal-case outline-none" />
                    </div>
                  ))}

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3 items-start shadow-sm pt-5">
                    <Shield size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-relaxed normal-case tracking-normal">
                      Account tracking keys are statically enforced to maintain transactional audit ledger integrity. To adjust primary dispatch data configurations, initiate an auxiliary request token sequence at <code className="text-slate-900 dark:text-white font-bold">support@fashire.com</code>.
                    </p>
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

export default Dashboard;