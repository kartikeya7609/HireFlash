import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Phone, MapPin, DollarSign, Briefcase } from 'lucide-react';
import { BrandLogo, BRAND_NAME } from '../components/BrandLogo';

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('customer'); // 'customer' or 'worker'

  // Auth Form Inputs State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Worker-specific state
  const [category, setCategory] = useState('Plumbing');
  const [hourlyRate, setHourlyRate] = useState('30');
  const [experience, setExperience] = useState('3');
  const [location, setLocation] = useState('Brooklyn');
  const [description, setDescription] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

      const payload = isLogin
        ? { email, password }
        : {
          name,
          email,
          password,
          role,
          phone,
          address,
          workerDetails: role === 'worker' ? {
            category,
            hourlyRate: Number(hourlyRate),
            experience: Number(experience),
            location,
            description
          } : null
        };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        // Store user session credentials in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
        window.location.reload();
      } else {
        setError(data.message || 'An error occurred during authentication.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container container animate-fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="logo" style={{ justifyContent: 'center', marginBottom: '16px' }}>
            <BrandLogo size={26} />
            <span>{BRAND_NAME}</span>
          </Link>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to schedule service calls' : 'Join as a Customer or Service Provider'}</p>
        </div>

        <div className="auth-tabs">
          <div
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </div>
          <div
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Sign Up
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '14px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="booking-form">
          {!isLogin && (
            <>
              {/* Role Selection Slider */}
              <div className="form-group">
                <label>Registering As</label>
                <div className="auth-tabs" style={{ background: 'var(--bg-primary)', margin: '0' }}>
                  <div
                    className={`auth-tab ${role === 'customer' ? 'active' : ''}`}
                    style={{ padding: '6px' }}
                    onClick={() => setRole('customer')}
                  >
                    Customer
                  </div>
                  <div
                    className={`auth-tab ${role === 'worker' ? 'active' : ''}`}
                    style={{ padding: '6px' }}
                    onClick={() => setRole('worker')}
                  >
                    Professional
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><UserIcon size={14} /> Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Phone Input */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> Phone Number</label>
                <input
                  type="text"
                  placeholder="555-019-2834"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* Address Input */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} /> Living City / Address</label>
                <input
                  type="text"
                  placeholder="E.g. Brooklyn, NY"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Email Input */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> Security Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Worker Details Fields if worker is selected */}
          {!isLogin && role === 'worker' && (
            <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border-color)', marginTop: '8px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', color: 'var(--secondary)' }}>Professional Credentials</h4>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={14} /> Service Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Tutoring">Tutoring</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Carpentry">Carpentry</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14} /> Hourly Rate ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Operational City</label>
                <input
                  type="text"
                  placeholder="E.g. Manhattan, Bronx"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Professional Bio / Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe your tools, certificates, and skills..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-book-submit" style={{ border: 'none', marginTop: '12px' }}>
            {loading ? 'Processing...' : isLogin ? 'Sign In Securely' : 'Complete Registration'}
          </button>
        </form>

        <div className="auth-footer-text">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <span onClick={() => setIsLogin(false)}>Sign Up Free</span>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <span onClick={() => setIsLogin(true)}>Sign In Here</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
