import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined'
import CreateSaleDialog from '../components/CreateSaleDialog'
import AvatarBadge from '../components/AvatarBadge'
import UserTypeChip from '../components/UserTypeChip'
import { fetchSalesApi, fetchSalesSummaryApi, deleteSaleApi } from '../api/sales'
import { useAuth } from '../context/AuthContext'

const MEAL_COLORS = {
  Breakfast: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  Lunch: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  Snack: { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' },
  Dinner: { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
}

function getTodayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatSaleDateTime(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return isoString
  }
}

function formatSaleDate(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return isoString
  }
}

function SalesPage() {
  const { user } = useAuth()
  const userRole = (user?.user_type || user?.role || '').toLowerCase()
  const canDelete = userRole === 'admin' || userRole === 'owner'

  const todayStr = useMemo(() => getTodayString(), [])
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [allDatesMode, setAllDatesMode] = useState(false)

  const [sales, setSales] = useState([])
  const [summary, setSummary] = useState({
    total_revenue: 0,
    total_orders: 0,
    meal_breakdown: { Breakfast: 0, Lunch: 0, Snack: 0, Dinner: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMealFilter, setSelectedMealFilter] = useState('All')
  const [expandedRows, setExpandedRows] = useState({})

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [salesData, summaryData] = await Promise.all([
        fetchSalesApi({ date: allDatesMode ? undefined : selectedDate, allDates: allDatesMode }),
        fetchSalesSummaryApi({ date: allDatesMode ? undefined : selectedDate }),
      ])

      setSales(salesData || [])
      setSummary(
        summaryData || {
          total_revenue: 0,
          total_orders: 0,
          meal_breakdown: { Breakfast: 0, Lunch: 0, Snack: 0, Dinner: 0 },
        }
      )
    } catch (err) {
      setError(err.message || 'Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedDate, allDatesMode])

  const handleCreateClick = () => {
    setEditingSale(null)
    setDialogOpen(true)
  }

  const handleEditClick = (sale) => {
    setEditingSale(sale)
    setDialogOpen(true)
  }

  const handleDelete = async (sale) => {
    if (!canDelete) {
      setError('Only Admin and Owner can delete sales')
      return
    }

    if (!window.confirm(`Delete receipt #${sale.receipt_no} (Total: ₹${Number(sale.total_amount).toFixed(2)})? This cannot be undone.`)) {
      return
    }

    setDeletingId(sale.id)
    setError('')
    setSuccessMsg('')

    try {
      await deleteSaleApi(sale.id)
      setSuccessMsg(`Sale ${sale.receipt_no} deleted successfully`)
      loadData()
    } catch (err) {
      setError(err.message || 'Failed to delete sale')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaleSaved = (savedSale, isEditing) => {
    if (isEditing) {
      setSuccessMsg(`Sale ${savedSale.receipt_no} updated successfully`)
    } else {
      setSuccessMsg(`New sale ${savedSale.receipt_no} recorded`)
    }
    loadData()
  }

  const toggleRowExpand = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredSales = sales.filter((sale) => {
    const matchesMeal = selectedMealFilter === 'All' || sale.meal_type === selectedMealFilter
    const q = searchQuery.toLowerCase().trim()
    if (!q) return matchesMeal

    const matchesReceipt = sale.receipt_no?.toLowerCase().includes(q)
    const matchesCustomer = sale.customer_name?.toLowerCase().includes(q)
    const matchesPhone = sale.customer_phone?.toLowerCase().includes(q)
    const matchesCreator = sale.created_by?.toLowerCase().includes(q) || sale.creator_name?.toLowerCase().includes(q)
    const matchesItems = sale.items?.some((it) => it.item_name?.toLowerCase().includes(q))

    return matchesMeal && (matchesReceipt || matchesCustomer || matchesPhone || matchesCreator || matchesItems)
  })

  const averageOrderValue =
    summary.total_orders > 0 ? (summary.total_revenue / summary.total_orders).toFixed(2) : '0.00'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.45rem' }}>
              Sales & Billing
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 0.35,
                borderRadius: '8px',
                backgroundColor: '#e2e8f0',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              {allDatesMode ? 'All Time' : selectedDate === todayStr ? 'Today (12:00 AM - 11:59 PM)' : selectedDate}
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', mt: 0.5 }}>
            Record counter orders, track real-time revenue, and audit meal sessions
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              p: 0.5,
              gap: 0.5,
            }}
          >
            <Button
              size="small"
              onClick={() => {
                setAllDatesMode(false)
                setSelectedDate(todayStr)
              }}
              sx={{
                borderRadius: '8px',
                px: 1.5,
                py: 0.5,
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: !allDatesMode && selectedDate === todayStr ? '#0f172a' : 'transparent',
                color: !allDatesMode && selectedDate === todayStr ? '#ffffff' : '#64748b',
                '&:hover': {
                  backgroundColor: !allDatesMode && selectedDate === todayStr ? '#0f172a' : '#f1f5f9',
                },
              }}
            >
              Today
            </Button>

            <Button
              size="small"
              onClick={() => setAllDatesMode(true)}
              sx={{
                borderRadius: '8px',
                px: 1.5,
                py: 0.5,
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: allDatesMode ? '#0f172a' : 'transparent',
                color: allDatesMode ? '#ffffff' : '#64748b',
                '&:hover': {
                  backgroundColor: allDatesMode ? '#0f172a' : '#f1f5f9',
                },
              }}
            >
              All Records
            </Button>

            <TextField
              type="date"
              size="small"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setAllDatesMode(false)
                  setSelectedDate(e.target.value)
                }
              }}
              sx={{
                width: 140,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  '& fieldset': { border: 'none' },
                  fontSize: '0.8rem',
                },
                '& input': {
                  padding: '4px 6px',
                  cursor: 'pointer',
                },
              }}
            />
          </Box>

          <Tooltip title="Reload sales">
            <IconButton
              onClick={loadData}
              disabled={loading}
              sx={{
                backgroundColor: '#ffffff',
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
            onClick={handleCreateClick}
            startIcon={<AddOutlinedIcon />}
            sx={{
              borderRadius: '12px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 2.75,
              py: 1.1,
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
              '&:hover': {
                backgroundColor: '#1e293b',
              },
            }}
          >
            Add Sale
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: '14px', fontSize: '0.875rem' }}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" onClose={() => setSuccessMsg('')} sx={{ borderRadius: '14px', fontSize: '0.875rem' }}>
          {successMsg}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2.5,
        }}
      >
        <Card
          elevation={0}
          sx={{
            p: 2.5,
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
              {allDatesMode ? 'Total Sales Value' : "Today's Revenue"}
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
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            ₹{Number(summary.total_revenue || 0).toFixed(2)}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
            From <strong>{summary.total_orders || 0}</strong> recorded orders
          </Typography>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2.5,
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
              Total Orders
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
              <ShoppingBagOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
          </Box>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            {summary.total_orders || 0}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
            Avg. Order Value: <strong>₹{averageOrderValue}</strong>
          </Typography>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2.5,
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
              Day Sessions
            </Typography>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RestaurantOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#b45309' }}>
                {summary.meal_breakdown?.Breakfast || 0}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>B'fast</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d' }}>
                {summary.meal_breakdown?.Lunch || 0}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>Lunch</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#c2410c' }}>
                {summary.meal_breakdown?.Snack || 0}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>Snack</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#4338ca' }}>
                {summary.meal_breakdown?.Dinner || 0}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>Dinner</Typography>
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
            Active across 4 meal shifts
          </Typography>
        </Card>

        <Card
          elevation={0}
          sx={{
            p: 2.5,
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
              Active Cashier
            </Typography>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AvatarBadge avatarId={user?.avatar || 'executive'} size={32} />
            </Box>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', lineHeight: 1.2 }}>
              {user?.full_name || 'Counter Operator'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>@{user?.username || 'user'}</Typography>
              <UserTypeChip type={user?.user_type || user?.role} />
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
            {canDelete ? 'Full control (Add, Edit, Delete)' : 'Standard counter mode (Add & Edit only)'}
          </Typography>
        </Card>
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.05)',
          p: 2.5,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search by receipt #, customer, phone, item, or cashier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', sm: 380 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {['All', 'Breakfast', 'Lunch', 'Snack', 'Dinner'].map((type) => {
            const isSelected = selectedMealFilter === type
            return (
              <Box
                key={type}
                onClick={() => setSelectedMealFilter(type)}
                sx={{
                  px: 2,
                  py: 0.7,
                  borderRadius: '20px',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#0f172a' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: isSelected ? '#0f172a' : '#ffffff',
                    borderColor: isSelected ? '#0f172a' : '#cbd5e1',
                  },
                }}
              >
                {type}
              </Box>
            )
          })}
        </Box>
      </Card>

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
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
            <CircularProgress size={36} sx={{ color: '#0f172a' }} />
            <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Loading sales records...</Typography>
          </Box>
        ) : filteredSales.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, px: 2, textAlign: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '16px',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
              }}
            >
              <ReceiptLongOutlinedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              No sales records found
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 420 }}>
              {searchQuery || selectedMealFilter !== 'All'
                ? 'No orders match your filter criteria. Try resetting filters or changing the search query.'
                : 'No counter sales have been entered for this date range yet. Click below to add the first order.'}
            </Typography>
            <Button
              variant="contained"
              onClick={handleCreateClick}
              startIcon={<AddOutlinedIcon />}
              sx={{
                mt: 1,
                borderRadius: '12px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                px: 3,
                py: 1,
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
                '&:hover': { backgroundColor: '#1e293b' },
              }}
            >
              Add First Sale
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                <TableRow>
                  <TableCell sx={{ width: 48, p: 1 }} />
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Receipt #</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Time & Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Session</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Items Summary</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Billed By</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>
                    Total (₹)
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem', width: 110 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSales.map((sale) => {
                  const isExpanded = Boolean(expandedRows[sale.id])
                  const mealStyle = MEAL_COLORS[sale.meal_type] || MEAL_COLORS.Snack
                  const itemCount = sale.items?.reduce((sum, it) => sum + it.quantity, 0) || 0

                  return (
                    <Box component="tbody" key={sale.id} sx={{ display: 'contents' }}>
                      <TableRow
                        sx={{
                          '&:hover': { backgroundColor: '#f8fafc' },
                          borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <TableCell sx={{ p: 1 }}>
                          <IconButton size="small" onClick={() => toggleRowExpand(sale.id)} sx={{ color: '#64748b' }}>
                            {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                            {sale.receipt_no}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                            {formatSaleDateTime(sale.created_at)}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {formatSaleDate(sale.created_at)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                            {sale.customer_name || 'Walk-in'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25, flexWrap: 'wrap' }}>
                            {sale.ward_number && (
                              <Box
                                sx={{
                                  px: 1,
                                  py: 0.15,
                                  borderRadius: '6px',
                                  backgroundColor: '#eff6ff',
                                  color: '#2563eb',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  border: '1px solid #bfdbfe',
                                }}
                              >
                                {sale.ward_number}
                              </Box>
                            )}
                            {sale.customer_phone ? (
                              <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {sale.customer_phone}
                              </Typography>
                            ) : (
                              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                Counter
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.5,
                              py: 0.4,
                              borderRadius: '20px',
                              backgroundColor: mealStyle.bg,
                              color: mealStyle.color,
                              border: `1px solid ${mealStyle.border}`,
                              fontSize: '0.78rem',
                              fontWeight: 700,
                            }}
                          >
                            {sale.meal_type}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                              {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {sale.items?.map((it) => `${it.quantity}x ${it.item_name}`).join(', ')}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AvatarBadge avatarId={sale.creator_avatar || 'executive'} size={28} />
                            <Box sx={{ overflow: 'hidden' }}>
                              <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem', lineHeight: 1.2 }}>
                                {sale.creator_name || sale.created_by}
                              </Typography>
                              <Typography sx={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'capitalize' }}>
                                {sale.creator_role || 'Staff'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.975rem' }}>
                            ₹{Number(sale.total_amount).toFixed(2)}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <Tooltip title="Edit Sale">
                              <IconButton
                                size="small"
                                onClick={() => handleEditClick(sale)}
                                sx={{
                                  color: '#0284c7',
                                  backgroundColor: '#f0f9ff',
                                  '&:hover': { backgroundColor: '#e0f2fe' },
                                }}
                              >
                                <EditOutlinedIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>

                            {canDelete ? (
                              <Tooltip title="Delete Sale (Admin / Owner)">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(sale)}
                                  disabled={deletingId === sale.id}
                                  sx={{
                                    color: '#ef4444',
                                    backgroundColor: '#fef2f2',
                                    '&:hover': { backgroundColor: '#fee2e2' },
                                  }}
                                >
                                  {deletingId === sale.id ? (
                                    <CircularProgress size={16} sx={{ color: '#ef4444' }} />
                                  ) : (
                                    <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                                  )}
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Deletion restricted to Owner / Admin">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled
                                    sx={{
                                      color: '#cbd5e1',
                                      backgroundColor: '#f8fafc',
                                    }}
                                  >
                                    <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ backgroundColor: '#fbfcfd' }}>
                        <TableCell colSpan={9} sx={{ p: 0, borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2.5, px: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                                Ordered Items Breakdown
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                {sale.items?.map((it) => (
                                  <Box
                                    key={it.id}
                                    sx={{
                                      p: 1.25,
                                      px: 2,
                                      borderRadius: '12px',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #e2e8f0',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                      minWidth: 200,
                                    }}
                                  >
                                    <Box>
                                      <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                                        {it.item_name}
                                      </Typography>
                                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        ₹{Number(it.unit_price).toFixed(2)} &times; {it.quantity}
                                      </Typography>
                                    </Box>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', ml: 'auto' }}>
                                      ₹{Number(it.subtotal).toFixed(2)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                              {sale.updated_at && (
                                <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', mt: 0.5 }}>
                                  Last updated: {formatSaleDate(sale.updated_at)} at {formatSaleDateTime(sale.updated_at)}
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Box>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <CreateSaleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaleSaved={handleSaleSaved}
        initialSale={editingSale}
      />
    </Box>
  )
}

export default SalesPage
