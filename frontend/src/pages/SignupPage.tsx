import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, Building2, Briefcase, AlertCircle, CheckCircle, ScanLine, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ROLES = [
  'Security Analyst',
  'Forensic Investigator',
  'Software Developer',
  'Data Scientist',
  'Product Manager',
  'Journalist / Media',
  'Academic Researcher',
  'Other',
];

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#f43f5e', '#f59e0b', '#3b82f6', '#10b981'];

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: colors[score] || 'var(--text-muted)' }}>
        {labels[score]}
      </p>
    </div>
  );
}

const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    organization: '', role: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service to continue.');
      return;
    }

    setIsLoading(true);
    const result = await signup({
      name: form.name,
      email: form.email,
      password: form.password,
      organization: form.organization,
      role: form.role,
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 600);
    } else {
      setError(result.error || 'Signup failed.');
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--brand-bg)' }}>
      {/* Background orbs */}
      <div className="mesh-bg fixed">
        <div className="mesh-orb w-[500px] h-[500px] bg-blue-600/10" style={{ top: '-10%', right: '-5%' }} />
        <div className="mesh-orb w-[400px] h-[400px] bg-purple-600/08" style={{ bottom: '-5%', left: '-5%', animationDelay: '3s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--grad-primary)' }}>
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">TruthScan AI Pro</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Join 500+ security teams using TruthScan AI Pro
          </p>
        </div>

        <div className="glass-card-hi p-10">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="signup-name" className="form-label">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  className="form-input pl-11"
                  placeholder="Jane Smith"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="form-label">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  className="form-input pl-11"
                  placeholder="jane@company.com"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="signup-password" className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="signup-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    className="form-input pl-11 pr-11"
                    placeholder="Min 6 chars"
                    disabled={isLoading}
                    required
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </div>
              <div>
                <label htmlFor="signup-confirm" className="form-label">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="signup-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={e => update('confirmPassword', e.target.value)}
                    className={`form-input pl-11 pr-11 ${form.confirmPassword && form.password !== form.confirmPassword ? 'error' : ''}`}
                    placeholder="Repeat password"
                    disabled={isLoading}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Organization + Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="signup-org" className="form-label">Organization <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="signup-org"
                    type="text"
                    value={form.organization}
                    onChange={e => update('organization', e.target.value)}
                    className="form-input pl-11"
                    placeholder="Acme Corp"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="signup-role" className="form-label">Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: 'var(--text-muted)' }} />
                  <select
                    id="signup-role"
                    value={form.role}
                    onChange={e => update('role', e.target.value)}
                    className="form-select pl-11"
                    disabled={isLoading}
                  >
                    <option value="">Select role...</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ToS */}
            <div className="flex items-start gap-3 pt-2">
              <input
                id="signup-tos"
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500 cursor-pointer mt-0.5 flex-shrink-0"
              />
              <label htmlFor="signup-tos" className="text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                I agree to the{' '}
                <span style={{ color: 'var(--accent-blue-hi)' }} className="font-semibold cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span style={{ color: 'var(--accent-blue-hi)' }} className="font-semibold cursor-pointer">Privacy Policy</span>
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || success}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-primary w-full"
              style={{ height: '54px', fontSize: '16px', marginTop: '6px' }}
            >
              {success ? (
                <><CheckCircle className="w-5 h-5" /> Account created!</>
              ) : isLoading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>Create account <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--accent-blue-hi)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
