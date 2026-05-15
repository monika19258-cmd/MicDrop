import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'

const statusConfig = {
  pending: { label: 'Pending', class: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  approved: { label: 'Approved', class: 'bg-green-400/10 text-green-400 border-green-400/20' },
  rejected: { label: 'Rejected', class: 'bg-red-400/10 text-red-400 border-red-400/20' },
  paid: { label: 'Paid', class: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
}

export default function PerformerDashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const { data } = await api.get('/performer/applications')
        setApplications(data.applications || [])
      } catch {
        setApplications([])
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">
            Hey, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-400">Track your show applications and upcoming performances.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applications', value: stats.total, icon: '📋', color: 'violet' },
            { label: 'Pending Review', value: stats.pending, icon: '⏳', color: 'amber' },
            { label: 'Approved', value: stats.approved, icon: '✅', color: 'green' },
            { label: 'Rejected', value: stats.rejected, icon: '❌', color: 'red' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white mb-0.5">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            to="/performer/browse"
            className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-4 hover:bg-violet-600/20 transition-colors group"
          >
            <div className="text-violet-400 font-semibold mb-1 group-hover:text-violet-300">Browse Shows →</div>
            <div className="text-gray-500 text-sm">Find and apply to open-mic shows</div>
          </Link>
          <Link
            to="/performer/my-shows"
            className="bg-green-600/10 border border-green-500/20 rounded-xl p-4 hover:bg-green-600/20 transition-colors group"
          >
            <div className="text-green-400 font-semibold mb-1 group-hover:text-green-300">My Shows →</div>
            <div className="text-gray-500 text-sm">View your upcoming performances</div>
          </Link>
          <Link
            to="/performer/profile"
            className="bg-amber-600/10 border border-amber-500/20 rounded-xl p-4 hover:bg-amber-600/20 transition-colors group"
          >
            <div className="text-amber-400 font-semibold mb-1 group-hover:text-amber-300">Edit Profile →</div>
            <div className="text-gray-500 text-sm">Update your bio and reel</div>
          </Link>
        </div>

        {/* Applications list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">My Applications</h2>
            <Link
              to="/performer/browse"
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Apply to shows
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-white font-medium mb-2">No applications yet</h3>
              <p className="text-gray-500 text-sm mb-6">Start browsing shows and submit your application.</p>
              <Link
                to="/performer/browse"
                className="inline-flex bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Browse Shows
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {applications.map((app) => {
                const status = statusConfig[app.status] || statusConfig.pending
                return (
                  <div key={app._id} className="px-6 py-4 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/shows/${app.show?._id}`}
                          className="text-white font-medium hover:text-violet-400 transition-colors truncate block"
                        >
                          {app.show?.title || 'Show'}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {app.show?.date && (
                            <span className="text-gray-500 text-xs flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {format(new Date(app.show.date), 'MMM d, yyyy')}
                            </span>
                          )}
                          {app.show?.city && (
                            <span className="text-gray-500 text-xs">{app.show.city}</span>
                          )}
                          {app.show?.category && (
                            <span className="text-gray-500 text-xs capitalize">{app.show.category}</span>
                          )}
                        </div>
                        {app.note && (
                          <p className="text-gray-500 text-xs mt-1 italic">"{app.note}"</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${status.class}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
