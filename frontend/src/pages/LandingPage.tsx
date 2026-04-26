import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ScanLine, ArrowRight, Shield, Zap, BarChart3,
  CheckCircle, Star, Menu, X, ChevronRight, Lock, Eye,
  Cpu, Activity
} from 'lucide-react';

const NAV_LINKS = ['Technology', 'Pricing', 'API Docs', 'Case Studies'];

const STATS = [
  { value: '10M+',   label: 'Images Scanned' },
  { value: '99.2%',  label: 'Detection Accuracy' },
  { value: '<800ms', label: 'Average Response' },
  { value: '500+',   label: 'Enterprise Clients' },
];

const FEATURES = [
  {
    icon: Shield,
    title: 'Forensic Intelligence',
    desc: 'Multi-layer analysis including noise patterns, edge inconsistencies, and frequency domain artifacts that expose AI generation fingerprints.',
    accent: '#3b82f6',
  },
  {
    icon: Zap,
    title: 'Real-Time Detection',
    desc: 'Production-grade ensemble pipeline combining EfficientNet-B3, YOLOv8, and OpenCV forensics. Results delivered in under 800ms.',
    accent: '#8b5cf6',
  },
  {
    icon: BarChart3,
    title: 'Detailed Attribution',
    desc: 'Identify the specific AI model — DALL·E, MidJourney, Stable Diffusion, StyleGAN — with confidence scores and visual explanation.',
    accent: '#06b6d4',
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    desc: 'SOC 2-ready infrastructure. All images processed in-memory, never stored. Full audit trails for compliance teams.',
    accent: '#10b981',
  },
  {
    icon: Cpu,
    title: 'Model Attribution',
    desc: 'Pinpoint which generative model created the image. Supports 8+ diffusion architectures and 4+ GAN variants.',
    accent: '#f59e0b',
  },
  {
    icon: Activity,
    title: 'API-First Design',
    desc: 'RESTful API with sub-second latency. Integrate directly into your moderation pipeline, CMS, or security toolchain.',
    accent: '#f43f5e',
  },
];

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    period: '/month',
    desc: 'For individual developers',
    features: ['100 analyses/month', 'Basic detection', 'REST API access', 'Community support'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    desc: 'For growing teams',
    features: ['10,000 analyses/month', 'Full model attribution', 'Priority processing', 'Webhook support', 'Email support'],
    cta: 'Start free trial',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For security organizations',
    features: ['Unlimited analyses', 'Dedicated infrastructure', 'SLA guarantee', 'SSO & audit logs', 'Dedicated CSM'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'CISO, Veritas Media Group', text: 'TruthScan caught 97% of AI-generated press images in our system. It\'s now mandatory in our editorial workflow.', stars: 5 },
  { name: 'Marcus Williams', role: 'Lead Investigator, Digital Forensics Lab', text: 'The model attribution feature is remarkable. We can now trace synthetic content back to its source model with confidence.', stars: 5 },
  { name: 'Priya Sharma', role: 'Head of Trust & Safety, SocialNet', text: 'Processes 50k+ images/day without breaking a sweat. The API reliability is outstanding.', stars: 5 },
];




