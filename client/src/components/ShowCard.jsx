import { Link } from 'react-router-dom'
import { format } from 'date-fns'

const categoryColors = {
  comedy: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  music: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  poetry: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
  'spoken-word': 'bg-green-400/10 text-green-400 border-green-400/20',
  'open-mic': 'bg-violet-400/10 text-violet-400 border-violet-400/20',
}

export default function ShowCard({ show }) {
  const categoryClass = categoryColors[show.category] || 'bg-gray-400/10 text-gray-400 border-gray-400/20'
  const isSoldOut = show.ticketsAvailable === 0
  const isUpcoming = new Date(show.date) > new Date()

  return (
    <Link
      to={`/shows/${show._id}`}
      className="group block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-violet-600/50 hover:shadow-lg hover:shadow-violet-900/20 transition-all duration-200"
    >
      {/* Image / Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        {show.imageUrl ? (
          <img
            src={show.imageUrl}
            alt={show.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3a4 4 0 014 4v5a4 4 0 01-8 0V7a4 4 0 014-4zm0 2a2 2 0 00-2 2v5a2 2 0 004 0V7a2 2 0 00-2-2z" />
              <path d="M5 11a1 1 0 012 0 5 5 0 0010 0 1 1 0 012 0 7 7 0 01-6 6.93V20h3a1 1 0 010 2H8a1 1 0 010-2h3v-2.07A7 7 0 015 11z" />
            </svg>
          </div>
        )}
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${categoryClass} capitalize`}>
            {show.category}
          </span>
        </div>
        {/* Sold out / Status overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-gray-950/60 flex items-center justify-center">
            <span className="bg-red-500 text-white text-sm font-bold px-4 py-1.5 rounded-full">
              Sold Out
            </span>
          </div>
        )}
        {!isUpcoming && !isSoldOut && (
          <div className="absolute top-3 right-3">
            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">Past</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-base mb-1 group-hover:text-violet-400 transition-colors line-clamp-1">
          {show.title}
        </h3>

        <div className="flex items-center gap-1.5 text-gray-400 text-sm mb-3">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{show.venue}, {show.city}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{format(new Date(show.date), 'MMM d, yyyy')}</span>
          </div>
          <div className="text-right">
            {show.ticketPrice === 0 ? (
              <span className="text-green-400 font-semibold text-sm">Free</span>
            ) : (
              <span className="text-amber-400 font-semibold text-sm">
                ₹{show.ticketPrice?.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Seats available */}
        {isUpcoming && !isSoldOut && show.ticketsAvailable != null && (
          <div className="mt-3 pt-3 border-t border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{show.ticketsAvailable} seats left</span>
              {show.ticketsAvailable <= 10 && (
                <span className="text-amber-400 font-medium">Almost full!</span>
              )}
            </div>
            {show.totalTickets > 0 && (
              <div className="mt-1.5 w-full bg-gray-800 rounded-full h-1">
                <div
                  className="bg-violet-600 h-1 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((show.totalTickets - show.ticketsAvailable) / show.totalTickets) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
