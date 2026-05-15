import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['performer', 'audience'], { required_error: 'Select a role' }),
})

const roles = [
  {
    value: 'audience',
    label: 'Audience',
    description: 'Discover and book tickets to open-mic shows',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    value: 'performer',
    label: 'Performer',
    description: 'Apply to shows and showcase your talent',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3a4 4 0 014 4v5a4 4 0 01-8 0V7a4 4 0 014-4zm0 2a2 2 0 00-2 2v5a2 2 0 004 0V7a2 2 0 00-2-2z" />
        <path d="M5 11a1 1 0 012 0 5 5 0 0010 0 1 1 0 012 0 7 7 0 01-6 6.93V20h3a1 1 0 010 2H8a1 1 0 010-2h3v-2.07A7 7 0 015 11z" />
      </svg>
    ),
  },
]

export default function Register() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'audience' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      await registerUser(data)
      toast.success('Account created! Please verify your email.')
      navigate('/verify-email', { state: { email: data.email } })
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.'
      toast.error(message)
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
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-gray-400 text-sm">Join India's open-mic community</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setValue('role', role.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedRole === role.value
                        ? 'border-violet-500 bg-violet-600/10 text-white'
                        : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <div className={selectedRole === role.value ? 'text-violet-400' : 'text-gray-500'}>
                      {role.icon}
                    </div>
                    <div className="text-sm font-semibold">{role.label}</div>
                    <div className="text-xs text-center leading-tight opacity-70">{role.description}</div>
                  </button>
                ))}
              </div>
              {errors.role && <p className="mt-1.5 text-xs text-red-400">{errors.role.message}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Rahul Sharma"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-500 transition-colors"
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <input
                {...register('password')}
                type="password"
                placeholder="Min. 8 characters"
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-gray-600 leading-relaxed">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-gray-500 hover:text-gray-400 underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-gray-500 hover:text-gray-400 underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
