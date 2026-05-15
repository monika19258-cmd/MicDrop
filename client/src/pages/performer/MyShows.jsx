import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format, isPast } from 'date-fns'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function MyShows() {
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    const fetchMyShows = async () => {
      try {
        const { data } = await api.get('/performer/my-shows')
        setShows(data.shows || [])
      } catch {
        setShows([])
      } finally {
        setLoading(false)
      }
    }
    fetchMyShows()
  }, [])

  const upcoming = shows.filter((s) => !isPast(new Date(s.date)))
  const past = shows.filter((s) => isPast(new Date(s.date)))
  const displayed = activeTab === 'upcoming' ? upcoming : past

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">My Shows</h1>
          <p className="text-gray-400">Your approved performances at a glance.</p>
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
            <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3a4 4 0 014 4v5a4 4 0 01-8 0V7a4 4 0 014-4zm0 2a2 2 0 00-2 2v5a2 2 0 004 0V7a2 2 0 00-2-2z" />
              <path d="M5 11a1 1 0 012 0 5 5 0 0010 0 1 1 0 012 0 7 7 0 01-6 6.93V20h3a1 1 0 010 2H8a1 1 0 010-2h3v-2.07A7 7 0 015 11z" />
            </svg>
            <h3 className="text-white font-semibold mb-2">
              {activeTab === 'upcoming' ? 'No upcoming shows' : 'No past shows'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {activeTab === 'upcoming'
                ? 'Apply to shows to see your approved performances here.'
                : "You haven't performed yet."}
            </p>
            {activeTab === 'upcoming' && (
              <Link
                to="/performer/browse"
                className="inline-flex bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Browse Shows
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((show) => {
              const showDate = new Date(show.date)
              const past = isPast(showDate)

              return (
                <div
                  key={show._id}
                  className={`bg-gray-900 border rounded-xl p-5 transition-colors ${
                    past ? 'border-gray-800 opacity-75' : 'border-gray-800 hover:border-violet-600/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          to={`/shows/${show._id}`}
                          className="text-white font-semibold hover:text-violet-400 transition-colors"
                        >
                          {show.title}
                        </Link>
                        {past && (
                          <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">Completed</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {format(showDate, 'EEEE, MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {show.time || format(showDate, 'h:mm a')}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {show.venue}, {show.city}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-green-400/10 text-green-400 border-green-400/20">
                        Approved
                      </span>
                    </div>
                  </div>

                  {!past && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <div className="bg-violet-900/10 border border-violet-500/20 rounded-lg px-4 py-3">
                        <p className="text-violet-300 text-sm font-medium mb-0.5">You're performing!</p>
                        <p className="text-gray-500 text-xs">
                          Show up at least 30 minutes before the event starts.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
