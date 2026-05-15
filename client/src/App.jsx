import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

import Home from './pages/Home'
import ShowList from './pages/shows/ShowList'
import ShowDetail from './pages/shows/ShowDetail'
import Register from './pages/auth/Register'
import Login from './pages/auth/Login'
import VerifyEmail from './pages/auth/VerifyEmail'

import PerformerDashboard from './pages/performer/Dashboard'
import PerformerProfile from './pages/performer/Profile'
import BrowseShows from './pages/performer/BrowseShows'
import MyShows from './pages/performer/MyShows'

import MyTickets from './pages/audience/MyTickets'
import TicketDetail from './pages/audience/TicketDetail'

import AdminDashboard from './pages/admin/Dashboard'
import AdminShows from './pages/admin/Shows'
import ShowForm from './pages/admin/ShowForm'
import Applications from './pages/admin/Applications'
import Bookings from './pages/admin/Bookings'
import CheckIn from './pages/admin/CheckIn'

function AppContent() {
  const { fetchMe, isLoading } = useAuth()

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shows" element={<ShowList />} />
          <Route path="/shows/:id" element={<ShowDetail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Performer routes */}
          <Route
            path="/performer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['performer']}>
                <PerformerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performer/profile"
            element={
              <ProtectedRoute allowedRoles={['performer']}>
                <PerformerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performer/browse"
            element={
              <ProtectedRoute allowedRoles={['performer']}>
                <BrowseShows />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performer/my-shows"
            element={
              <ProtectedRoute allowedRoles={['performer']}>
                <MyShows />
              </ProtectedRoute>
            }
          />

          {/* Audience routes */}
          <Route
            path="/audience/tickets"
            element={
              <ProtectedRoute allowedRoles={['audience']}>
                <MyTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audience/tickets/:id"
            element={
              <ProtectedRoute allowedRoles={['audience']}>
                <TicketDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shows"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminShows />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shows/new"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ShowForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shows/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ShowForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Bookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/checkin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CheckIn />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: { primary: '#7c3aed', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <AppContent />
    </BrowserRouter>
  )
}
