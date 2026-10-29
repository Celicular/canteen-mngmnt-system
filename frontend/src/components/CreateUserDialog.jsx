import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import AvatarBadge, { PROFESSIONAL_AVATARS } from './AvatarBadge'
import UserTypeChip from './UserTypeChip'
import { createUserApi } from '../api/users'

const USER_TYPES = [
  { id: 'worker', label: 'Worker', desc: 'Counter & kitchen' },
  { id: 'owner', label: 'Owner', desc: 'Store proprietor' },
  { id: 'admin', label: 'Admin', desc: 'Full system access' },
]

function CreateUserDialog({ open, onClose, onUserCreated }) {
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState('worker')
  const [avatar, setAvatar] = useState('executive')

  const [errors, setErrors] = useState({})
  const [backendError, setBackendError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    const trimmedName = fullName.trim()
    const trimmedUsername = username.trim().toLowerCase()

    if (!trimmedName) {
      newErrors.fullName = 'Full name is required'
    } else if (trimmedName.length < 2 || trimmedName.length > 50) {
      newErrors.fullName = 'Full name must be between 2 and 50 characters'
    } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName)) {
      newErrors.fullName = 'Letters, spaces, and hyphens only'
    }

    if (!trimmedUsername) {
      newErrors.username = 'Username is required'
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmedUsername)) {
      newErrors.username = '3-20 characters: letters, numbers, and underscores only'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBackendError('')

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const created = await createUserApi({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        password,
        user_type: userType,
        avatar,
      })

      handleClose()
      if (onUserCreated) {
        onUserCreated(created)
      }
    } catch (err) {
      setBackendError(err.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setFullName('')
    setUsername('')
    setPassword('')
    setShowPassword(false)
    setUserType('worker')
    setAvatar('executive')
    setErrors({})
    setBackendError('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          p: { xs: 2, sm: 2.5 },
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.2)',
          maxWidth: '820px !important',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1.5,
          pt: 1,
          px: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.25rem' }}>
            Create New User
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.825rem', mt: 0.25 }}>
            Assign account credentials, operational role, and professional avatar
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={submitting} size="small" sx={{ color: '#94a3b8' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 2, py: 1.5 }}>
          {backendError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.85rem' }}>
              {backendError}
            </Alert>
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' },
              gap: 3,
              alignItems: 'start',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                Account Information
              </Typography>

              <TextField
                fullWidth
                required
                id="new-fullName"
                label="Full Name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (errors.fullName) setErrors({ ...errors, fullName: null })
                }}
                error={Boolean(errors.fullName)}
                helperText={errors.fullName}
                disabled={submitting}
              />

              <TextField
                fullWidth
                required
                id="new-username"
                label="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase())
                  if (errors.username) setErrors({ ...errors, username: null })
                }}
                error={Boolean(errors.username)}
                helperText={errors.username || '3-20 characters (letters, numbers, underscore)'}
                disabled={submitting}
              />

              <TextField
                fullWidth
                required
                id="new-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors({ ...errors, password: null })
                }}
                error={Boolean(errors.password)}
                helperText={errors.password || 'Minimum 6 characters'}
                disabled={submitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#94a3b8' }}
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

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
                <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                  Role (User Type)
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  {USER_TYPES.map((t) => {
                    const isSelected = userType === t.id
                    return (
                      <Box
                        key={t.id}
                        onClick={() => !submitting && setUserType(t.id)}
                        sx={{
                          p: 1.25,
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0f172a' : '1.5px solid #e2e8f0',
                          backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'center',
                          '&:hover': {
                            borderColor: isSelected ? '#0f172a' : '#cbd5e1',
                            backgroundColor: '#ffffff',
                          },
                        }}
                      >
                        <UserTypeChip type={t.id} />
                        <Typography sx={{ color: '#64748b', fontSize: '0.72rem', mt: 0.75, lineHeight: 1.2 }}>
                          {t.desc}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                Profile Preview & Avatar
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: '16px',
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                }}
              >
                <AvatarBadge avatarId={avatar} size={56} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {fullName.trim() || 'User Full Name'}
                    </Typography>
                    <UserTypeChip type={userType} />
                  </Box>
                  <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                    @{username.trim().toLowerCase() || 'username'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Choose an Avatar
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 1.25,
                    p: 1.5,
                    borderRadius: '16px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {PROFESSIONAL_AVATARS.map((av) => {
                    const isSelected = avatar === av.id
                    return (
                      <Box
                        key={av.id}
                        onClick={() => !submitting && setAvatar(av.id)}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.5,
                          p: 1,
                          borderRadius: '14px',
                          cursor: submitting ? 'not-allowed' : 'pointer',
                          border: isSelected ? '2px solid #0f172a' : '2px solid transparent',
                          backgroundColor: isSelected ? '#ffffff' : 'transparent',
                          boxShadow: isSelected ? '0 4px 12px rgba(15, 23, 42, 0.08)' : 'none',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                          '&:hover': {
                            backgroundColor: '#ffffff',
                          },
                        }}
                      >
                        <AvatarBadge avatarId={av.id} size={46} />
                        <Typography sx={{ fontSize: '0.725rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#0f172a' : '#64748b' }}>
                          {av.label}
                        </Typography>
                        {isSelected && (
                          <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                            <CheckCircleRoundedIcon sx={{ fontSize: 14, color: '#0f172a' }} />
                          </Box>
                        )}
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2, pt: 1, pb: 1, gap: 1 }}>
          <Button
            onClick={handleClose}
            disabled={submitting}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              color: '#475569',
              borderColor: '#cbd5e1',
              px: 2.5,
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            variant="contained"
            sx={{
              borderRadius: '12px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              px: 3.5,
              py: 1.1,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.18)',
              '&:hover': { backgroundColor: '#1e293b' },
            }}
          >
            {submitting ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default CreateUserDialog
