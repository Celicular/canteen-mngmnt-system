import { Box, Typography } from '@mui/material'

const TYPE_STYLES = {
  admin: {
    label: 'Admin',
    bg: '#ede9fe',
    color: '#5b21b6',
    border: '#ddd6fe',
  },
  owner: {
    label: 'Owner',
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0',
  },
  worker: {
    label: 'Worker',
    bg: '#eff6ff',
    color: '#1d4ed8',
    border: '#bfdbfe',
  },
}

function UserTypeChip({ type = 'worker' }) {
  const normalized = (type || 'worker').toLowerCase()
  const config = TYPE_STYLES[normalized] || TYPE_STYLES.worker

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.25,
        py: 0.35,
        borderRadius: '8px',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        userSelect: 'none',
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: '0.725rem',
          fontWeight: 700,
          color: config.color,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}
      >
        {config.label}
      </Typography>
    </Box>
  )
}

export default UserTypeChip
