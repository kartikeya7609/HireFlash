import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, ArrowRight, ShieldCheck, Phone, MapPin } from 'lucide-react';
import { BrandLogo, BRAND_NAME } from '../components/BrandLogo';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { 
  auth, 
  googleProvider, 
  signInWithPopup,
  signInWithEmailAndPassword
} from '../firebase';

const Login = () => {
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Profile completion states (For Google / Traditional Auth missing data collection)
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [tempToken, setTempToken] = useState('');
  const [googlePhone, setGooglePhone] = useState('');
  const [googleAddress, setGoogleAddress] = useState('');

  // Form error and response messaging
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Firebase Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setApiError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Synchronize Firebase user account with local MongoDB backend
      const response = await api.post('/api/auth/firebase-sync', {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        firebaseUid: firebaseUser.uid,
        role: 'customer'
      });

      if (response.data.success) {
        const loggedUser = response.data.user;
        const loggedToken = response.data.token;

        // Check if the user is missing crucial details like phone or address
        if (!loggedUser.phone || !loggedUser.address) {
          setTempUser(loggedUser);
          setTempToken(loggedToken);
          setShowProfileCompletion(true);
          setApiError('');
        } else {
          loginStore(loggedUser, loggedToken);
          navigate('/dashboard');
          window.location.reload();
        }
      } else {
        setApiError('MERN session synchronization failed.');
      }
    } catch (err) {
      console.error('Google Sign In Error:', err);
      setApiError(err.message || 'Google Authentication cancelled or failed.');
    }
  };

  // Google / Traditional Profile Completion Submit Handler
  const handleProfileCompletionSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    if (!googlePhone.trim() || !googleAddress.trim()) {
      setErrors({
        googlePhone: !googlePhone.trim() ? 'Phone number is required' : '',
        googleAddress: !googleAddress.trim() ? 'Living city / address is required' : ''
      });
      return;
    }

    try {
      // Setup temporary headers with logged user token for update-profile auth
      const response = await api.put('/api/auth/update-profile', 
        { phone: googlePhone, address: googleAddress },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );

      if (response.data.success) {
        loginStore(response.data.user, tempToken);
        navigate('/dashboard');
        window.location.reload();
      } else {
        setApiError('Failed to complete your profile details. Please try again.');
      }
    } catch (err) {
      console.error('Profile Completion Error:', err);
      setApiError('Profile completion failed. Check input details.');
    }
  };

  // Traditional Email/Password Login Mutation through Firebase Auth SDK
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      // 1. Authenticate user using Firebase credentials provider
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // 2. Synchronize MERN ecosystem session
      const response = await api.post('/api/auth/firebase-sync', {
        email: result.user.email
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        const loggedUser = data.user;
        const loggedToken = data.token;

        // Check if the user is missing crucial details like phone or address
        if (!loggedUser.phone || !loggedUser.address) {
          setTempUser(loggedUser);
          setTempToken(loggedToken);
          setShowProfileCompletion(true);
          setApiError('');
        } else {
          loginStore(loggedUser, loggedToken);
          navigate('/dashboard');
          window.location.reload();
        }
      } else {
        setApiError(data.message || 'Login synchronization failed.');
      }
    },
    onError: (err) => {
      console.error('Firebase Email/Password Sign In Error:', err);
      setApiError(err.message || 'Invalid email or password. Please verify credentials.');
    }
  });

  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (!email) {
      tempErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-[calc(100vh-65px)] relative w-full flex items-center justify-center px-4 py-12 transition-colors duration-300 bg-slate-50 dark:bg-slate-950">

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/[0.04] dark:bg-amber-400/[0.02] rounded-full blur-[120px]" />
      </div>

      {/* Glassmorphic Form Card */}
      <div className="relative z-10 w-full max-w-md p-8 md:p-10 rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 shadow-2xl dark:shadow-black/50 transition-all duration-300">

        {/* Dynamic Profile Completion UI Stage */}
        {showProfileCompletion ? (
          <div className="animate-fade-in space-y-5">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-500 mb-3">
                <BrandLogo size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Complete Profile</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Please provide your contact number and living city to finish logging into {BRAND_NAME}.
              </p>
            </div>

            {apiError && (
              <div className="p-3 rounded-xl text-center text-xs font-medium border border-rose-200/60 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
                {apiError}
              </div>
            )}

            <form onSubmit={handleProfileCompletionSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Phone size={13} className="text-slate-400" />
                  <span>Mobile Phone Number</span>
                </label>
                <input
                  type="text"
                  placeholder="E.g. +1 555-019-2834"
                  value={googlePhone}
                  onChange={(e) => {
                    setGooglePhone(e.target.value);
                    if (errors.googlePhone) setErrors({ ...errors, googlePhone: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-sm outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 border ${
                    errors.googlePhone ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50'
                  }`}
                />
                {errors.googlePhone && <p className="text-xxs font-medium text-rose-500 dark:text-rose-400 ml-1">{errors.googlePhone}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <MapPin size={13} className="text-slate-400" />
                  <span>Living City / Address</span>
                </label>
                <input
                  type="text"
                  placeholder="E.g. Brooklyn, NY"
                  value={googleAddress}
                  onChange={(e) => {
                    setGoogleAddress(e.target.value);
                    if (errors.googleAddress) setErrors({ ...errors, googleAddress: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-sm outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-55 border ${
                    errors.googleAddress ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50'
                  }`}
                />
                {errors.googleAddress && <p className="text-xxs font-medium text-rose-500 dark:text-rose-400 ml-1">{errors.googleAddress}</p>}
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full mt-6 py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.99] hover:bg-amber-600 dark:hover:bg-amber-400 dark:hover:text-slate-950 hover:text-white"
              >
                <span>Save & Connect Account</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        ) : (
          /* Standard Unified Authentication Interface */
          <>
            {/* Brand Header */}
            <div className="text-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 dark:text-white mb-3 hover:opacity-80 transition-opacity">
                <BrandLogo size={28} />
                <span>{BRAND_NAME}</span>
              </Link>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome Back</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs mx-auto">
                Sign in using your secure email credentials or Google identity account.
              </p>
            </div>

            {/* Firebase Google Identity Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 mb-6 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-sm active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or access with</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* API Response Messages */}
            {apiError && (
              <div className="mb-6 p-3.5 rounded-xl text-center text-xs font-medium border border-rose-200/60 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 animate-shake">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* Email Access Input */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Mail size={13} className="text-slate-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="name@enterprise.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-sm transition-all outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-55 border placeholder-slate-400 dark:placeholder-slate-600 focus:ring-1 ${
                    errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-amber-500/50 focus:ring-amber-500/50'
                  }`}
                />
                {errors.email && (
                  <p className="text-xxs font-medium text-rose-500 dark:text-rose-400 ml-1">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Lock size={13} className="text-slate-400" />
                  <span>Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-sm transition-all outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-55 border placeholder-slate-400 dark:placeholder-slate-600 focus:ring-1 ${
                    errors.password ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-amber-500/50 focus:ring-amber-500/50'
                  }`}
                />
                {errors.password && (
                  <p className="text-xxs font-medium text-rose-500 dark:text-rose-400 ml-1">{errors.password}</p>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="flex items-center justify-center gap-2 w-full mt-6 py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none hover:bg-amber-600 dark:hover:bg-amber-400 dark:hover:text-slate-950 hover:text-white"
              >
                {loginMutation.isPending ? (
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In Securely</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Subtext Navigations */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don't have an enterprise account?{' '}
                <Link to="/register" className="font-bold text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-0.5">
                  Sign Up Free
                </Link>
              </p>
              <div className="flex items-center justify-center gap-1 text-xxs text-slate-400 uppercase tracking-widest mt-4">
                <ShieldCheck size={11} className="text-amber-500" />
                <span>End-to-End Encrypted Node</span>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;