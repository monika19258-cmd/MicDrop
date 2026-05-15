import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-violet-400 font-semibold">
          ₹{payload[0]?.value?.toLocaleString('en-IN')}
        </p>
        {payload[1] && (
          <p className="text-amber-400">
            {payload[1]?.value} tickets
          </p>
        )}
      </div>
    )
  }
  return null
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/admin/analytics')
        setAnalytics(data)
      } catch {
        setAnalytics(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) return <LoadingSpinner fullScreen />

  const stats = analytics?.summary || {
    totalRevenue: 0,
    totalTicketsSold: 0,
    totalShows: 0,
    pendingApplications: 0,
    totalUsers: 0,
    totalBookings: 0,
  }

  const monthlyData = analytics?.monthly || []

  const quickLinks = [
    { to: '/admin/shows/new', label: 'Create Show', icon: '➕', color: 'violet' },
    { to: '/admin/applications', label: 'Review Applications', icon: '📋', color: 'amber', badge: stats.pendingApplications },
    { to: '/admin/bookings', label: 'View Bookings', icon: '🎟️', color: 'blue' },
    { to: '/admin/checkin', label: 'Check-In Scanner', icon: '📷', color: 'green' },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Admin Dashboard</h1>
          <p className="text-gray-400">Platform overview and analytics.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[
            {
              label: 'Total Revenue',
              value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`,
              icon: '💰',
              highlight: true,
            },
            { label: 'Tickets Sold', value: stats.totalTicketsSold || 0, icon: '🎟️' },
            { label: 'Total Shows', value: stats.totalShows || 0, icon: '🎭' },
            { label: 'Pending Apps', value: stats.pendingApplications || 0, icon: '⏳', alert: stats.pendingApplications > 0 },
            { label: 'Total Users', value: stats.totalUsers || 0, icon: '👥' },
            { label: 'Total Bookings', value: stats.totalBookings || 0, icon: '📋' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-gray-900 border rounded-xl p-4 ${
                stat.alert ? 'border-amber-500/30' : 'border-gray-800'
              }`}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`text-xl font-bold mb-0.5 ${stat.highlight ? 'text-amber-400' : 'text-white'}`}>
                {stat.value}
              </div>
              <div className="text-gray-500 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="relative bg-gray-900 border border-gray-800 hover:border-violet-600/40 rounded-xl p-4 transition-all group hover:bg-gray-800/50"
            >
              {link.badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-400 text-gray-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {link.badge > 9 ? '9+' : link.badge}
                </span>
              )}
              <div className="text-2xl mb-2">{link.icon}</div>
              <div className="text-white text-sm font-medium group-hover:text-violet-400 transition-colors">
                {link.label}
              </div>
            </Link>
          ))}
        </div>

        {/* Revenue chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Monthly Revenue</h2>
            <span className="text-gray-500 text-sm">Last 12 months</span>
          </div>
          {monthlyData.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 text-sm">No revenue data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tickets" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex items-center gap-6 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-violet-600" />
              <span className="text-gray-400 text-xs">Revenue (₹)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-400" />
              <span className="text-gray-400 text-xs">Tickets Sold</span>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        {analytics?.recentBookings?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Bookings</h2>
              <Link to="/admin/bookings" className="text-sm text-violet-400 hover:text-violet-300">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-800">
              {analytics.recentBookings.slice(0, 5).map((booking) => (
                <div key={booking._id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm font-medium">{booking.user?.name || 'User'}</div>
                    <div className="text-gray-500 text-xs">{booking.show?.title || 'Show'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 text-sm font-medium">
                      {booking.totalAmount > 0
                        ? `₹${booking.totalAmount.toLocaleString('en-IN')}`
                        : 'Free'}
                    </div>
                    <div className="text-gray-600 text-xs capitalize">{booking.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
