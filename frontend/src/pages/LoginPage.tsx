import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Lock, Mail, AlertCircle, ScanLine,
  CheckCircle, ArrowRight, Shield, Zap, Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  { icon: Shield, text: 'Military-grade forensic analysis' },
  { icon: Zap, text: 'Results in under 800ms' },
  { icon: Globe, text: 'Trusted by 500+ security teams' },
];

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password, remember);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 600);
    } else {
      setError(result.error || 'Login failed.');
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--brand-bg)' }}>
      {/* ─── Left branding panel ─── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col justify-between w-[46%] p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0d1f45 100%)' }}
      >
        {/* Mesh orbs */}
        <div className="mesh-bg">
          <div className="mesh-orb w-96 h-96 bg-blue-600/20" style={{ top: '-5%', left: '-10%' }} />
          <div className="mesh-orb w-72 h-72 bg-purple-600/15" style={{ bottom: '10%', right: '-5%', animationDelay: '2s' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--grad-primary)' }}>
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">TruthScan AI Pro</span>
          </Link>
        </div>

        {/* Center quote */}
        <div className="relative z-10">
          <blockquote className="text-3xl font-bold text-white leading-tight mb-6">
            "The future of digital truth verification starts here."
          </blockquote>
          <p className="text-blue-200/70 text-base leading-relaxed mb-10">
            Enterprise-grade AI authenticity detection used by security professionals worldwide.
          </p>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-slate-300 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badges */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 flex-wrap">
            {['SOC 2 Ready', 'GDPR Compliant', '99.2% Accuracy'].map(b => (
              <span key={b} className="px-3 py-1.5 rounded-full text-xs font-semibold text-blue-300 border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.08)' }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex items-center justify-center px-8 sm:px-16 py-12 relative">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex lg:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--grad-primary)' }}>
            <ScanLine className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold">TruthScan</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg"
        >
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-3">Welcome back</h1>
            <p style={{ color: 'var(--text-secondary)' }} className="text-base leading-relaxed">
              Sign in to your TruthScan AI Pro dashboard
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl mb-6 border"
                style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.25)' }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--accent-rose)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--accent-rose)' }}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google SSO placeholder */}
          <button
            type="button"
            onClick={() => setError('Google sign-in coming soon. Use email & password for now.')}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border font-semibold text-sm mb-8 transition-all hover:border-blue-500/40"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'var(--brand-border-hi)', color: 'var(--text-primary)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px" style={{ background: 'var(--brand-border)' }} />
            <span className="text-xs font-medium px-2" style={{ color: 'var(--text-muted)' }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--brand-border)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="form-label">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input pl-11"
                  placeholder="you@company.com"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="login-password" className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <button
                  type="button"
                  className="text-xs font-semibold transition-colors"
                  style={{ color: 'var(--accent-blue)' }}
                  onClick={() => setError('Password reset coming soon. Any valid password works in demo mode.')}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input pl-11 pr-12"
                  placeholder="Min. 6 characters"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-3 py-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
              />
              <label htmlFor="remember-me" className="text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                Remember me for 30 days
              </label>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || success}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-primary w-full mt-3"
              style={{ height: '54px', fontSize: '16px' }}
            >
              {success ? (
                <>
                  <CheckCircle className="w-5 h-5" /> Signed in!
                </>
              ) : isLoading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </form>

          <p className="text-center mt-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold transition-colors" style={{ color: 'var(--accent-blue-hi)' }}>
              Start free trial
            </Link>
          </p>

          <p className="text-center mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            Demo mode — any valid email + 6-char password works
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
