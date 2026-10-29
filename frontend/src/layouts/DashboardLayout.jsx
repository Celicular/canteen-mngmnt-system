import { useState } from 'react'
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom'
import {
  Box,
  IconButton,
  Typography,
  Button,
  Tooltip,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LogoutIcon from '@mui/icons-material/Logout'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import FastfoodOutlinedIcon from '@mui/icons-material/FastfoodOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import AvatarBadge from '../components/AvatarBadge'
import UserTypeChip from '../components/UserTypeChip'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { label: 'Overview', path: '/dashboard', Icon: DashboardOutlinedIcon },
  { label: 'Sales & Billing', path: '/sales', Icon: ReceiptLongOutlinedIcon },
  { label: 'Stock & Expenses', path: '/stock', Icon: Inventory2OutlinedIcon },
  { label: 'Reports', path: '/reports', Icon: AssessmentOutlinedIcon },
  { label: 'Menu Items', path: '/items', Icon: FastfoodOutlinedIcon, roles: ['admin', 'owner'] },
  { label: 'User Management', path: '/users', Icon: PeopleAltOutlinedIcon, roles: ['admin', 'owner'] },
]

function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const userRole = (user?.user_type || user?.role || '').toLowerCase()
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(userRole))

  const getPageTitle = () => {
    if (location.pathname === '/sales') return 'Sales & Billing'
    if (location.pathname === '/stock') return 'Stock & Expenditures'
    if (location.pathname === '/reports') return 'Reports & Analytics'
    if (location.pathname === '/items') return 'Menu Items'
    if (location.pathname === '/users') return 'User Management'
    return 'Dashboard'
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#eef2f6' }}>
      <Box
        component="aside"
        sx={{
          width: collapsed ? 76 : 260,
          transition: 'width 0.2s ease',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid #1e293b',
          flexShrink: 0,
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              minHeight: 44,
            }}
          >
            {!collapsed && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f8fafc',
                  }}
                >
                  <RestaurantIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    color: '#ffffff',
                    fontSize: '1rem',
                  }}
                >
                  Canteen System
                </Typography>
              </Box>
            )}

            {collapsed && (
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  backgroundColor: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f8fafc',
                  mb: 0.5,
                }}
              >
                <RestaurantIcon sx={{ fontSize: 22 }} />
              </Box>
            )}

            <IconButton
              size="small"
              onClick={() => setCollapsed(!collapsed)}
              sx={{
                color: '#94a3b8',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                '&:hover': {
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                },
              }}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.Icon

              if (collapsed) {
                return (
                  <Tooltip key={item.path} title={item.label} placement="right">
                    <IconButton
                      component={Link}
                      to={item.path}
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                        color: isActive ? '#ffffff' : '#94a3b8',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                        },
                      }}
                    >
                      <Icon sx={{ fontSize: 22 }} />
                    </IconButton>
                  </Tooltip>
                )
              }

              return (
                <Box
                  key={item.path}
                  component={Link}
                  to={item.path}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.75,
                    py: 1.2,
                    borderRadius: '12px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.9rem',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.07)',
                      color: '#ffffff',
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 20 }} />
                  <Typography sx={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}>
                    {item.label}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        </Box>

        <Box sx={{ p: 1.75, borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {!collapsed && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.25,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              }}
            >
              <AvatarBadge avatarId={user?.avatar || 'executive'} size={38} />
              <Box sx={{ overflow: 'hidden', flex: 1 }}>
                <Typography sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem', lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.full_name || 'Admin User'}
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                  @{user?.username || 'admin'}
                </Typography>
              </Box>
            </Box>
          )}

          {collapsed ? (
            <Tooltip title="Logout" placement="right">
              <IconButton
                onClick={handleLogout}
                sx={{
                  width: '100%',
                  height: 46,
                  borderRadius: '12px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#b91c1c',
                  },
                }}
              >
                <LogoutIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              fullWidth
              variant="contained"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                py: 1.2,
                borderRadius: '12px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.925rem',
                textTransform: 'none',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#b91c1c',
                  boxShadow: 'none',
                },
              }}
            >
              Logout
            </Button>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          component="header"
          sx={{
            height: 68,
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3.5,
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '1.15rem' }}>
            {getPageTitle()}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.2, fontSize: '0.925rem' }}>
                  {user?.full_name || 'Admin User'}
                </Typography>
                <UserTypeChip type={user?.user_type || user?.role} />
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                @{user?.username || 'admin'}
              </Typography>
            </Box>

            <Tooltip title={`${user?.full_name || 'Admin User'} (@${user?.username || 'admin'})`}>
              <Box>
                <AvatarBadge avatarId={user?.avatar || 'executive'} size={42} />
              </Box>
            </Tooltip>
          </Box>
        </Box>

        <Box
          component="main"
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3.5,
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: '#eef2f6' },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
          }}
        >
          {children || <Outlet />}
        </Box>
      </Box>
    </Box>
  )
}

export default DashboardLayout
