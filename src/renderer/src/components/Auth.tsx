import { useState } from 'react'
import { signIn, signUp, resetPassword } from '../supabase_utils'

interface AuthProps {
  onAuthSuccess: () => void
}

type AuthMode = 'signin' | 'signup' | 'forgot_password'

export function Auth({ onAuthSuccess }: AuthProps): React.JSX.Element {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string | null>(null)

  const resetFormState = (newMode: AuthMode): void => {
    setMode(newMode)
    setErrorMsg(null)
    setInfoMsg(null)
    setPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setInfoMsg(null)

    const trimmedEmail = email.trim()
    const trimmedName = fullName.trim()

    try {
      if (mode === 'signup') {
        if (!trimmedName) {
          setErrorMsg('Please enter your full name.')
          setLoading(false)
          return
        }

        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.')
          setLoading(false)
          return
        }

        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.')
          setLoading(false)
          return
        }

        const data = await signUp({
          email: trimmedEmail,
          password,
          name: trimmedName
        })

        if (data?.session) {
          onAuthSuccess()
        } else {
          setInfoMsg(
            'Registration successful! If email confirmation is enabled on your project, please check your inbox to verify your account.'
          )
          setMode('signin')
          setPassword('')
          setConfirmPassword('')
        }
      } else if (mode === 'signin') {
        const data = await signIn({
          email: trimmedEmail,
          password
        })

        if (data?.session || data?.user) {
          onAuthSuccess()
        }
      } else if (mode === 'forgot_password') {
        await resetPassword({
          email: trimmedEmail
        })

        setInfoMsg('Password reset instructions have been sent to your email address.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
      if (msg.toLowerCase().includes('rate limit')) {
        setErrorMsg(
          'Rate limit exceeded. Please wait a few moments before trying again, or check your Supabase rate limit settings.'
        )
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        setErrorMsg('Invalid email or password. Please double check your credentials.')
      } else if (msg.toLowerCase().includes('user already registered')) {
        setErrorMsg('An account with this email already exists. Please sign in instead.')
      } else {
        setErrorMsg(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white font-sans px-4 select-text selection:bg-neutral-800 selection:text-white">
      <div className="w-full max-w-md bg-neutral-950 border border-neutral-900/80 rounded-2xl p-8 shadow-2xl flex flex-col gap-6 backdrop-blur-sm relative overflow-hidden">
        {/* Subtle accent gradient glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-neutral-800/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-neutral-700/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 border border-neutral-700/60 text-white mb-2 shadow-inner">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="none" stroke="currentColor" />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">
            {mode === 'signup'
              ? 'Create your Account'
              : mode === 'forgot_password'
                ? 'Reset your Password'
                : 'Welcome to JobCopilot'}
          </h1>
          <p className="text-xs text-neutral-400 text-center max-w-xs leading-relaxed">
            {mode === 'signup'
              ? 'Create an account to manage your resumes, tailor applications, and track matches.'
              : mode === 'forgot_password'
                ? 'Enter your email address and we will send you a password reset link.'
                : 'Sign in to access your intelligent resume workspace and job assistant.'}
          </p>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3.5 text-xs text-red-300 font-normal leading-relaxed flex items-start gap-2.5">
            <svg
              className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-3.5 text-xs text-emerald-300 font-normal leading-relaxed flex items-start gap-2.5">
            <svg
              className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:bg-neutral-900 transition-all"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:bg-neutral-900 transition-all"
            />
          </div>

          {mode !== 'forgot_password' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
                  Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => resetFormState('forgot_password')}
                    className="text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:bg-neutral-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:bg-neutral-900 transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 active:scale-[0.99] transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
            ) : mode === 'signup' ? (
              'Create Account'
            ) : mode === 'forgot_password' ? (
              'Send Reset Link'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="flex flex-col items-center gap-2 text-xs relative z-10 pt-2 border-t border-neutral-900">
          {mode === 'signin' && (
            <p className="text-neutral-400 text-[11px]">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => resetFormState('signup')}
                className="text-white font-medium hover:underline transition-colors"
              >
                Sign Up
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p className="text-neutral-400 text-[11px]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => resetFormState('signin')}
                className="text-white font-medium hover:underline transition-colors"
              >
                Sign In
              </button>
            </p>
          )}

          {mode === 'forgot_password' && (
            <button
              type="button"
              onClick={() => resetFormState('signin')}
              className="text-neutral-400 hover:text-white text-[11px] transition-colors"
            >
              &larr; Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