const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div style={{ background: 'var(--brand-bg)', color: 'var(--text-primary)' }}>

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(20px)', borderColor: 'var(--brand-border)' }}
      >
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--grad-primary)' }}>
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">TruthScan <span style={{ color: 'var(--accent-blue)' }}>AI Pro</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <a key={link} href="#features" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                {link}
              </a>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/login" className="btn-ghost btn-sm">Sign in</Link>
            <Link to="/signup" className="btn-primary btn-sm">Start free trial</Link>
          </div>

          {/* Mobile hamburger */}
          <button className="lg:hidden p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }} onClick={() => setNavOpen(o => !o)}>
            {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {navOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="lg:hidden border-t px-5 py-4 space-y-1"
            style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)' }}
          >
            {NAV_LINKS.map(link => (
              <a key={link} href="#features" onClick={() => setNavOpen(false)}
                className="block py-2.5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {link}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t" style={{ borderColor: 'var(--brand-border)' }}>
              <Link to="/login" className="btn-ghost btn-sm text-center" onClick={() => setNavOpen(false)}>Sign in</Link>
              <Link to="/signup" className="btn-primary btn-sm text-center" onClick={() => setNavOpen(false)}>Start free trial</Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Mesh background */}
        <div className="mesh-bg">
          <div className="mesh-orb w-[800px] h-[800px] bg-blue-600/12" style={{ top: '-15%', left: '-10%' }} />
          <div className="mesh-orb w-[600px] h-[600px] bg-purple-600/10" style={{ top: '5%', right: '-8%', animationDelay: '2s' }} />
          <div className="mesh-orb w-[400px] h-[400px] bg-cyan-500/08" style={{ bottom: '5%', left: '20%', animationDelay: '4s' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(var(--brand-border-hi) 1px, transparent 1px), linear-gradient(90deg, var(--brand-border-hi) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-5 text-center py-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 border"
            style={{ background: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)', color: 'var(--accent-blue-hi)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-green)' }} />
            Now live — Enterprise AI Detection Platform v2.0
          </motion.div>

          {/* Hero headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]"
          >
            <span className="hero-gradient-text">Enterprise AI Image</span>
            <br />
            <span className="text-white">Authenticity Detection</span>
            <br />
            <span className="text-white">Platform</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Detect AI-generated images, deepfakes, synthetic portraits, and manipulated media using production-grade forensic intelligence.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-6"
          >
            <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }}>
              Start Analysis <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="btn-ghost" style={{ padding: '14px 32px', fontSize: '16px' }}>
              Live Demo
            </button>
          </motion.div>

          {/* Secondary links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm mb-16"
          >
            {[
              { label: 'API Documentation', href: '#api' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Contact Sales', href: '#contact' },
            ].map(({ label, href }) => (
              <a key={label} href={href}
                className="flex items-center gap-1 font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-blue-hi)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}>
                {label} <ChevronRight className="w-3.5 h-3.5" />
              </a>
            ))}
          </motion.div>

          {/* Floating preview cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="relative max-w-4xl mx-auto"
          >
            {/* Main result preview */}
            <div className="glass-card-hi rounded-3xl p-6 border" style={{ borderColor: 'var(--brand-border-hi)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 h-7 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-full flex items-center px-3">
                    <span className="text-xs mono" style={{ color: 'var(--text-muted)' }}>app.truthscan.ai/dashboard</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', aspectRatio: '1', border: '1px solid var(--brand-border)' }}>
                  <div className="w-full h-full flex items-center justify-center">
                    <Eye className="w-12 h-12" style={{ color: 'var(--text-disabled)' }} />
                  </div>
                </div>
                <div className="col-span-2 space-y-3">
                  <div className="rounded-xl p-4 border" style={{ background: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.2)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">AI GENERATED</span>
                      <span className="text-2xl font-black" style={{ color: 'var(--accent-rose)' }}>94%</span>
                    </div>
                    <div className="progress-track">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '94%' }}
                        transition={{ duration: 1.5, delay: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="progress-fill red"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'MidJourney', val: '78%', color: 'var(--accent-blue)' },
                      { label: 'Forensic', val: '85%', color: 'var(--accent-purple)' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="rounded-xl p-3 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'var(--brand-border)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
                        <p className="text-lg font-black" style={{ color }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ STATS STRIP ═══════════════ */}
      <div className="border-y" style={{ borderColor: 'var(--brand-border)', background: 'var(--brand-surface)' }}>
        <div className="max-w-6xl mx-auto px-5 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-3xl sm:text-4xl font-black mb-1 text-gradient">{value}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section id="features" className="py-32 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--accent-blue)' }}
            >
              Platform Capabilities
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-black text-white mb-4"
            >
              Built for Enterprise
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg max-w-2xl mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              Every feature designed for security, compliance, and scale.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(({ icon: Icon, title, desc, accent }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-6 group cursor-default transition-all hover:border-blue-500/25"
                style={{ borderColor: 'var(--brand-border)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all group-hover:scale-110"
                  style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
                >
                  <Icon className="w-6 h-6" style={{ color: accent }} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="pricing" className="py-32 px-5" style={{ background: 'var(--brand-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-purple)' }}>Pricing</p>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Simple, transparent pricing</h2>
            <p style={{ color: 'var(--text-secondary)' }}>No hidden fees. Cancel anytime.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map(({ name, price, period, desc, features, cta, highlight, badge }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl p-6 border relative ${highlight ? 'border-gradient' : ''}`}
                style={{
                  background: highlight ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
                  borderColor: highlight ? 'transparent' : 'var(--brand-border)',
                }}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'var(--grad-primary)' }}>{badge}</span>
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{name}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-black text-white">{price}</span>
                    {period && <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{period}</span>}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent-green)' }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate(name === 'Enterprise' ? '#contact' : '/signup')}
                  className={highlight ? 'btn-primary w-full' : 'btn-ghost w-full'}
                >
                  {cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="py-32 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent-cyan)' }}>Testimonials</p>
            <h2 className="text-4xl font-black text-white">Trusted by security professionals</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(({ name, role, text, stars }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>"{text}"</p>
                <div>
                  <p className="text-sm font-bold text-white">{name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA BANNER ═══════════════ */}
      <section id="contact" className="py-20 px-5" style={{ background: 'var(--brand-surface)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-black text-white mb-4"
          >
            Ready to detect the truth?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg mb-8"
            style={{ color: 'var(--text-secondary)' }}
          >
            Join 500+ security teams protecting their platforms with TruthScan AI Pro.
          </motion.p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => navigate('/signup')} className="btn-primary" style={{ padding: '16px 40px', fontSize: '16px' }}>
              Start free trial <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')} className="btn-ghost" style={{ padding: '16px 40px', fontSize: '16px' }}>
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t py-8 px-5" style={{ borderColor: 'var(--brand-border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--grad-primary)' }}>
              <ScanLine className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>TruthScan AI Pro</span>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Powered by EfficientNet-B3 · YOLOv8 · OpenCV Forensics · © 2025 TruthScan
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Contact Authors: Narayanam Venkata Varshith, Guruju Harika, Chinthoju Sri Pranay, Yellapu Rakesh
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
