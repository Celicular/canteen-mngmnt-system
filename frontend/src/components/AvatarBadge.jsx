import Avatar from 'boring-avatars'
import { Box } from '@mui/material'

export const AVATAR_PALETTE = ['#0f172a', '#2563eb', '#059669', '#d97706', '#7c3aed']

export const PROFESSIONAL_AVATARS = [
  { id: 'executive', label: 'Executive', name: 'Alex Morgan' },
  { id: 'chef', label: 'Chef', name: 'Gordon Chef' },
  { id: 'manager', label: 'Manager', name: 'Elena Vance' },
  { id: 'supervisor', label: 'Supervisor', name: 'Marcus Reed' },
  { id: 'cashier', label: 'Cashier', name: 'Chloe Bennett' },
  { id: 'logistics', label: 'Inventory', name: 'David Kim' },
  { id: 'analyst', label: 'Analyst', name: 'Sophia Taylor' },
  { id: 'operator', label: 'Operator', name: 'Lucas Wright' },
]

export function getAvatarConfig(avatarId) {
  const match = PROFESSIONAL_AVATARS.find((a) => a.id === avatarId)
  return match || PROFESSIONAL_AVATARS[0]
}

function AvatarBadge({ avatarId, size = 40, sx = {} }) {
  const config = getAvatarConfig(avatarId)

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.1)',
        ...sx,
      }}
    >
      <Avatar
        size={size}
        name={config.name}
        variant="beam"
        colors={AVATAR_PALETTE}
      />
    </Box>
  )
}

export default AvatarBadge
