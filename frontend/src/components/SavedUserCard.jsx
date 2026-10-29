import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  CardActionArea,
  Typography,
  Box,
  Button,
  CircularProgress,
} from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AvatarBadge from './AvatarBadge'
import UserTypeChip from './UserTypeChip'

function SavedUserCard({ savedUser, onQuickLogin, onManualLoginClick, onForget }) {
  const [submitting, setSubmitting] = useState(false)

  const handleCardClick = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await onQuickLogin()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      <Card
        elevation={0}
        sx={{
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: '#cbd5e1',
            backgroundColor: '#ffffff',
            boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
          },
        }}
      >
        <CardActionArea
          onClick={handleCardClick}
          disabled={submitting}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
            <AvatarBadge avatarId={savedUser.avatar || 'executive'} size={44} />
            <Box sx={{ textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                <Typography sx={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.25, fontSize: '0.95rem' }}>
                  {savedUser.full_name || savedUser.username}
                </Typography>
                {savedUser.user_type && <UserTypeChip type={savedUser.user_type} />}
              </Box>
              <Typography sx={{ color: '#64748b', fontSize: '0.825rem' }}>
                @{savedUser.username} &bull; Click to log in
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', color: '#0f172a', pr: 0.5 }}>
            {submitting ? (
              <CircularProgress size={20} sx={{ color: '#0f172a' }} />
            ) : (
              <ArrowForwardIcon sx={{ fontSize: 20 }} />
            )}
          </Box>
        </CardActionArea>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
        <Button
          variant="text"
          size="small"
          onClick={onManualLoginClick}
          disabled={submitting}
          sx={{
            color: '#334155',
            textTransform: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
            p: 0.5,
            '&:hover': { backgroundColor: '#f1f5f9' },
          }}
        >
          Login manually with password
        </Button>

        <Button
          variant="text"
          size="small"
          onClick={onForget}
          disabled={submitting}
          sx={{
            color: '#94a3b8',
            textTransform: 'none',
            fontSize: '0.8rem',
            p: 0.5,
            '&:hover': { color: '#ef4444', backgroundColor: 'transparent' },
          }}
        >
          Forget
        </Button>
      </Box>
    </motion.div>
  )
}

export default SavedUserCard
