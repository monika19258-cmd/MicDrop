import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format, isPast } from 'date-fns'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const statusConfig = {
  confirmed: { label: 'Confirmed', class: 'bg-green-400/10 text-green-400 border-green-400/20' },
  pending: { label: 'Pending', class: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  cancelled: { label: 'Cancelled', class: 'bg-red-400/10 text-red-400 border-red-400/20' },
  used: { label: 'Used', class: 'bg-gray-400/10 text-gray-400 border-gray-400/20' },
}

export default function MyTickets() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await api.get('/audience/bookings')
        setBookings(data.bookings || [])
      } catch {
        setBookings([])
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [])

  const upcoming = bookings.filter((b) => b.show?.date && !isPast(new Date(b.show.date)))
  const past = bookings.filter((b) => !b.show?.date || isPast(new Date(b.show.date)))
  const displayed = activeTab === 'upcoming' ? upcoming : past

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">My Tickets</h1>
          <p className="text-gray-400">All your show bookings in one place.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit mb-8">
          {[
            { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
            { key: 'past', label: `Past (${past.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="text-white font-semibold mb-2">
              {activeTab === 'upcoming' ? 'No upcoming tickets' : 'No past tickets'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {activeTab === 'upcoming'
                ? "You haven't booked any upcoming shows."
                : "No past bookings found."}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                to="/shows"
                className="inline-flex bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Browse Shows
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((booking) => {
              const show = booking.show || {}
              const showDate = show.date ? new Date(show.date) : null
              const statusInfo = statusConfig[booking.status] || statusConfig.confirmed

              return (
                <div key={booking._id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-violet-600/30 transition-colors">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/shows/${show._id}`}
                          className="text-white font-semibold hover:text-violet-400 transition-colors block mb-1"
                        >
                          {show.title || 'Show'}
                        </Link>
                        {showDate && (
                          <p className="text-gray-400 text-sm">
                            {format(showDate, 'EEEE, MMM d, yyyy')}
                            {show.time && ` at ${show.time}`}
                          </p>
                        )}
                        {show.venue && (
                          <p className="text-gray-500 text-sm">{show.venue}, {show.city}</p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{booking.quantity || 1} ticket{(booking.quantity || 1) > 1 ? 's' : ''}</span>
                        {booking.totalAmount > 0 && (
                          <span className="text-amber-400 font-medium">
                            ₹{booking.totalAmount.toLocaleString('en-IN')}
                          </span>
                        )}
                        {booking.totalAmount === 0 && (
                          <span className="text-green-400">Free</span>
                        )}
                      </div>
                      <Link
                        to={`/audience/tickets/${booking._id}`}
                        className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
                      >
                        View Ticket
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
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
