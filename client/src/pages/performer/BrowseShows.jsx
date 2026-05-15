import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const categories = ['', 'comedy', 'music', 'poetry', 'spoken-word', 'open-mic']
const cities = ['', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai']

export default function BrowseShows() {
  const { user } = useAuth()
  const [shows, setShows] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(null)
  const [cityFilter, setCityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [noteInputs, setNoteInputs] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [showsRes, appsRes] = await Promise.all([
          api.get('/shows?status=published&upcoming=true'),
          api.get('/performer/applications'),
        ])
        setShows(showsRes.data.shows || [])
        setApplications(appsRes.data.applications || [])
      } catch {
        setShows([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const appliedShowIds = new Set(applications.map((a) => a.show?._id || a.show))

  const filtered = shows.filter((show) => {
    if (cityFilter && show.city !== cityFilter) return false
    if (categoryFilter && show.category !== categoryFilter) return false
    return true
  })

  const handleApply = async (show) => {
    if (show.applicationFee > 0) {
      // Paid application via Razorpay
      setApplying(show._id)
      try {
        const ok = await loadRazorpay()
        if (!ok) {
          toast.error('Payment gateway failed to load.')
          setApplying(null)
          return
        }

        const { data: orderData } = await api.post(`/performer/apply/${show._id}`, {
          note: noteInputs[show._id] || '',
        })

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.razorpayKeyId,
          amount: orderData.amount,
          currency: 'INR',
          name: 'MicDrop',
          description: `Application fee for ${show.title}`,
          order_id: orderData.orderId,
          prefill: { name: user?.name, email: user?.email },
          theme: { color: '#7c3aed' },
          handler: async (response) => {
            try {
              await api.post('/performer/payment-verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
              toast.success('Application submitted successfully!')
              // Refresh applications
              const { data: appsRes } = await api.get('/performer/applications')
              setApplications(appsRes.applications || [])
            } catch {
              toast.error('Payment verification failed.')
            } finally {
              setApplying(null)
            }
          },
          modal: {
            ondismiss: () => {
              setApplying(null)
              toast('Application cancelled')
            },
          },
        }
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to initiate application')
        setApplying(null)
      }
    } else {
      // Free application
      setApplying(show._id)
      try {
        await api.post(`/performer/apply/${show._id}`, {
          note: noteInputs[show._id] || '',
        })
        toast.success('Application submitted!')
        const { data: appsRes } = await api.get('/performer/applications')
        setApplications(appsRes.applications || [])
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to apply')
      } finally {
        setApplying(null)
      }
    }
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Browse & Apply</h1>
          <p className="text-gray-400">Find shows accepting performer applications.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Cities</option>
            {cities.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 capitalize"
          >
            <option value="">All Categories</option>
            {categories.filter(Boolean).map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          {(cityFilter || categoryFilter) && (
            <button
              onClick={() => { setCityFilter(''); setCategoryFilter('') }}
              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No shows found</h3>
            <p className="text-gray-500">Try different filters or check back later for new shows.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((show) => {
              const alreadyApplied = appliedShowIds.has(show._id)
              const isApplying = applying === show._id
              const note = noteInputs[show._id] || ''

              return (
                <div key={show._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-violet-600/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Show info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Link
                          to={`/shows/${show._id}`}
                          className="text-white font-semibold hover:text-violet-400 transition-colors"
                        >
                          {show.title}
                        </Link>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-400/10 text-violet-400 border border-violet-400/20 capitalize flex-shrink-0">
                          {show.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {format(new Date(show.date), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {show.venue}, {show.city}
                        </span>
                        {show.applicationFee > 0 && (
                          <span className="text-amber-400">
                            Application fee: ₹{show.applicationFee.toLocaleString('en-IN')}
                          </span>
                        )}
                        {show.applicationFee === 0 && (
                          <span className="text-green-400">Free to apply</span>
                        )}
                      </div>
                      {show.description && (
                        <p className="text-gray-500 text-sm line-clamp-2">{show.description}</p>
                      )}
                    </div>

                    {/* Apply section */}
                    <div className="sm:w-56 flex-shrink-0">
                      {alreadyApplied ? (
                        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Already Applied
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={note}
                            onChange={(e) =>
                              setNoteInputs((prev) => ({ ...prev, [show._id]: e.target.value }))
                            }
                            placeholder="Short note to organizer (optional)"
                            rows={2}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-600 resize-none"
                          />
                          <button
                            onClick={() => handleApply(show)}
                            disabled={isApplying}
                            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-3 py-2.5 text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            {isApplying ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Applying...
                              </>
                            ) : (
                              show.applicationFee > 0
                                ? `Apply — ₹${show.applicationFee.toLocaleString('en-IN')}`
                                : 'Apply Now'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
