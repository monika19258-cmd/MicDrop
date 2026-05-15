import useAuthStore from '../store/authStore'

export const useAuth = () => {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const register = useAuthStore((s) => s.register)
  const verifyEmail = useAuthStore((s) => s.verifyEmail)
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const updateUser = useAuthStore((s) => s.updateUser)

  const isAdmin = user?.role === 'admin'
  const isPerformer = user?.role === 'performer'
  const isAudience = user?.role === 'audience'

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isPerformer,
    isAudience,
    login,
    logout,
    register,
    verifyEmail,
    fetchMe,
    updateUser,
  }
}
