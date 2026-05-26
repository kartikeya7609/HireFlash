import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Star, Shield, ArrowLeft, Calendar, Clock, ClipboardList, CheckCircle, MapPin, Briefcase, Info } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

const WorkerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const createOrGetChannel = useChatStore((state) => state.createOrGetChannel);

  const handleChatInitiate = () => {
    if (!user) {
      alert('Please sign in or create an account to chat with this professional.');
      navigate('/login');
      return;
    }
    
    if (!workerData) return;
    const otherUserId = workerData.user?._id || workerData.user;
    const otherUserName = workerData.user?.name || 'Specialist';
    
    if (user.id === otherUserId) {
      alert('You cannot start a chat sequence with yourself.');
      return;
    }
    
    createOrGetChannel(otherUserId, otherUserName);
  };

  // Booking Form State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // TanStack Query for Worker Profile fetching
  const { data: workerData, isLoading, error } = useQuery({
    queryKey: ['worker', id],
    queryFn: async () => {
      const response = await api.get(`/api/workers/${id}`);
      return response.data.data;
    }
  });

  // TanStack Query for Booking Request submission
  const bookingMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/api/bookings', payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setBookingSuccess(true);
      } else {
        alert(data.message || 'Failed to place booking.');
      }
    },
    onError: (err) => {
      console.error(err);
      alert(err.response?.data?.message || 'Error processing booking request. Please try again.');
    }
  });

  const handleBookingSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please sign in or create an account to book this professional.');
      navigate('/login');
      return;
    }

    if (user.role !== 'customer') {
      alert('Only registered Customer accounts can place service booking requests.');
      return;
    }

    if (!workerData) return;

    const payload = {
      workerId: workerData.user?._id || workerData.user,
      serviceType: workerData.category,
      bookingDate: date,
      timeSlot: time,
      hourlyRate: workerData.hourlyRate,
      notes
    };

    bookingMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-700 border-t-amber-500 dark:border-t-amber-400 rounded-full animate-spin" />
          <span>Synchronizing Credentials...</span>
        </div>
      </div>
    );
  }

  if (error || !workerData) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="text-center p-8 md:p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md shadow-xl">
          <Info className="mx-auto text-rose-500 mb-4" size={32} />
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Profile Registry Error</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
            The target specialist record cannot be verified. It may have been de-listed or modified.
          </p>
          <Link to="/workers" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-amber-600 dark:hover:bg-amber-400 dark:hover:text-slate-950 hover:text-white transition-all">
            <ArrowLeft size={14} />
            <span>Return to Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const worker = workerData;

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 py-10 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Back Link Nav */}
        <Link to="/workers" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white mb-8 transition-colors">
          <ArrowLeft size={14} />
          <span>Back to Directory</span>
        </Link>

        {/* Master Details Responsive Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* LEFT PANEL: Specialist Profile Data */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-sm space-y-6">

              {/* Profile Card Header Component */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 pb-6 border-b border-slate-100 dark:border-slate-800/60">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white text-xl font-black shadow-sm flex-shrink-0">
                  {worker.user?.name ? worker.user.name.charAt(0) : 'W'}
                </div>
                <div className="space-y-1.5 min-w-0">
                  <span className="inline-block px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xxs font-bold uppercase tracking-wider rounded-md">
                    {worker.category}
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                    {worker.user?.name || 'Professional Partner'}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Star size={13} className="fill-amber-500 text-amber-500" />
                      <strong className="text-slate-800 dark:text-slate-200">{worker.rating?.toFixed(1) || '5.0'}</strong> (12 Reviews)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Briefcase size={12} /> {worker.experience} Yrs Experience</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {worker.location}</span>
                  </div>
                </div>
              </div>

              {/* Bio block */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Professional Background</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {worker.description}
                </p>
              </div>

              {/* Security Audit Checklist Plate */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Security Audit Parameters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Background Checked',
                    'Identity Verified',
                    'Skills Interview Certified',
                    'Reference Validated'
                  ].map((checkItem, checkIdx) => (
                    <div key={checkIdx} className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/60 rounded-xl">
                      <CheckCircle size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{checkItem}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Dynamic Glassmorphic Booking Engine */}
          <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-black/50">
            {bookingSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Booking Dispatched</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Your logistics window has been locked and requested directly from {worker.user?.name}.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full mt-2 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm hover:bg-amber-600 dark:hover:bg-amber-400 dark:hover:text-slate-950 hover:text-white"
                >
                  Manage Pipelines
                </button>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Hourly Pricing Bar */}
                <div className="flex items-baseline gap-1 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                  <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">${worker.hourlyRate}</span>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider"> / hour base</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900 dark:text-white">Request Deployment</h3>
                  <p className="text-xxs text-slate-400 dark:text-slate-500 uppercase tracking-wider">Select variable operations configurations</p>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4" noValidate>

                  {/* Target Date */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <Calendar size={12} className="text-slate-400" />
                      <span>Target Date</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                    />
                  </div>

                  {/* Arrival Window Slider */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <Clock size={12} className="text-slate-400" />
                      <span>Arrival Window</span>
                    </label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                    >
                      <option value="08:00">08:00 AM - 10:00 AM</option>
                      <option value="10:00">10:00 AM - 12:00 PM</option>
                      <option value="12:00">12:00 PM - 02:00 PM</option>
                      <option value="14:00">02:00 PM - 04:00 PM</option>
                      <option value="16:00">04:00 PM - 06:00 PM</option>
                    </select>
                  </div>

                  {/* Task Scope Field */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <ClipboardList size={12} className="text-slate-400" />
                      <span>Task Scope Instructions</span>
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Specify blueprint notes, hardware failures, or job parameters explicitly..."
                      required
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none"
                    />
                  </div>

                  {/* Action Trigger */}
                  <button
                    type="submit"
                    disabled={bookingMutation.isPending}
                    className="flex items-center justify-center gap-2 w-full mt-4 py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md hover:bg-amber-600 dark:hover:bg-amber-400 dark:hover:text-slate-950 hover:text-white disabled:opacity-55"
                  >
                    {bookingMutation.isPending ? (
                      <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Confirm Booking Request</span>
                    )}
                  </button>

                  {/* Chat Action Trigger */}
                  <button
                    type="button"
                    onClick={handleChatInitiate}
                    className="flex items-center justify-center gap-2 w-full mt-3 py-3 bg-white dark:bg-slate-900 text-slate-950 dark:text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <span>Chat with Specialist</span>
                  </button>

                  <div className="flex items-center justify-center gap-1 text-xxs text-slate-400 uppercase tracking-widest pt-2">
                    <Shield size={12} className="text-amber-500" />
                    <span>Transaction Protection Active</span>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDetails;