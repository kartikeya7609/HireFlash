import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import emailjs from '@emailjs/browser';
import {
  Mail, Lock, User as UserIcon, Phone, MapPin,
  DollarSign, Briefcase, ShieldCheck, ArrowRight, KeyRound, RefreshCw
} from 'lucide-react';
import { BrandLogo, BRAND_NAME } from '../components/BrandLogo';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { auth, createUserWithEmailAndPassword } from '../firebase';

// ─── EmailJS Config ──────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Premium OTP Verification Screen ────────────────────────────────────────
const OtpModal = ({ email, onVerified, onResend, loading, error, setError }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef([]);
  const cooldownRef = useRef(null);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputs.current[5]?.focus();
    }
  };

  const startCooldown = () => {
    setResendCooldown(30);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = () => {
    if (resendCooldown > 0) return;
    startCooldown();
    onResend();
  };

  const filled = otp.every(d => d !== '');

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-950 px-4 py-10">

      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-orange-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-amber-400/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-[0_0_80px_rgba(245,158,11,0.08)]">

          {/* Brand logo */}
          <div className="flex justify-center mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-lg font-black text-white/80 hover:text-white transition-colors">
              <BrandLogo size={22} />
              <span>{BRAND_NAME}</span>
            </Link>
          </div>

          {/* Icon + heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-amber-500/40 rounded-2xl blur-xl scale-110" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/40">
                <KeyRound size={28} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
              Verify Your Email
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Enter the 6-digit code we sent to
            </p>
            <div className="mt-3 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 inline-flex items-center gap-2 max-w-full">
              <Mail size={13} className="text-amber-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-amber-300 truncate">{email}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-2xl text-center text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {error}
            </div>
          )}

          {/* OTP Boxes */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-8" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onFocus={() => setError('')}
                style={{ caretColor: '#f59e0b' }}
                className={[
                  'w-11 h-14 sm:w-12 sm:h-16',
                  'text-center text-xl sm:text-2xl font-black',
                  'rounded-xl border-2 outline-none',
                  'transition-all duration-200',
                  'bg-white/5 text-white',
                  digit
                    ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-105'
                    : 'border-white/10 hover:border-white/20 focus:border-amber-400 focus:bg-amber-500/5 focus:shadow-[0_0_20px_rgba(245,158,11,0.2)] focus:scale-105'
                ].join(' ')}
              />
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-8">
            {otp.map((d, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${d ? 'bg-amber-400 scale-125' : 'bg-white/15'}`} />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => onVerified(otp.join(''))}
            disabled={loading || !filled}
            className={[
              'w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest',
              'transition-all duration-300 flex items-center justify-center gap-2',
              filled && !loading
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
            ].join(' ')}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify & Create Account
                <ArrowRight size={15} />
              </>
            )}
          </button>

          {/* Resend */}
          <div className="mt-6 text-center space-y-1.5">
            <p className="text-xs text-slate-500">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className={`inline-flex items-center gap-1.5 text-xs font-bold transition-all duration-200 ${
                resendCooldown > 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <RefreshCw size={12} className={resendCooldown > 0 ? 'animate-spin' : ''} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-center gap-1.5">
            <ShieldCheck size={11} className="text-amber-500/50" />
            <span className="text-[10px] uppercase tracking-widest text-slate-600">
              End-to-End Encrypted · Expires in 10 min
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Register Component ────────────────────────────────────────────────
const Register = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore(s => s.login);

  const [role, setRole] = useState('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [hourlyRate, setHourlyRate] = useState('30');
  const [experience, setExperience] = useState('3');
  const [location, setLocation] = useState('Brooklyn');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [pendingOtp, setPendingOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  const pendingPayload = useRef(null);

  const sendOtpEmail = async (toEmail, toName, otp) => {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email: toEmail,    // → Template "To Email": {{to_email}}
        to_name: toName,      // → Template greeting: {{to_name}}
        name: toName,         // → Template "From Name" / {{name}} fallback
        email: toEmail,       // → Template "Reply To": {{email}}
        otp_code: otp,        // → OTP display: {{otp_code}}
        app_name: 'HireFlash',
        expiry_minutes: '10',
      },
      EMAILJS_PUBLIC_KEY
    );
  };

  const validateForm = () => {
    const temp = {};
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!name.trim()) temp.name = 'Full name is required';
    if (!email) temp.email = 'Email is required';
    else if (!emailRegex.test(email)) temp.email = 'Enter a valid email';
    if (!password) temp.password = 'Password is required';
    else if (password.length < 6) temp.password = 'Min 6 characters';
    if (!phone.trim()) temp.phone = 'Phone is required';
    if (!address.trim()) temp.address = 'Address is required';
    if (role === 'worker') {
      if (!hourlyRate || Number(hourlyRate) <= 0) temp.hourlyRate = 'Enter valid rate';
      if (!experience || Number(experience) < 0) temp.experience = 'Enter valid experience';
      if (!location.trim()) temp.location = 'Location is required';
      if (!description.trim()) temp.description = 'Bio is required';
    }
    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) return;

    pendingPayload.current = {
      name, email, password, role, phone, address,
      workerDetails: role === 'worker'
        ? { category, hourlyRate: Number(hourlyRate), experience: Number(experience), location, description }
        : null
    };

    setSendingOtp(true);
    try {
      const otp = generateOtp();
      const expiry = Date.now() + 10 * 60 * 1000;
      await sendOtpEmail(email, name, otp);
      setPendingOtp(otp);
      setOtpExpiry(expiry);
      setStep('otp');
    } catch (err) {
      console.error('EmailJS error:', err);
      setApiError('Failed to send verification email. Check your EmailJS config.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpError('');
    try {
      const otp = generateOtp();
      const expiry = Date.now() + 10 * 60 * 1000;
      await sendOtpEmail(email, name, otp);
      setPendingOtp(otp);
      setOtpExpiry(expiry);
      setOtpError('New code sent! Check your inbox.');
    } catch {
      setOtpError('Failed to resend. Try again.');
    }
  };

  const registerMutation = useMutation({
    mutationFn: async (payload) => {
      const result = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
      const response = await api.post('/api/auth/firebase-sync', {
        email: payload.email,
        name: payload.name,
        role: payload.role,
        phone: payload.phone,
        address: payload.address,
        firebaseUid: result.user.uid,
        workerDetails: payload.workerDetails
      });
      return response.data;
    },
    onSuccess: (data) => {
      loginStore(data.user, data.token);
      navigate('/dashboard');
    },
    onError: (err) => {
      setOtpError(err?.response?.data?.message || err.message || 'Registration failed.');
    }
  });

  const handleOtpVerified = (enteredOtp) => {
    setOtpError('');
    if (Date.now() > otpExpiry) {
      setOtpError('Code has expired. Please request a new one.');
      return;
    }
    if (enteredOtp !== pendingOtp) {
      setOtpError('Incorrect code. Please try again.');
      return;
    }
    registerMutation.mutate(pendingPayload.current);
  };

  const fieldClass = (err) =>
    `w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 border outline-none transition-all ${
      err ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
          : 'border-slate-200 dark:border-slate-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50'
    }`;

  // ── OTP step renders the full-screen premium verification UI ──
  if (step === 'otp') {
    return (
      <OtpModal
        email={email}
        onVerified={handleOtpVerified}
        onResend={handleResendOtp}
        loading={registerMutation.isPending}
        error={otpError}
        setError={setOtpError}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] relative w-full flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/[0.04] dark:bg-amber-400/[0.02] rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl p-6 md:p-10 rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 shadow-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 dark:text-white mb-3 hover:opacity-80">
            <BrandLogo size={28} /><span>{BRAND_NAME}</span>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Account</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">We'll send a verification code to your email.</p>
        </div>

        {apiError && (
          <div className="mb-5 p-3.5 rounded-xl text-center text-xs font-medium border border-rose-200/60 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Role Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Account Type</label>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/60">
              {['customer', 'worker'].map(r => (
                <button key={r} type="button" onClick={() => { setRole(r); setErrors({}); }}
                  className={`py-2 text-xs font-bold tracking-wide rounded-lg transition-all ${role === r
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-800'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}>
                  {r === 'customer' ? 'Join as Customer' : 'Join as Specialist'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"><UserIcon size={13} />Full Name</label>
              <input type="text" placeholder="John Doe" value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }} className={fieldClass(errors.name)} />
              {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"><Mail size={13} />Email Address</label>
              <input type="email" placeholder="name@example.com" value={email} onChange={e => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }} className={fieldClass(errors.email)} />
              {errors.email && <p className="text-xs text-rose-500">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"><Phone size={13} />Phone</label>
              <input type="text" placeholder="555-019-2834" value={phone} onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors({ ...errors, phone: '' }); }} className={fieldClass(errors.phone)} />
              {errors.phone && <p className="text-xs text-rose-500">{errors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"><Lock size={13} />Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }} className={fieldClass(errors.password)} />
              {errors.password && <p className="text-xs text-rose-500">{errors.password}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"><MapPin size={13} />City / Address</label>
            <input type="text" placeholder="E.g. Brooklyn, NY" value={address} onChange={e => { setAddress(e.target.value); if (errors.address) setErrors({ ...errors, address: '' }); }} className={fieldClass(errors.address)} />
            {errors.address && <p className="text-xs text-rose-500">{errors.address}</p>}
          </div>

          {role === 'worker' && (
            <div className="p-5 space-y-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 border-b border-slate-200 dark:border-slate-800/60 pb-2">Professional Credentials</h4>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"><Briefcase size={13} />Service Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-800">
                  {['Plumbing','Electrical','Tutoring','Cleaning','Carpentry'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"><DollarSign size={13} />Hourly Rate ($)</label>
                  <input type="number" min="1" value={hourlyRate} onChange={e => { setHourlyRate(e.target.value); if (errors.hourlyRate) setErrors({ ...errors, hourlyRate: '' }); }} className={fieldClass(errors.hourlyRate)} />
                  {errors.hourlyRate && <p className="text-xs text-rose-500">{errors.hourlyRate}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Experience (yrs)</label>
                  <input type="number" min="0" value={experience} onChange={e => { setExperience(e.target.value); if (errors.experience) setErrors({ ...errors, experience: '' }); }} className={fieldClass(errors.experience)} />
                  {errors.experience && <p className="text-xs text-rose-500">{errors.experience}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Operational City</label>
                <input type="text" placeholder="E.g. Manhattan" value={location} onChange={e => { setLocation(e.target.value); if (errors.location) setErrors({ ...errors, location: '' }); }} className={fieldClass(errors.location)} />
                {errors.location && <p className="text-xs text-rose-500">{errors.location}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Professional Bio</label>
                <textarea rows="3" placeholder="Describe your credentials..." value={description} onChange={e => { setDescription(e.target.value); if (errors.description) setErrors({ ...errors, description: '' }); }} className={`${fieldClass(errors.description)} resize-none`} />
                {errors.description && <p className="text-xs text-rose-500">{errors.description}</p>}
              </div>
            </div>
          )}

          <button type="submit" disabled={sendingOtp}
            className="flex items-center justify-center gap-2 w-full mt-2 py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md hover:bg-amber-600 dark:hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none">
            {sendingOtp
              ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <><span>Send Verification Code</span><ArrowRight size={14} /></>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Sign In</Link>
          </p>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-400 uppercase tracking-widest mt-4">
            <ShieldCheck size={11} className="text-amber-500" /><span>End-to-End Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;