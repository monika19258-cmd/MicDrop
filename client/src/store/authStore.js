import { create } from 'zustand'
import api from '../api/axios'

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  fetchMe: async () => {
    try {
      set({ isLoading: true })
      const { data } = await api.get('/auth/me')
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    set({ user: data.user, isAuthenticated: true })
    return data
  },

  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    return data
  },

  verifyEmail: async (email, otp) => {
    const { data } = await api.post('/auth/verify-email', { email, otp })
    set({ user: data.user, isAuthenticated: true })
    return data
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore errors on logout
    } finally {
      set({ user: null, isAuthenticated: false })
    }
  },

  updateUser: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }))
  },
}))

// Listen for forced logout events from the axios interceptor
window.addEventListener('auth:logout', () => {
  useAuthStore.setState({ user: null, isAuthenticated: false })
})

export default useAuthStore
