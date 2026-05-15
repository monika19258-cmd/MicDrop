import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const categories = ['comedy', 'music', 'poetry', 'spoken-word', 'open-mic']
const cities = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai']

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['comedy', 'music', 'poetry', 'spoken-word', 'open-mic']),
  city: z.enum(['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai']),
  venue: z.string().min(3, 'Venue is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  ticketPrice: z.coerce.number().min(0, 'Price cannot be negative'),
  totalTickets: z.coerce.number().min(1, 'Must have at least 1 ticket'),
  applicationFee: z.coerce.number().min(0, 'Fee cannot be negative'),
  imageUrl: z.string().url('Enter a valid image URL').optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'cancelled']),
})

export default function ShowForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [loading, setLoading] = useState(isEditing)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      category: 'open-mic',
      city: 'Bengaluru',
      venue: '',
      date: '',
      time: '19:00',
      ticketPrice: 0,
      totalTickets: 100,
      applicationFee: 0,
      imageUrl: '',
      status: 'draft',
    },
  })

  useEffect(() => {
    if (!isEditing) return
    const fetchShow = async () => {
      try {
        const { data } = await api.get(`/shows/${id}`)
        const show = data.show
        const date = show.date ? new Date(show.date).toISOString().split('T')[0] : ''
        reset({
          title: show.title || '',
          description: show.description || '',
          category: show.category || 'open-mic',
          city: show.city || 'Bengaluru',
          venue: show.venue || '',
          date,
          time: show.time || '19:00',
          ticketPrice: show.ticketPrice ?? 0,
          totalTickets: show.totalTickets ?? 100,
          applicationFee: show.applicationFee ?? 0,
          imageUrl: show.imageUrl || '',
          status: show.status || 'draft',
        })
      } catch {
        toast.error('Failed to load show')
        navigate('/admin/shows')
      } finally {
        setLoading(false)
      }
    }
    fetchShow()
  }, [id, isEditing, reset, navigate])

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (isEditing) {
        await api.put(`/admin/shows/${id}`, data)
        toast.success('Show updated successfully!')
      } else {
        await api.post('/admin/shows', data)
        toast.success('Show created successfully!')
      }
      navigate('/admin/shows')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save show')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/admin/shows"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{isEditing ? 'Edit Show' : 'Create Show'}</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {isEditing ? 'Update the show details' : 'Set up a new open-mic event'}
            </p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Show Title *</label>
              <input
                {...register('title')}
                type="text"
                placeholder="e.g. Saturday Night Laughs"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500"
              />
              {errors.title && <p className="mt-1.5 text-xs text-red-400">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description *</label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Tell attendees and performers what to expect..."
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500 resize-none"
              />
              {errors.description && <p className="mt-1.5 text-xs text-red-400">{errors.description.message}</p>}
            </div>

            {/* Category + City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Category *</label>
                <select
                  {...register('category')}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 capitalize"
                >
                  {categories.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1.5 text-xs text-red-400">{errors.category.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">City *</label>
                <select
                  {...register('city')}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.city && <p className="mt-1.5 text-xs text-red-400">{errors.city.message}</p>}
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Venue Name *</label>
              <input
                {...register('venue')}
                type="text"
                placeholder="e.g. Canvas Laugh Club, Koramangala"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500"
              />
              {errors.venue && <p className="mt-1.5 text-xs text-red-400">{errors.venue.message}</p>}
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Date *</label>
                <input
                  {...register('date')}
                  type="date"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                {errors.date && <p className="mt-1.5 text-xs text-red-400">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Time *</label>
                <input
                  {...register('time')}
                  type="time"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                {errors.time && <p className="mt-1.5 text-xs text-red-400">{errors.time.message}</p>}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Ticket Price (₹)</label>
                <input
                  {...register('ticketPrice')}
                  type="number"
                  min="0"
                  placeholder="0 for free"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500"
                />
                {errors.ticketPrice && <p className="mt-1.5 text-xs text-red-400">{errors.ticketPrice.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Total Tickets</label>
                <input
                  {...register('totalTickets')}
                  type="number"
                  min="1"
                  placeholder="100"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500"
                />
                {errors.totalTickets && <p className="mt-1.5 text-xs text-red-400">{errors.totalTickets.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Application Fee (₹)</label>
                <input
                  {...register('applicationFee')}
                  type="number"
                  min="0"
                  placeholder="0 for free"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500"
                />
                {errors.applicationFee && <p className="mt-1.5 text-xs text-red-400">{errors.applicationFee.message}</p>}
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Cover Image URL</label>
              <input
                {...register('imageUrl')}
                type="url"
                placeholder="https://example.com/image.jpg"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500"
              />
              {errors.imageUrl && <p className="mt-1.5 text-xs text-red-400">{errors.imageUrl.message}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
              <select
                {...register('status')}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="draft">Draft — not visible to public</option>
                <option value="published">Published — visible & bookable</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {errors.status && <p className="mt-1.5 text-xs text-red-400">{errors.status.message}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Link
                to="/admin/shows"
                className="flex-1 text-center bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Show' : 'Create Show'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
