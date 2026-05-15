import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import ShowCard from '../components/ShowCard'
import LoadingSpinner from '../components/LoadingSpinner'

const categories = ['comedy', 'music', 'poetry', 'spoken-word', 'open-mic']

const categoryIcons = {
  comedy: '😂',
  music: '🎵',
  poetry: '📝',
  'spoken-word': '🎤',
  'open-mic': '🎙️',
}

export default function Home() {
  const [featuredShows, setFeaturedShows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get('/shows?limit=6&status=published')
        setFeaturedShows(data.shows || [])
      } catch {
        setFeaturedShows([])
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-950 pt-20 pb-28">
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-amber-400/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-violet-300 text-sm font-medium">India's #1 Open-Mic Platform</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
            Drop the Mic.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-amber-400">
              Own the Stage.
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover electrifying open-mic shows across India. Book your seat, showcase your talent in comedy, music, poetry, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/shows"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-8 py-4 font-semibold text-lg transition-all duration-200 shadow-lg shadow-violet-900/40 hover:shadow-violet-900/60"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explore Shows
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-xl px-8 py-4 font-semibold text-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a4 4 0 014 4v5a4 4 0 01-8 0V7a4 4 0 014-4zm0 2a2 2 0 00-2 2v5a2 2 0 004 0V7a2 2 0 00-2-2z" />
                <path d="M5 11a1 1 0 012 0 5 5 0 0010 0 1 1 0 012 0 7 7 0 01-6 6.93V20h3a1 1 0 010 2H8a1 1 0 010-2h3v-2.07A7 7 0 015 11z" />
              </svg>
              Perform Tonight
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: '500+', label: 'Shows Hosted' },
              { value: '10K+', label: 'Attendees' },
              { value: '6', label: 'Cities' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-950 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Browse by Category</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <Link
                key={cat}
                to={`/shows?category=${cat}`}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-violet-600/50 text-gray-300 hover:text-white rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 capitalize"
              >
                <span>{categoryIcons[cat]}</span>
                <span>{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Shows */}
      <section className="py-16 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Featured Shows</h2>
              <p className="text-gray-400 text-sm">Handpicked shows happening near you</p>
            </div>
            <Link
              to="/shows"
              className="text-violet-400 hover:text-violet-300 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : featuredShows.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">No shows available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredShows.map((show) => (
                <ShowCard key={show._id} show={show} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">How MicDrop Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Whether you're here to watch or perform, getting started takes just a few steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* For audience */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-600/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-6">For Audience</h3>
              <ol className="space-y-5">
                {[
                  { step: '01', title: 'Browse Shows', desc: 'Find open-mic events near you by city, category, or date.' },
                  { step: '02', title: 'Book Tickets', desc: 'Secure your seat with secure online payment via Razorpay.' },
                  { step: '03', title: 'Attend & Enjoy', desc: 'Get your QR ticket, scan at venue, and enjoy the show!' },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <span className="text-violet-500 font-mono font-bold text-sm flex-shrink-0 mt-0.5">{item.step}</span>
                    <div>
                      <div className="text-white font-medium mb-0.5">{item.title}</div>
                      <div className="text-gray-400 text-sm">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 mt-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Book Tickets Now
              </Link>
            </div>

            {/* For performers */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3a4 4 0 014 4v5a4 4 0 01-8 0V7a4 4 0 014-4zm0 2a2 2 0 00-2 2v5a2 2 0 004 0V7a2 2 0 00-2-2z" />
                  <path d="M5 11a1 1 0 012 0 5 5 0 0010 0 1 1 0 012 0 7 7 0 01-6 6.93V20h3a1 1 0 010 2H8a1 1 0 010-2h3v-2.07A7 7 0 015 11z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-6">For Performers</h3>
              <ol className="space-y-5">
                {[
                  { step: '01', title: 'Create Profile', desc: 'Set up your performer profile with bio, category, and reel.' },
                  { step: '02', title: 'Apply to Shows', desc: 'Browse open shows and submit your application.' },
                  { step: '03', title: 'Hit the Stage', desc: 'Once approved, show up and own the mic.' },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <span className="text-amber-500 font-mono font-bold text-sm flex-shrink-0 mt-0.5">{item.step}</span>
                    <div>
                      <div className="text-white font-medium mb-0.5">{item.title}</div>
                      <div className="text-gray-400 text-sm">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 mt-8 bg-amber-400 hover:bg-amber-500 text-gray-950 rounded-lg px-5 py-2.5 text-sm font-bold transition-colors"
              >
                Apply as Performer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="py-16 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-2 text-center">Available Cities</h2>
          <p className="text-gray-400 text-center mb-10">Find shows in your city</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'].map((city) => (
              <Link
                key={city}
                to={`/shows?city=${city}`}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-violet-600/40 rounded-xl p-4 text-center transition-all duration-200 group"
              >
                <div className="text-2xl mb-2">🏙️</div>
                <div className="text-white text-sm font-medium group-hover:text-violet-400 transition-colors">{city}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-violet-900/40 via-gray-900 to-violet-900/40 border-t border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Drop the Mic?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of performers and audiences making India's open-mic scene unforgettable.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-10 py-4 font-semibold text-lg transition-all duration-200 shadow-lg shadow-violet-900/40"
          >
            Join MicDrop — It's Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  )
}
