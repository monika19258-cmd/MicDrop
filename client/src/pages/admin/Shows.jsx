import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const statusConfig = {
  draft: { label: 'Draft', class: 'bg-gray-400/10 text-gray-400 border-gray-400/20' },
  published: { label: 'Published', class: 'bg-green-400/10 text-green-400 border-green-400/20' },
  cancelled: { label: 'Cancelled', class: 'bg-red-400/10 text-red-400 border-red-400/20' },
}

export default function AdminShows() {
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    fetchShows()
  }, [])

  const fetchShows = async () => {
    try {
      const { data } = await api.get('/admin/shows')
      setShows(data.shows || [])
    } catch {
      setShows([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await api.delete(`/admin/shows/${id}`)
      setShows((prev) => prev.filter((s) => s._id !== id))
      toast.success('Show deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete show')
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const handleStatusToggle = async (show) => {
    const newStatus = show.status === 'published' ? 'draft' : 'published'
    try {
      await api.put(`/admin/shows/${show._id}`, { ...show, status: newStatus })
      setShows((prev) =>
        prev.map((s) => (s._id === show._id ? { ...s, status: newStatus } : s))
      )
      toast.success(`Show ${newStatus === 'published' ? 'published' : 'unpublished'}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Shows</h1>
            <p className="text-gray-400">{shows.length} total shows</p>
          </div>
          <Link
            to="/admin/shows/new"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Show
          </Link>
        </div>

        {shows.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-white font-semibold mb-2">No shows yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first open-mic show.</p>
            <Link
              to="/admin/shows/new"
              className="inline-flex bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Create Show
            </Link>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Show</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">City</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Tickets</th>
                    <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {shows.map((show) => {
                    const statusInfo = statusConfig[show.status] || statusConfig.draft
                    const ticketsSold = (show.totalTickets || 0) - (show.ticketsAvailable || 0)

                    return (
                      <tr key={show._id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-white font-medium text-sm">{show.title}</div>
                            <div className="text-gray-500 text-xs capitalize mt-0.5">{show.category}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-sm whitespace-nowrap">
                          {show.date ? format(new Date(show.date), 'MMM d, yyyy') : '—'}
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-sm">{show.city}</td>
                        <td className="px-4 py-4 text-sm">
                          <span className="text-white">{ticketsSold}</span>
                          <span className="text-gray-600"> / {show.totalTickets || 0}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusInfo.class}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStatusToggle(show)}
                              className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md px-2.5 py-1.5 transition-colors"
                            >
                              {show.status === 'published' ? 'Unpublish' : 'Publish'}
                            </button>
                            <Link
                              to={`/admin/shows/${show._id}/edit`}
                              className="text-xs text-violet-400 hover:text-violet-300 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 rounded-md px-2.5 py-1.5 transition-colors"
                            >
                              Edit
                            </Link>
                            {confirmDelete === show._id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleDelete(show._id)}
                                  disabled={deletingId === show._id}
                                  className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
                                >
                                  {deletingId === show._id ? '...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="text-xs text-gray-400 hover:text-white rounded-md px-2 py-1.5 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(show._id)}
                                className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md px-2.5 py-1.5 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
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
