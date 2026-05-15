import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isPerformer, isAudience, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/')
    setMenuOpen(false)
  }

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-150 ${
      isActive ? 'text-violet-400' : 'text-gray-300 hover:text-white'
    }`

  const getRoleLinks = () => {
    if (isAdmin) {
      return [
        { to: '/admin/dashboard', label: 'Dashboard' },
        { to: '/admin/shows', label: 'Shows' },
        { to: '/admin/applications', label: 'Applications' },
        { to: '/admin/bookings', label: 'Bookings' },
        { to: '/admin/checkin', label: 'Check-In' },
      ]
    }
    if (isPerformer) {
      return [
        { to: '/performer/dashboard', label: 'Dashboard' },
        { to: '/performer/browse', label: 'Browse Shows' },
        { to: '/performer/my-shows', label: 'My Shows' },
        { to: '/performer/profile', label: 'Profile' },
      ]
    }
    if (isAudience) {
      return [
        { to: '/shows', label: 'Browse Shows' },
        { to: '/audience/tickets', label: 'My Tickets' },
      ]
    }
    return []
  }

  const roleLinks = getRoleLinks()

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3a4 4 0 014 4v5a4 4 0 01-8 0V7a4 4 0 014-4zm0 2a2 2 0 00-2 2v5a2 2 0 004 0V7a2 2 0 00-2-2z" />
                <path d="M5 11a1 1 0 012 0 5 5 0 0010 0 1 1 0 012 0 7 7 0 01-6 6.93V20h3a1 1 0 010 2H8a1 1 0 010-2h3v-2.07A7 7 0 015 11z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">MicDrop</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/shows" className={navLinkClass}>Shows</NavLink>
            {roleLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700">
                  <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-300">{user?.name?.split(' ')[0]}</span>
                  <span className="text-xs text-violet-400 capitalize">({user?.role})</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950">
          <div className="px-4 py-4 space-y-1">
            <NavLink
              to="/shows"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-violet-600/20 text-violet-400' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
              }
              onClick={() => setMenuOpen(false)}
            >
              Shows
            </NavLink>
            {roleLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-violet-600/20 text-violet-400' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`
                }
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-gray-800">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-400">
                    Signed in as <span className="text-white font-medium">{user?.name}</span>{' '}
                    <span className="text-violet-400 capitalize">({user?.role})</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-gray-800 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block mt-1 px-3 py-2 rounded-lg text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
