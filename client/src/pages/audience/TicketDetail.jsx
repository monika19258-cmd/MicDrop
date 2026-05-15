import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qrLoaded, setQrLoaded] = useState(false)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/audience/bookings/${id}`)
        setBooking(data.booking)
      } catch {
        toast.error('Ticket not found')
        navigate('/audience/tickets')
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [id, navigate])

  if (loading) return <LoadingSpinner fullScreen />
  if (!booking) return null

  const show = booking.show || {}
  const showDate = show.date ? new Date(show.date) : null

  const handleDownload = () => {
    // Print window as PDF
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back button */}
        <Link
          to="/audience/tickets"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Tickets
        </Link>

        {/* Ticket card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden print:shadow-none">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-900/50 to-violet-800/30 border-b border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3a4 4 0 014 4v5a4 4 0 01-8 0V7a4 4 0 014-4zm0 2a2 2 0 00-2 2v5a2 2 0 004 0V7a2 2 0 00-2-2z" />
                  <path d="M5 11a1 1 0 012 0 5 5 0 0010 0 1 1 0 012 0 7 7 0 01-6 6.93V20h3a1 1 0 010 2H8a1 1 0 010-2h3v-2.07A7 7 0 015 11z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-bold text-lg">MicDrop</div>
                <div className="text-violet-300 text-xs">Official Ticket</div>
              </div>
            </div>
            <h1 className="text-xl font-bold text-white">{show.title}</h1>
            <p className="text-gray-400 text-sm mt-1 capitalize">{show.category}</p>
          </div>

          {/* Show details */}
          <div className="p-6 space-y-4 border-b border-dashed border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Date',
                  value: showDate ? format(showDate, 'MMM d, yyyy') : '—',
                },
                {
                  label: 'Time',
                  value: show.time || (showDate ? format(showDate, 'h:mm a') : '—'),
                },
                {
                  label: 'Venue',
                  value: show.venue || '—',
                },
                {
                  label: 'City',
                  value: show.city || '—',
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-gray-500 text-xs mb-0.5">{item.label}</div>
                  <div className="text-white text-sm font-medium">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-xs mb-0.5">Tickets</div>
                <div className="text-white font-medium">{booking.quantity || 1}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-xs mb-0.5">Amount Paid</div>
                <div className="text-amber-400 font-bold text-lg">
                  {booking.totalAmount === 0 ? 'Free' : `₹${booking.totalAmount?.toLocaleString('en-IN')}`}
                </div>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="p-6 text-center">
            <div className="mb-4">
              <div className="text-gray-400 text-sm font-medium mb-3">Scan at venue for entry</div>
              {booking.qrCode ? (
                <div className="inline-block bg-white p-3 rounded-xl">
                  <img
                    src={booking.qrCode}
                    alt="Entry QR Code"
                    className="w-48 h-48 object-contain"
                    onLoad={() => setQrLoaded(true)}
                  />
                </div>
              ) : booking.qrToken ? (
                <div className="inline-block bg-white p-3 rounded-xl">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(booking.qrToken)}`}
                    alt="Entry QR Code"
                    className="w-48 h-48"
                    onLoad={() => setQrLoaded(true)}
                  />
                </div>
              ) : (
                <div className="inline-flex w-48 h-48 bg-gray-800 border border-gray-700 rounded-xl items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9V6a2 2 0 012-2h2M3 15v3a2 2 0 002 2h2m10-18h2a2 2 0 012 2v3m0 10v3a2 2 0 01-2 2h-2M9 9h1.5a1 1 0 011 1v1.5M9 15h1.5a1 1 0 001-1v-1.5M14.5 9H16a1 1 0 011 1v1.5M14.5 15H16a1 1 0 001-1v-1.5" />
                    </svg>
                    <p className="text-gray-500 text-xs">QR not available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Booking ID */}
            <div className="bg-gray-800 rounded-lg px-4 py-2 inline-block">
              <div className="text-gray-500 text-xs mb-0.5">Booking ID</div>
              <div className="text-white font-mono text-sm">{booking._id?.slice(-12).toUpperCase()}</div>
            </div>

            {/* Status badge */}
            <div className="mt-4">
              {booking.status === 'confirmed' ? (
                <span className="inline-flex items-center gap-1.5 text-green-400 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confirmed
                </span>
              ) : booking.status === 'used' ? (
                <span className="inline-flex items-center gap-1.5 text-gray-400 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Checked In
                </span>
              ) : (
                <span className="text-amber-400 text-sm capitalize">{booking.status}</span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-800/30 border-t border-gray-800 px-6 py-4">
            <p className="text-gray-600 text-xs text-center">
              Please present this QR code at the venue. Non-transferable ticket.
            </p>
          </div>
        </div>

        {/* Download / Share buttons */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download / Print
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              toast.success('Link copied!')
            }}
            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share Ticket
          </button>
        </div>
      </div>
    </div>
  )
}
