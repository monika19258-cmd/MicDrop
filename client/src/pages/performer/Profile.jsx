import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { useAuth } from '../../hooks/useAuth'

const categories = ['comedy', 'music', 'poetry', 'spoken-word', 'open-mic']

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional().or(z.literal('')),
  category: z.enum(['comedy', 'music', 'poetry', 'spoken-word', 'open-mic'], {
    required_error: 'Select a category',
  }),
  reelUrl: z
    .string()
    .url('Enter a valid URL')
    .optional()
    .or(z.literal('')),
})

export default function PerformerProfile() {
  const { user, updateUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      bio: '',
      category: 'comedy',
      reelUrl: '',
    },
  })

  const bio = watch('bio') || ''

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/performer/profile')
        reset({
          name: data.performer?.name || user?.name || '',
          bio: data.performer?.bio || '',
          category: data.performer?.category || 'comedy',
          reelUrl: data.performer?.reelUrl || '',
        })
      } catch {
        reset({
          name: user?.name || '',
          bio: '',
          category: 'comedy',
          reelUrl: '',
        })
      } finally {
        setProfileLoaded(true)
      }
    }
    fetchProfile()
  }, [reset, user])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const { data: result } = await api.put('/performer/profile', data)
      updateUser({ name: data.name })
      toast.success('Profile updated successfully!')
      reset(data) // reset dirty state
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!profileLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Performer Profile</h1>
          <p className="text-gray-400">Showcase your talent to show organizers.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-800">
            <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-white font-semibold">{user?.name}</div>
              <div className="text-gray-400 text-sm">{user?.email}</div>
              <div className="text-violet-400 text-xs mt-0.5 capitalize">{user?.role}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Display Name</label>
              <input
                {...register('name')}
                type="text"
                placeholder="Your stage name"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-500"
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Primary Category</label>
              <select
                {...register('category')}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent capitalize"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1.5 text-xs text-red-400">{errors.category.message}</p>}
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-300">Bio</label>
                <span className={`text-xs ${bio.length > 450 ? 'text-amber-400' : 'text-gray-500'}`}>
                  {bio.length}/500
                </span>
              </div>
              <textarea
                {...register('bio')}
                rows={4}
                placeholder="Tell organizers about yourself — your style, experience, and what makes your act unique..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-500 resize-none"
              />
              {errors.bio && <p className="mt-1.5 text-xs text-red-400">{errors.bio.message}</p>}
            </div>

            {/* Reel URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Reel / Video URL</label>
              <input
                {...register('reelUrl')}
                type="url"
                placeholder="https://youtube.com/watch?v=... or Instagram link"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-500"
              />
              <p className="mt-1.5 text-xs text-gray-600">YouTube, Instagram, or any video link. Helps organizers evaluate your act.</p>
              {errors.reelUrl && <p className="mt-1.5 text-xs text-red-400">{errors.reelUrl.message}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-violet-900/10 border border-violet-500/20 rounded-xl p-4">
          <h3 className="text-violet-400 font-medium text-sm mb-2">Profile tips</h3>
          <ul className="space-y-1 text-gray-500 text-xs">
            <li>• A complete bio gets 3x more approvals from organizers</li>
            <li>• Adding a reel/video link significantly boosts your chances</li>
            <li>• Choose the category that best represents your primary act</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
