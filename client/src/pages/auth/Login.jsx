import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const from = location.state?.from?.pathname || null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const getDashboardRoute = (role) => {
    const routes = {
      admin: '/admin/dashboard',
      performer: '/performer/dashboard',
      audience: '/audience/tickets',
    }
    return routes[role] || '/'
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const result = await login(data.email, data.password)
      toast.success(`Welcome back, ${result.user?.name?.split(' ')[0]}!`)
      const redirect = from || getDashboardRoute(result.user?.role)
      navigate(redirect, { replace: true })
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Check your credentials.'
      if (err.response?.status === 403 && err.response?.data?.needsVerification) {
        toast.error('Please verify your email first.')
        navigate('/verify-email', { state: { email: data.email } })
      } else {
        toast.error(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-950 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-violet-600 items-center justify-center mb-4 shadow-lg shadow-violet-900/40">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3a4 4 0 014 4v5a4 4 0 01-8 0V7a4 4 0 014-4zm0 2a2 2 0 00-2 2v5a2 2 0 004 0V7a2 2 0 00-2-2z" />
              <path d="M5 11a1 1 0 012 0 5 5 0 0010 0 1 1 0 012 0 7 7 0 01-6 6.93V20h3a1 1 0 010 2H8a1 1 0 010-2h3v-2.07A7 7 0 015 11z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm">Sign in to your MicDrop account</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="rahul@example.com"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-500 transition-colors"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <a href="#" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                {...register('password')}
                type="password"
                placeholder="Your password"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-500 transition-colors"
              />
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 text-center">
            New to MicDrop?{' '}
            <Link to="/shows" className="text-violet-400 hover:text-violet-300">Browse shows</Link>
            {' '}without signing in.
          </p>
        </div>
      </div>
    </div>
  )
}
