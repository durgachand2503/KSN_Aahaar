'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/* ── Icons ── */
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

type AuthTab = 'login' | 'register';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const router = useRouter();

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(loginEmail, loginPassword);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Login failed');
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(regPhone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);
    const result = await register({ name: regName, email: regEmail, phone: regPhone, password: regPassword });
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Registration failed');
    }
    setIsSubmitting(false);
  };

  return (
    <section className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="font-heading font-bold text-3xl">
              <span className="text-forest">KSN</span>{' '}
              <span className="text-maroon">AAHAAR</span>
            </span>
          </Link>
          <p className="text-sm text-neutral-500">
            {activeTab === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to start ordering.'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-cream-dark rounded-xl p-1 mb-6">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={cn(
              'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200',
              activeTab === 'login'
                ? 'bg-white text-forest shadow-soft'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={cn(
              'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200',
              activeTab === 'register'
                ? 'bg-white text-forest shadow-soft'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            Create Account
          </button>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4"
          >
            {error}
          </motion.div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-11 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={isSubmitting}
                icon={<ArrowRightIcon className="w-4 h-4" />}
                iconPosition="right"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  autoComplete="name"
                  className="w-full px-4 py-3 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-400 font-medium">+91</span>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    required
                    autoComplete="tel"
                    className="w-full pl-12 pr-4 py-3 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-11 text-sm bg-cream border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={isSubmitting}
                icon={<ArrowRightIcon className="w-4 h-4" />}
                iconPosition="right"
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>
              <p className="text-[11px] text-neutral-400 text-center mt-3">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-gold-dark hover:underline">Terms</Link> and{' '}
                <Link href="/privacy" className="text-gold-dark hover:underline">Privacy Policy</Link>.
              </p>
            </form>
          )}
        </div>

        {/* Guest checkout link */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          Want to order without an account?{' '}
          <Link href="/menu" className="text-forest font-medium hover:underline">
            Continue as Guest
          </Link>
        </p>
      </motion.div>
    </section>
  );
}
