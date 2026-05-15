import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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

const categoryColors = {
  comedy: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  music: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  poetry: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
  'spoken-word': 'bg-green-400/10 text-green-400 border-green-400/20',
  'open-mic': 'bg-violet-400/10 text-violet-400 border-violet-400/20',
}

export default function ShowDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAudience } = useAuth()
  const [show, setShow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [ticketCount, setTicketCount] = useState(1)

  useEffect(() => {
    const fetchShow = async () => {
      try {
        const { data } = await api.get(`/shows/${id}`)
        setShow(data.show)
      } catch {
        toast.error('Show not found')
        navigate('/shows')
      } finally {
        setLoading(false)
      }
    }
    fetchShow()
  }, [id, navigate])

  const handleBookTickets = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book tickets')
      navigate('/login', { state: { from: { pathname: `/shows/${id}` } } })
      return
    }
    if (!isAudience) {
      toast.error('Only audience members can book tickets')
      return
    }

    if (show.ticketPrice === 0) {
      // Free ticket
      setBooking(true)
      try {
        const { data } = await api.post(`/audience/book/${id}`, { quantity: ticketCount })
        toast.success('Tickets booked successfully!')
        navigate('/audience/tickets')
      } catch (err) {
        toast.error(err.response?.data?.message || 'Booking failed')
      } finally {
        setBooking(false)
      }
      return
    }

    // Paid booking via Razorpay
    setBooking(true)
    try {
      const ok = await loadRazorpay()
      if (!ok) {
        toast.error('Payment gateway failed to load. Check your connection.')
        setBooking(false)
        return
      }

      const { data: orderData } = await api.post(`/audience/book/${id}`, { quantity: ticketCount })

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'MicDrop',
        description: `${ticketCount} ticket${ticketCount > 1 ? 's' : ''} for ${show.title}`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#7c3aed' },
        handler: async (response) => {
          try {
            await api.post('/audience/payment-verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            toast.success('Payment successful! Tickets booked.')
            navigate('/audience/tickets')
          } catch {
            toast.error('Payment verification failed. Contact support.')
          }
        },
        modal: {
          ondismiss: () => {
            setBooking(false)
            toast('Payment cancelled')
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate booking')
      setBooking(false)
    }
  }

  if (loading) return <LoadingSpinner fullScreen />
  if (!show) return null

  const isUpcoming = new Date(show.date) > new Date()
  const isSoldOut = show.ticketsAvailable === 0
  const approvedPerformers = (show.performers || []).filter((p) => p.status === 'approved')
  const categoryClass = categoryColors[show.category] || 'bg-gray-400/10 text-gray-400 border-gray-400/20'

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero image */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-violet-900/40 via-gray-900 to-gray-950 overflow-hidden">
        {show.imageUrl && (
          <img src={show.imageUrl} alt={show.title} className="w-full h-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${categoryClass} capitalize mb-3`}>
            {show.category}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{show.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ),
                  label: 'Date',
                  value: format(new Date(show.date), 'MMM d, yyyy'),
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  label: 'Time',
                  value: show.time || format(new Date(show.date), 'h:mm a'),
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                  label: 'Venue',
                  value: show.venue,
                },
                {
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  ),
                  label: 'City',
                  value: show.city,
                },
              ].map((item) => (
                <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-violet-400 mb-2">{item.icon}</div>
                  <div className="text-gray-500 text-xs mb-0.5">{item.label}</div>
                  <div className="text-white text-sm font-medium">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            {show.description && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-3">About This Show</h2>
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{show.description}</p>
              </div>
            )}

            {/* Performer lineup */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Performer Lineup
                {approvedPerformers.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500">({approvedPerformers.length})</span>
                )}
              </h2>
              {approvedPerformers.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3a4 4 0 014 4v5a4 4 0 01-8 0V7a4 4 0 014-4z" />
                    <path d="M5 11a1 1 0 012 0 5 5 0 0010 0 1 1 0 012 0 7 7 0 01-6 6.93V20h3a1 1 0 010 2H8a1 1 0 010-2h3v-2.07A7 7 0 015 11z" />
                  </svg>
                  <p className="text-gray-500 text-sm">Lineup to be announced</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {approvedPerformers.map((application) => {
                    const performer = application.performer || application
                    return (
                      <div key={application._id} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-violet-400 font-bold text-sm">
                            {performer.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium text-sm truncate">{performer.name}</div>
                          {performer.category && (
                            <div className="text-gray-500 text-xs capitalize">{performer.category}</div>
                          )}
                        </div>
                        {performer.reelUrl && (
                          <a
                            href={performer.reelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300 text-xs flex items-center gap-1 flex-shrink-0"
                          >
                            Watch reel
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Booking sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                  <div className="flex items-baseline justify-between mb-1">
                    {show.ticketPrice === 0 ? (
                      <span className="text-3xl font-bold text-green-400">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-white">
                          ₹{show.ticketPrice?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-gray-500 text-sm">per ticket</span>
                      </>
                    )}
                  </div>
                  {show.ticketsAvailable != null && (
                    <p className={`text-sm mt-1 ${isSoldOut ? 'text-red-400' : 'text-gray-400'}`}>
                      {isSoldOut ? 'Sold out' : `${show.ticketsAvailable} tickets remaining`}
                    </p>
                  )}
                </div>

                {!isSoldOut && isUpcoming && (
                  <div className="p-6 space-y-4">
                    {/* Ticket quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setTicketCount((n) => Math.max(1, n - 1))}
                          className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition-colors flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="text-white font-medium w-6 text-center">{ticketCount}</span>
                        <button
                          onClick={() => setTicketCount((n) => Math.min(show.ticketsAvailable || 10, n + 1))}
                          className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition-colors flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {show.ticketPrice > 0 && (
                      <div className="flex justify-between text-sm border-t border-gray-800 pt-3">
                        <span className="text-gray-400">Total</span>
                        <span className="text-white font-semibold">
                          ₹{(show.ticketPrice * ticketCount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleBookTickets}
                      disabled={booking}
                      className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 transition-colors flex items-center justify-center gap-2"
                    >
                      {booking ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {show.ticketPrice === 0 ? 'Reserve Free Ticket' : 'Book Now'}
                        </>
                      )}
                    </button>

                    {!isAuthenticated && (
                      <p className="text-center text-xs text-gray-500">
                        <Link to="/login" className="text-violet-400 hover:text-violet-300">Login</Link>
                        {' '}to book tickets
                      </p>
                    )}
                  </div>
                )}

                {isSoldOut && (
                  <div className="p-6">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                      <span className="text-red-400 font-medium">This show is sold out</span>
                    </div>
                  </div>
                )}

                {!isUpcoming && !isSoldOut && (
                  <div className="p-6">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                      <span className="text-gray-400">This show has already ended</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Share button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast.success('Link copied to clipboard!')
                }}
                className="w-full mt-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Show
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
