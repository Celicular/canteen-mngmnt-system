import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Skeleton,
  InputAdornment,
  IconButton,
} from '@mui/material'
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { useAuth } from '../context/AuthContext'
import SavedUserCard from '../components/SavedUserCard'

function LoginPage() {
  const { user, loading, savedUser, login, forgetSavedUser } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saveUser, setSaveUser] = useState(true)
  const [showManualForm, setShowManualForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSubmitting(true)

    try {
      await login({
        username: username.trim(),
        password,
        saveUser,
        quickLogin: false,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrorMessage(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickLogin = async () => {
    setErrorMessage('')
    try {
      await login({
        username: savedUser.username,
        saveUser: true,
        quickLogin: true,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setErrorMessage(err.message || 'Quick login failed')
      setShowManualForm(true)
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <Skeleton variant="circular" width={56} height={56} sx={{ borderRadius: '18px' }} />
          <Skeleton variant="text" width="65%" height={34} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="text" width="45%" height={22} sx={{ borderRadius: '8px' }} />
          <Skeleton variant="rectangular" width="100%" height={240} sx={{ borderRadius: '24px', mt: 1.5 }} />
        </Box>
      </Container>
    )
  }

  const hasSavedUser = Boolean(savedUser && savedUser.username)
  const displaySavedCard = hasSavedUser && !showManualForm

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#eef2f6',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 3,
        py: 6,
      }}
    >
      <Container maxWidth="xs" sx={{ maxWidth: '430px !important' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: '18px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.75,
                boxShadow: '0 8px 18px -4px rgba(15, 23, 42, 0.22)',
              }}
            >
              <RestaurantMenuIcon sx={{ fontSize: 26 }} />
            </Box>
            <Typography
              component="h1"
              sx={{
                fontWeight: 700,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                textAlign: 'center',
                fontSize: '1.38rem',
                lineHeight: 1.25,
              }}
            >
              Canteen Management System
            </Typography>
            <Typography sx={{ color: '#64748b', mt: 0.6, textAlign: 'center', fontSize: '0.875rem' }}>
              Sign in to manage food service & operations
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.07), 0 0 1px 1px rgba(15, 23, 42, 0.04)',
              p: { xs: 3.5, sm: 4.5 },
            }}
          >
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: '14px', fontSize: '0.875rem', py: 0.75 }}>
                {errorMessage}
              </Alert>
            )}

            {displaySavedCard ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.78rem', px: 0.5 }}>
                  Saved Account
                </Typography>
                <SavedUserCard
                  savedUser={savedUser}
                  onQuickLogin={handleQuickLogin}
                  onManualLoginClick={() => setShowManualForm(true)}
                  onForget={forgetSavedUser}
                />
              </Box>
            ) : (
              <Box component="form" onSubmit={handleManualSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  required
                  id="username"
                  name="username"
                  label="Username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                />

                <TextField
                  fullWidth
                  required
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: '#94a3b8', p: 0.75 }}
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} />
                          ) : (
                            <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={saveUser}
                        onChange={(e) => setSaveUser(e.target.checked)}
                        sx={{
                          color: '#94a3b8',
                          p: 0.75,
                          '&.Mui-checked': { color: '#0f172a' },
                          borderRadius: '6px',
                        }}
                      />
                    }
                    label={<Typography sx={{ color: '#334155', userSelect: 'none', fontWeight: 500, fontSize: '0.875rem' }}>Save user</Typography>}
                  />

                  {hasSavedUser && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setShowManualForm(false)}
                      sx={{ color: '#475569', textTransform: 'none', fontSize: '0.825rem', p: 0.5 }}
                    >
                      Use saved card
                    </Button>
                  )}
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={submitting}
                  endIcon={submitting ? null : <ArrowForwardIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    mt: 0.5,
                    py: 1.35,
                    borderRadius: '14px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.18)',
                    '&:hover': {
                      backgroundColor: '#1e293b',
                      boxShadow: '0 6px 18px rgba(15, 23, 42, 0.28)',
                    },
                  }}
                >
                  {submitting ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : 'Login'}
                </Button>
              </Box>
            )}
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}

export default LoginPage
