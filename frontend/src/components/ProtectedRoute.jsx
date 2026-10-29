import { Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2f6' }}>
        <CircularProgress size={32} sx={{ color: '#0f172a' }} />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.user_type || user.role || '').toLowerCase()
    const isAllowed = allowedRoles.map((r) => r.toLowerCase()).includes(userRole)
    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}

export default ProtectedRoute
