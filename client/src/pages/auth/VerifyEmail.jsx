import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import api from '../../api/axios'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { verifyEmail, user } = useAuth()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const inputRefs = useRef([])

  const email = location.state?.email || user?.email || ''

  useEffect(() => {
    if (!email) {
      navigate('/register')
      return
    }
    // Focus first input
    inputRefs.current[0]?.focus()

    // Start resend timer
    const timer = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(timer)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [email, navigate])

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    // Auto advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i]
    }
    setOtp(newOtp)
    // Focus last filled or next
    const lastIndex = Math.min(pasted.length, 5)
    inputRefs.current[lastIndex]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length < 6) {
      toast.error('Please enter the 6-digit OTP')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await verifyEmail(email, otpString)
      toast.success('Email verified! Welcome to MicDrop.')
      const dashboardRoutes = {
        admin: '/admin/dashboard',
        performer: '/performer/dashboard',
        audience: '/audience/tickets',
      }
      navigate(dashboardRoutes[result.user?.role] || '/', { replace: true })
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid OTP. Please try again.'
      toast.error(message)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    setIsResending(true)
    try {
      await api.post('/auth/resend-otp', { email })
      toast.success('OTP resent to your email')
      setResendTimer(60)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()

      const timer = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) { clearInterval(timer); return 0 }
          return t - 1
        })
      }, 1000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/30 items-center justify-center mb-4">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
          <p className="text-gray-400 text-sm">
            We've sent a 6-digit code to{' '}
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            {/* OTP inputs */}
            <div className="flex gap-3 justify-center mb-8" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-gray-800 border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-colors"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.join('').length < 6}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm mb-2">Didn't receive the code?</p>
            {resendTimer > 0 ? (
              <p className="text-gray-600 text-sm">
                Resend in <span className="text-violet-400 font-medium">{resendTimer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Wrong email?{' '}
          <a
            href="/register"
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            Go back to register
          </a>
        </p>
      </div>
    </div>
  )
}
