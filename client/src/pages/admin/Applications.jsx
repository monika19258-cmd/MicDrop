import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const statusConfig = {
  pending: { label: 'Pending', class: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  approved: { label: 'Approved', class: 'bg-green-400/10 text-green-400 border-green-400/20' },
  rejected: { label: 'Rejected', class: 'bg-red-400/10 text-red-400 border-red-400/20' },
  paid: { label: 'Paid', class: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
}

export default function Applications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [processingId, setProcessingId] = useState(null)
  const [selectedShow, setSelectedShow] = useState('')
  const [shows, setShows] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, showsRes] = await Promise.all([
          api.get('/admin/applications'),
          api.get('/admin/shows'),
        ])
        setApplications(appsRes.data.applications || [])
        setShows(showsRes.data.shows || [])
      } catch {
        setApplications([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleAction = async (applicationId, action) => {
    setProcessingId(applicationId)
    try {
      await api.put(`/admin/applications/${applicationId}`, { status: action })
      setApplications((prev) =>
        prev.map((app) =>
          app._id === applicationId ? { ...app, status: action } : app
        )
      )
      toast.success(`Application ${action}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setProcessingId(null)
    }
  }

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ]

  const filtered = applications.filter((app) => {
    if (activeFilter !== 'all' && app.status !== activeFilter) return false
    if (selectedShow && app.show?._id !== selectedShow) return false
    return true
  })

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Applications</h1>
          <p className="text-gray-400">Review and manage performer applications.</p>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Status tabs */}
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeFilter === tab.key
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 ${
                    activeFilter === tab.key ? 'bg-violet-700 text-violet-200' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Show filter */}
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
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-white font-semibold mb-2">No applications found</h3>
            <p className="text-gray-500 text-sm">
              {activeFilter !== 'all' ? 'No applications with this status.' : 'Performers haven\'t applied yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => {
              const performer = app.performer || {}
              const show = app.show || {}
              const statusInfo = statusConfig[app.status] || statusConfig.pending
              const isProcessing = processingId === app._id

              return (
                <div key={app._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Performer info */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-violet-400 font-bold text-sm">
                          {performer.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-white font-medium">{performer.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="text-gray-500 text-sm">{performer.email}</div>
                        {performer.category && (
                          <div className="text-gray-600 text-xs capitalize mt-0.5">{performer.category}</div>
                        )}
                        {app.note && (
                          <div className="mt-2 text-gray-400 text-sm italic bg-gray-800/50 rounded-lg px-3 py-2">
                            "{app.note}"
                          </div>
                        )}
                        <div className="mt-2 text-gray-600 text-xs">
                          Show:{' '}
                          <Link to={`/shows/${show._id}`} className="text-violet-400 hover:text-violet-300">
                            {show.title}
                          </Link>
                          {show.date && ` — ${format(new Date(show.date), 'MMM d, yyyy')}`}
                        </div>
                        {performer.reelUrl && (
                          <a
                            href={performer.reelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Watch Reel
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {app.status === 'pending' && (
                      <div className="flex gap-2 sm:flex-col sm:items-end flex-shrink-0">
                        <button
                          onClick={() => handleAction(app._id, 'approved')}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                        >
                          {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(app._id, 'rejected')}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                        >
                          {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          Reject
                        </button>
                      </div>
                    )}

                    {app.status === 'approved' && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleAction(app._id, 'rejected')}
                          disabled={isProcessing}
                          className="text-xs text-gray-400 hover:text-red-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          Revoke
                        </button>
                      </div>
                    )}

                    {app.status === 'rejected' && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleAction(app._id, 'approved')}
                          disabled={isProcessing}
                          className="text-xs text-gray-400 hover:text-green-400 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          Re-approve
                        </button>
                      </div>
                    )}
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
