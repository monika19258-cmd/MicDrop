import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../api/axios'
import ShowCard from '../../components/ShowCard'
import LoadingSpinner from '../../components/LoadingSpinner'

const categories = ['', 'comedy', 'music', 'poetry', 'spoken-word', 'open-mic']
const cities = ['', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai']

export default function ShowList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 9

  const city = searchParams.get('city') || ''
  const category = searchParams.get('category') || ''
  const date = searchParams.get('date') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''

  const fetchShows = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (city) params.set('city', city)
      if (category) params.set('category', category)
      if (date) params.set('date', date)
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      params.set('page', page)
      params.set('limit', limit)
      params.set('status', 'published')

      const { data } = await api.get(`/shows?${params.toString()}`)
      setShows(data.shows || [])
      setTotal(data.total || 0)
    } catch {
      setShows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [city, category, date, minPrice, maxPrice, page])

  useEffect(() => {
    fetchShows()
  }, [fetchShows])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    setSearchParams(next)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchParams({})
    setPage(1)
  }

  const hasFilters = city || category || date || minPrice || maxPrice

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Browse Shows</h1>
          <p className="text-gray-400">
            {total > 0 ? `${total} show${total !== 1 ? 's' : ''} found` : 'Find open-mic events near you'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* City */}
            <select
              value={city}
              onChange={(e) => updateFilter('city', e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Cities</option>
              {cities.filter(Boolean).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 capitalize"
            >
              <option value="">All Categories</option>
              {categories.filter(Boolean).map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>

            {/* Date */}
            <input
              type="date"
              value={date}
              onChange={(e) => updateFilter('date', e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />

            {/* Price range */}
            <input
              type="number"
              placeholder="Min price (₹)"
              value={minPrice}
              onChange={(e) => updateFilter('minPrice', e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500"
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Max price (₹)"
                value={maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder-gray-500"
              />
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex-shrink-0 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 transition-colors"
                  title="Clear filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Active filter pills */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-800">
              {city && (
                <span className="inline-flex items-center gap-1.5 bg-violet-600/10 border border-violet-500/20 text-violet-300 text-xs px-2.5 py-1 rounded-full">
                  {city}
                  <button onClick={() => updateFilter('city', '')} className="hover:text-white">×</button>
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1.5 bg-violet-600/10 border border-violet-500/20 text-violet-300 text-xs px-2.5 py-1 rounded-full capitalize">
                  {category}
                  <button onClick={() => updateFilter('category', '')} className="hover:text-white">×</button>
                </span>
              )}
              {date && (
                <span className="inline-flex items-center gap-1.5 bg-violet-600/10 border border-violet-500/20 text-violet-300 text-xs px-2.5 py-1 rounded-full">
                  {date}
                  <button onClick={() => updateFilter('date', '')} className="hover:text-white">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : shows.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-20 h-20 text-gray-700 mx-auto mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">No shows found</h3>
            <p className="text-gray-500 mb-6">
              {hasFilters ? "Try adjusting your filters to find shows." : "No shows are available right now. Check back soon!"}
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shows.map((show) => (
                <ShowCard key={show._id} show={show} />
              ))}
            </div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-400 text-sm px-3">
                  Page {page} of {Math.ceil(total / limit)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
