import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../api';

export default function AuthPage() {
  const [mode, setMode]         = useState('login');
  const [form, setForm]         = useState({ name:'', email:'', password:'', confirm:'' });
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  // ── Client-side validation before hitting server ──
  const validate = () => {
    if (mode === 'register') {
      if (!form.name.trim())          return 'Full name is required.';
      if (form.name.trim().length < 2) return 'Name must be at least 2 characters.';
    }
    if (!form.email.trim())           return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                      return 'Please enter a valid email address.';
    if (!form.password)               return 'Password is required.';
    if (form.password.length < 6)     return 'Password must be at least 6 characters.';
    if (mode === 'register' && form.password !== form.confirm)
                                      return 'Passwords do not match.';
    return null; // no error
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Run client validation first
    const validationError = validate();
    if (validationError) return setError(validationError);

    try {
      setLoading(true);
      const payload = { email: form.email.trim(), password: form.password };
      if (mode === 'register') payload.name = form.name.trim();

      let res;
      if (mode === 'login') {
        res = await loginUser(payload);
        setSuccess('Login successful! Redirecting...');
      } else {
        res = await registerUser(payload);
        setSuccess('Account created! Redirecting to dashboard...');
      }

      // Save user + token, then redirect after short delay
      setTimeout(() => {
        login(res.data);
        navigate('/dashboard');
      }, 800);

    } catch (err) {
      // Show the exact server error message
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || (err.message === 'Network Error'
            ? 'Cannot connect to server. Make sure backend is running on port 5000.'
            : 'Something went wrong. Please try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setSuccess('');
    setForm({ name:'', email:'', password:'', confirm:'' });
  };

  // Feature items — now with navigation paths
  const features = [
    {
      icon: '▦',
      title: 'Smart Dashboard',
      desc:  'Visual stats and charts for your work',
      path:  '/dashboard'
    },
    {
      icon: '◎',
      title: 'Pomodoro Timer',
      desc:  'Deep focus sessions with break reminders',
      path:  '/focus'
    },
    {
      icon: '◈',
      title: 'AI Suggestions',
      desc:  'Task ideas based on your patterns',
      path:  '/tasks'
    },
    {
      icon: '▤',
      title: 'Priority System',
      desc:  'Organize by urgency and category',
      path:  '/tasks'
    },
  ];

  return (
    <div className="auth-page">

      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        <div className="auth-brand-block">
          <div className="auth-logo">◈</div>
          <h1 className="auth-brand-name">Taskify</h1>
          <p className="auth-brand-tagline">
            Your intelligent productivity hub.<br/>
            Built for focus. Designed for results.
          </p>
        </div>

        {/* ── CLICKABLE Feature List ── */}
        <div className="auth-feature-list">
          {features.map(({ icon, title, desc, path }) => (
            <div
              key={title}
              className="auth-feature auth-feature-clickable"
              onClick={() => navigate(path)}
              title={`Go to ${title}`}
            >
              <span className="af-icon">{icon}</span>
              <div>
                <div className="af-title">{title}</div>
                <div className="af-desc">{desc}</div>
              </div>
              {/* Arrow indicator */}
              <span className="af-arrow">›</span>
            </div>
          ))}
        </div>

        <div className="auth-left-footer">
          Built with React · Node.js · MongoDB
        </div>
      </div>

      {/* ── RIGHT PANEL — FORM ── */}
      <div className="auth-right">
        <div className="auth-card">

          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >Sign In</button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >Register</button>
            <div className={`auth-tab-slider ${mode === 'register' ? 'right' : ''}`} />
          </div>

          <div className="auth-form-header">
            <h2>{mode === 'login' ? 'Welcome back!' : 'Create your account'}</h2>
            <p>{mode === 'login' ? 'Sign in to continue to Taskify' : 'Start your productivity journey'}</p>
          </div>

          <form className="auth-form" onSubmit={submit}>

            {/* Name field — only for register */}
            {mode === 'register' && (
              <div className="form-field">
                <label>Full Name</label>
                <div className="field-wrap">
                  <span className="field-icon">◎</span>
                  <input
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handle}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="form-field">
              <label>Email Address</label>
              <div className="field-wrap">
                <span className="field-icon">▦</span>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handle}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Password</label>
              <div className="field-wrap">
                <span className="field-icon">◈</span>
                <input
                  name="password"
                  type="password"
                  placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                  value={form.password}
                  onChange={handle}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-field">
                <label>Confirm Password</label>
                <div className="field-wrap">
                  <span className="field-icon">◈</span>
                  <input
                    name="confirm"
                    type="password"
                    placeholder="Repeat your password"
                    value={form.confirm}
                    onChange={handle}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            {/* ── Error Message ── */}
            {error && (
              <div className="auth-error">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── Success Message ── */}
            {success && (
              <div className="auth-success">
                <span>✓</span>
                <span>{success}</span>
              </div>
            )}

            {/* ── Submit Button ── */}
            <button
              className="auth-submit-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-loader" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'} →</>
              )}
            </button>
          </form>

          <p className="auth-switch-text">
            {mode === 'login'
              ? <>Don't have an account? <span onClick={() => switchMode('register')}>Register free</span></>
              : <>Already have an account? <span onClick={() => switchMode('login')}>Sign in</span></>
            }
          </p>

        </div>
      </div>
    </div>
  );
}