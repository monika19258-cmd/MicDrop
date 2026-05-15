import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import QRScanner from '../../components/QRScanner'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function CheckIn() {
  const [checkedIn, setCheckedIn] = useState([])
  const [shows, setShows] = useState([])
  const [selectedShow, setSelectedShow] = useState('')
  const [showsLoading, setShowsLoading] = useState(true)
  const [manualToken, setManualToken] = useState('')
  const [manualLoading, setManualLoading] = useState(false)

  useEffect(() => {
    const fetchShows = async () => {
      try {
        const { data } = await api.get('/admin/shows?status=published')
        setShows(data.shows || [])
      } catch {
        setShows([])
      } finally {
        setShowsLoading(false)
      }
    }
    fetchShows()
  }, [])

  const handleScanSuccess = (data) => {
    const entry = {
      id: Date.now(),
      attendeeName: data.attendeeName || 'Guest',
      showTitle: data.showTitle || 'Show',
      time: new Date(),
      status: 'success',
    }
    setCheckedIn((prev) => [entry, ...prev])
  }

  const handleManualCheckin = async (e) => {
    e.preventDefault()
    if (!manualToken.trim()) return

    setManualLoading(true)
    try {
      const { data } = await api.post('/admin/checkin', {
        qrToken: manualToken.trim(),
        showId: selectedShow || undefined,
      })
      toast.success(`Checked in: ${data.attendeeName || 'Guest'}`)
      const entry = {
        id: Date.now(),
        attendeeName: data.attendeeName || 'Guest',
        showTitle: data.showTitle || 'Show',
        time: new Date(),
        status: 'success',
      }
      setCheckedIn((prev) => [entry, ...prev])
      setManualToken('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed')
      const entry = {
        id: Date.now(),
        attendeeName: manualToken,
        showTitle: '—',
        time: new Date(),
        status: 'failed',
        error: err.response?.data?.message || 'Invalid token',
      }
      setCheckedIn((prev) => [entry, ...prev])
    } finally {
      setManualLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Check-In Scanner</h1>
          <p className="text-gray-400">Scan attendee QR codes at the venue entrance.</p>
        </div>

        {/* Show selector */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Show (optional)</label>
          <select
            value={selectedShow}
            onChange={(e) => setSelectedShow(e.target.value)}
            disabled={showsLoading}
            className="w-full sm:w-72 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
          >
            <option value="">All Shows</option>
            {shows.map((show) => (
              <option key={show._id} value={show._id}>
                {show.title} — {show.date ? format(new Date(show.date), 'MMM d') : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Scanner */}
          <div className="space-y-4">
            <QRScanner onSuccess={handleScanSuccess} />

            {/* Manual check-in */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-white font-medium text-sm mb-3">Manual Token Entry</h3>
              <form onSubmit={handleManualCheckin} className="flex gap-2">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste or type QR token..."
                  className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={manualLoading || !manualToken.trim()}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                >
                  {manualLoading ? '...' : 'Check In'}
                </button>
              </form>
            </div>
          </div>

          {/* Check-in log */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-semibold">Recent Check-ins</h3>
              {checkedIn.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">
                    {checkedIn.filter((c) => c.status === 'success').length} successful
                  </span>
                  <button
                    onClick={() => setCheckedIn([])}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {checkedIn.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <svg className="w-12 h-12 text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">
                  Scanned check-ins will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
                {checkedIn.map((entry) => (
                  <div
                    key={entry.id}
                    className={`px-5 py-3 flex items-center gap-4 ${
                      entry.status === 'success' ? '' : 'bg-red-900/10'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        entry.status === 'success'
                          ? 'bg-green-400/10 text-green-400'
                          : 'bg-red-400/10 text-red-400'
                      }`}
                    >
                      {entry.status === 'success' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{entry.attendeeName}</div>
                      <div className="text-gray-500 text-xs truncate">
                        {entry.showTitle}
                        {entry.error && ` — ${entry.error}`}
                      </div>
                    </div>
                    <div className="text-gray-600 text-xs flex-shrink-0">
                      {format(entry.time, 'h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
