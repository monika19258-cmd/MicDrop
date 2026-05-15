import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const statusConfig = {
  confirmed: { label: 'Confirmed', class: 'bg-green-400/10 text-green-400 border-green-400/20' },
  pending: { label: 'Pending', class: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  cancelled: { label: 'Cancelled', class: 'bg-red-400/10 text-red-400 border-red-400/20' },
  used: { label: 'Used', class: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [shows, setShows] = useState([])
  const [selectedShow, setSelectedShow] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingsRes, showsRes] = await Promise.all([
          api.get('/admin/bookings'),
          api.get('/admin/shows'),
        ])
        setBookings(bookingsRes.data.bookings || [])
        setShows(showsRes.data.shows || [])
      } catch {
        setBookings([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filtered = bookings.filter((booking) => {
    if (selectedShow && booking.show?._id !== selectedShow) return false
    if (search) {
      const q = search.toLowerCase()
      const userName = (booking.user?.name || '').toLowerCase()
      const userEmail = (booking.user?.email || '').toLowerCase()
      const showTitle = (booking.show?.title || '').toLowerCase()
      if (!userName.includes(q) && !userEmail.includes(q) && !showTitle.includes(q)) return false
    }
    return true
  })

  const totalRevenue = filtered.reduce((sum, b) => sum + (b.totalAmount || 0), 0)

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Bookings</h1>
            <p className="text-gray-400">
              {filtered.length} bookings — Revenue:{' '}
              <span className="text-amber-400 font-medium">₹{totalRevenue.toLocaleString('en-IN')}</span>
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or show..."
            className="flex-1 min-w-48 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500"
          />
          <select
            value={selectedShow}
            onChange={(e) => setSelectedShow(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Shows</option>
            {shows.map((show) => (
              <option key={show._id} value={show._id}>{show.title}</option>
            ))}
          </select>
          {(search || selectedShow) && (
            <button
              onClick={() => { setSearch(''); setSelectedShow('') }}
              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="text-white font-semibold mb-2">No bookings found</h3>
            <p className="text-gray-500 text-sm">
              {search || selectedShow ? 'Try adjusting filters.' : 'No bookings have been made yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Attendee</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Show</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Qty</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map((booking) => {
                    const statusInfo = statusConfig[booking.status] || statusConfig.confirmed
                    return (
                      <tr key={booking._id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-white text-sm font-medium">{booking.user?.name}</div>
                            <div className="text-gray-500 text-xs">{booking.user?.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-white text-sm">{booking.show?.title || '—'}</div>
                          {booking.show?.city && (
                            <div className="text-gray-500 text-xs">{booking.show.city}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-sm whitespace-nowrap">
                          {booking.createdAt
                            ? format(new Date(booking.createdAt), 'MMM d, yyyy')
                            : '—'}
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-sm">{booking.quantity || 1}</td>
                        <td className="px-4 py-4">
                          {booking.totalAmount > 0 ? (
                            <span className="text-amber-400 font-medium text-sm">
                              ₹{booking.totalAmount.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-green-400 text-sm">Free</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
