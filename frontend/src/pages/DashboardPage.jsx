import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Card,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import FastfoodOutlinedIcon from '@mui/icons-material/FastfoodOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import AvatarBadge from '../components/AvatarBadge'
import UserTypeChip from '../components/UserTypeChip'
import CreateSaleDialog from '../components/CreateSaleDialog'
import { fetchOverviewStatsApi } from '../api/sales'
import { useAuth } from '../context/AuthContext'

const MEAL_COLORS = {
  Breakfast: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  Lunch: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  Snack: { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' },
  Dinner: { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
}

function formatTime(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return isoString
  }
}

function DashboardPage() {
  const { user } = useAuth()
  const userRole = (user?.user_type || user?.role || '').toLowerCase()
  const canManageItems = userRole === 'admin' || userRole === 'owner'

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await fetchOverviewStatsApi()
      setStats(data)
    } catch (err) {
      setError(err.message || 'Failed to load dashboard overview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleSaleSaved = (newSale) => {
    setToastMsg(`Sale ${newSale.receipt_no} added successfully!`)
    loadStats()
  }

  const todayRevenue = Number(stats?.today?.revenue || 0)
  const todayOrders = Number(stats?.today?.orders || 0)
  const monthRevenue = Number(stats?.month?.revenue || 0)
  const monthOrders = Number(stats?.month?.orders || 0)
  const monthLabel = stats?.month?.month_label || 'This Month'

  const avgOrderToday = todayOrders > 0 ? (todayRevenue / todayOrders).toFixed(2) : '0.00'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.5, md: 3.5 } }}>
      <Card
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          borderRadius: { xs: '16px', sm: '22px' },
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AvatarBadge avatarId={user?.avatar || 'executive'} size={52} />
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.15rem', sm: '1.3rem' } }}>
                Welcome, {user?.full_name || 'Staff User'}!
              </Typography>
              <UserTypeChip type={user?.user_type || user?.role} />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
              Logged in as <strong style={{ color: '#0f172a' }}>@{user?.username || 'user'}</strong> &bull; Canteen Counter System
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
          <Tooltip title="Refresh overview metrics">
            <IconButton
              onClick={loadStats}
              disabled={loading}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                p: 1.1,
                color: '#475569',
                '&:hover': { backgroundColor: '#f8fafc' },
              }}
            >
              <RefreshOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            onClick={() => setDialogOpen(true)}
            startIcon={<AddOutlinedIcon />}
            sx={{
              borderRadius: '12px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.875rem',
              px: { xs: 2, sm: 2.75 },
              py: 1,
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
              '&:hover': {
                backgroundColor: '#1e293b',
              },
            }}
          >
            Add Sale
          </Button>

          <Button
            component={Link}
            to="/sales"
            variant="outlined"
            startIcon={<ReceiptLongOutlinedIcon />}
            sx={{
              borderRadius: '12px',
              borderColor: '#cbd5e1',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.85rem',
              px: 2,
              py: 0.95,
              '&:hover': {
                borderColor: '#94a3b8',
                backgroundColor: '#f8fafc',
              },
            }}
          >
            Sales Ledger
          </Button>

          <Button
            component={Link}
            to="/reports"
            variant="outlined"
            startIcon={<AssessmentOutlinedIcon />}
            sx={{
              borderRadius: '12px',
              borderColor: '#cbd5e1',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.85rem',
              px: 2,
              py: 0.95,
              '&:hover': {
                borderColor: '#94a3b8',
                backgroundColor: '#f8fafc',
              },
            }}
          >
            Reports
          </Button>

          {canManageItems && (
            <Button
              component={Link}
              to="/items"
              variant="outlined"
              startIcon={<FastfoodOutlinedIcon />}
              sx={{
                borderRadius: '12px',
                borderColor: '#cbd5e1',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '0.85rem',
                px: 2,
                py: 0.95,
                '&:hover': {
                  borderColor: '#94a3b8',
                  backgroundColor: '#f8fafc',
                },
              }}
            >
              Menu Items
            </Button>
          )}
        </Box>
      </Card>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: '14px', fontSize: '0.875rem' }}>
          {error}
        </Alert>
      )}

      {toastMsg && (
        <Alert severity="success" onClose={() => setToastMsg('')} sx={{ borderRadius: '14px', fontSize: '0.875rem' }}>
          {toastMsg}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.2fr 1.2fr 1fr 1fr' },
          gap: 2.5,
        }}
      >
        <Card
          elevation={0}
          sx={{
            p: 2.75,
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Today's Sales
            </Typography>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CurrencyRupeeIcon sx={{ fontSize: 22 }} />
            </Box>
          </Box>
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            ₹{todayRevenue.toFixed(2)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
              <strong>{todayOrders}</strong> orders today &bull; Avg ₹{avgOrderToday}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', pt: 0.5 }}>
            {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map((type) => {
              const count = stats?.today?.meals?.[type] || 0
              const s = MEAL_COLORS[type]
              return (
                <Box
                  key={type}
                  sx={{
                    px: 1.2,
                    py: 0.25,
                    borderRadius: '8px',
                    backgroundColor: s.bg,
                    color: s.color,
                    border: `1px solid ${s.border}`,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {type}: {count}
                </Box>
              )
            })}
          </Box>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2.75,
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Monthly Sales ({monthLabel})
            </Typography>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CalendarMonthOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
          </Box>
          <Typography sx={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            ₹{monthRevenue.toFixed(2)}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
            Month-to-date orders: <strong>{monthOrders}</strong>
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Audited financial turnover for current calendar month
          </Typography>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2.75,
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Quick Billing
            </Typography>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingBagOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
              Counter Order
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mt: 0.25 }}>
              Open dynamic billing terminal with live search & totals
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            onClick={() => setDialogOpen(true)}
            startIcon={<AddOutlinedIcon />}
            sx={{
              borderRadius: '10px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              py: 0.8,
              fontWeight: 600,
              fontSize: '0.8rem',
              '&:hover': { backgroundColor: '#1e293b' },
            }}
          >
            Create Order
          </Button>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2.75,
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Export Reports
            </Typography>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AssessmentOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
              Excel & PDF
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mt: 0.25 }}>
              Custom date range audit statements and downloads
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/reports"
            size="small"
            variant="outlined"
            endIcon={<ArrowForwardOutlinedIcon />}
            sx={{
              borderRadius: '10px',
              borderColor: '#cbd5e1',
              color: '#0f172a',
              py: 0.8,
              fontWeight: 600,
              fontSize: '0.8rem',
              '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' },
            }}
          >
            View Reports
          </Button>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.6fr 1fr' }, gap: 3 }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: '22px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>
                Recent Sales Transactions
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.825rem' }}>
                Latest orders recorded at counter
              </Typography>
            </Box>

            <Button
              component={Link}
              to="/sales"
              size="small"
              endIcon={<ArrowForwardOutlinedIcon />}
              sx={{ fontWeight: 600, fontSize: '0.825rem', color: '#0f172a' }}
            >
              See All
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={30} sx={{ color: '#0f172a' }} />
            </Box>
          ) : !stats?.recent_sales || stats.recent_sales.length === 0 ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
                No recent sales recorded yet.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setDialogOpen(true)}
                startIcon={<AddOutlinedIcon />}
                size="small"
                sx={{
                  mt: 1.5,
                  borderRadius: '10px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 600,
                }}
              >
                Record Sale Now
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" sx={{ minWidth: 540 }}>
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>Receipt #</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>Session</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>Cashier</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recent_sales.map((sale) => {
                    const mealStyle = MEAL_COLORS[sale.meal_type] || MEAL_COLORS.Snack
                    return (
                      <TableRow key={sale.id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                        <TableCell sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.825rem' }}>
                          {sale.receipt_no}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {formatTime(sale.created_at)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.825rem' }}>
                          {sale.customer_name || 'Walk-in'}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.2,
                              py: 0.25,
                              borderRadius: '12px',
                              backgroundColor: mealStyle.bg,
                              color: mealStyle.color,
                              border: `1px solid ${mealStyle.border}`,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {sale.meal_type}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <AvatarBadge avatarId={sale.creator_avatar || 'executive'} size={22} />
                            <Typography sx={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 600 }}>
                              {sale.creator_name || sale.created_by}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>
                          ₹{Number(sale.total_amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2.75,
            borderRadius: '22px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>
                Top Items This Month
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.825rem' }}>
                Highest volume dishes & drinks
              </Typography>
            </Box>
            <RestaurantOutlinedIcon sx={{ color: '#94a3b8' }} />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={30} sx={{ color: '#0f172a' }} />
            </Box>
          ) : !stats?.top_selling_month || stats.top_selling_month.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                No menu items sold yet this month.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {stats.top_selling_month.map((item, idx) => (
                <Box
                  key={item.item_name}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.25,
                    px: 1.75,
                    borderRadius: '14px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                        {item.item_name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {item.total_qty} units served
                      </Typography>
                    </Box>
                  </Box>

                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                    ₹{Number(item.total_sales).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ mt: 'auto', pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setDialogOpen(true)}
              startIcon={<AddOutlinedIcon />}
              sx={{
                borderRadius: '12px',
                borderColor: '#cbd5e1',
                color: '#0f172a',
                py: 1,
                fontWeight: 600,
                fontSize: '0.85rem',
                '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' },
              }}
            >
              Direct Add Sale
            </Button>
          </Box>
        </Card>
      </Box>

      <CreateSaleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaleSaved={handleSaleSaved}
      />
    </Box>
  )
}

export default DashboardPage
