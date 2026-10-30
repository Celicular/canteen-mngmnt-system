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
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import AvatarBadge from '../components/AvatarBadge'
import CreateStockExpenseDialog from '../components/CreateStockExpenseDialog'
import { fetchStockExpensesApi, fetchStockSummaryApi, deleteStockExpenseApi } from '../api/stock'
import { useAuth } from '../context/AuthContext'

const CATEGORY_STYLES = {
  Groceries: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Dairy: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  Vegetables: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  Disposables: { bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' },
  General: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
}

const PRESETS = ['Today', 'Yesterday', 'This Month', 'Last 30 Days', 'All Time']

function toTodayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPresetDates(preset) {
  const now = new Date()
  const toISO = (d) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const today = toISO(now)

  if (preset === 'Today') {
    return { startDate: today, endDate: today, isAllTime: false }
  }
  if (preset === 'Yesterday') {
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    const yStr = toISO(y)
    return { startDate: yStr, endDate: yStr, isAllTime: false }
  }
  if (preset === 'This Month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    return { startDate: toISO(firstDay), endDate: today, isAllTime: false }
  }
  if (preset === 'Last 30 Days') {
    const past = new Date(now)
    past.setDate(past.getDate() - 29)
    return { startDate: toISO(past), endDate: today, isAllTime: false }
  }
  if (preset === 'All Time') {
    return { startDate: '', endDate: '', isAllTime: true }
  }
  return { startDate: today, endDate: today, isAllTime: false }
}

function StockPage() {
  const { user } = useAuth()
  const userRole = (user?.user_type || user?.role || '').toLowerCase()
  const canDelete = userRole === 'admin' || userRole === 'owner'

  const todayStr = useMemo(() => toTodayString(), [])
  const [activePreset, setActivePreset] = useState('This Month')
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [endDate, setEndDate] = useState(todayStr)
  const [allDatesMode, setAllDatesMode] = useState(false)

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState({
    period_expense: 0,
    period_count: 0,
    category_breakdown: {},
    today_sales: 0,
    today_expenses: 0,
    today_net_profit: 0,
    month_sales: 0,
    month_expenses: 0,
    month_net_profit: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadStockData = async () => {
    try {
      setLoading(true)
      setError('')

      const queryParams = {
        startDate: allDatesMode ? undefined : startDate,
        endDate: allDatesMode ? undefined : endDate,
        allDates: allDatesMode,
        category: selectedCategory,
      }

      const [listData, summaryData] = await Promise.all([
        fetchStockExpensesApi(queryParams),
        fetchStockSummaryApi(queryParams),
      ])

      setExpenses(listData || [])
      setSummary(
        summaryData || {
          period_expense: 0,
          period_count: 0,
          category_breakdown: {},
          today_sales: 0,
          today_expenses: 0,
          today_net_profit: 0,
          month_sales: 0,
          month_expenses: 0,
          month_net_profit: 0,
        }
      )
    } catch (err) {
      setError(err.message || 'Failed to load stock expenditures')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStockData()
  }, [startDate, endDate, allDatesMode, selectedCategory])

  const handlePresetClick = (preset) => {
    setActivePreset(preset)
    const { startDate: s, endDate: e, isAllTime } = getPresetDates(preset)
    if (isAllTime) {
      setAllDatesMode(true)
    } else {
      setAllDatesMode(false)
      setStartDate(s)
      setEndDate(e)
    }
  }

  const handleCreateClick = () => {
    setEditingExpense(null)
    setDialogOpen(true)
  }

  const handleEditClick = (exp) => {
    setEditingExpense(exp)
    setDialogOpen(true)
  }

  const handleDelete = async (exp) => {
    if (!canDelete) {
      setError('Only Admin and Owner can delete stock entries')
      return
    }

    if (!window.confirm(`Delete expenditure for "${exp.item_name}" (₹${Number(exp.total_cost).toFixed(2)})?`)) {
      return
    }

    setDeletingId(exp.id)
    setError('')
    setSuccessMsg('')

    try {
      await deleteStockExpenseApi(exp.id)
      setSuccessMsg(`Expenditure for "${exp.item_name}" deleted`)
      loadStockData()
    } catch (err) {
      setError(err.message || 'Failed to delete expenditure')
    } finally {
      setDeletingId(null)
    }
  }

  const handleExpenseSaved = (savedExp, isEditing) => {
    if (isEditing) {
      setSuccessMsg(`"${savedExp.item_name}" expenditure updated`)
    } else {
      setSuccessMsg(`"${savedExp.item_name}" expenditure recorded`)
    }
    loadStockData()
  }

  const filteredExpenses = expenses.filter((exp) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      exp.item_name?.toLowerCase().includes(q) ||
      exp.category?.toLowerCase().includes(q) ||
      exp.notes?.toLowerCase().includes(q) ||
      exp.created_by?.toLowerCase().includes(q)
    )
  })

  const exportExcel = () => {
    try {
      const data = filteredExpenses.map((exp) => ({
        Date: exp.date,
        'Stock Item': exp.item_name,
        Category: exp.category || 'General',
        Quantity: exp.quantity,
        Unit: exp.unit,
        'Rate (INR)': exp.unit_price,
        'Total Cost (INR)': exp.total_cost,
        Notes: exp.notes || '-',
        'Logged By': exp.creator_name ? `${exp.creator_name} (@${exp.created_by})` : exp.created_by,
      }))

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Stock Expenditures')
      XLSX.writeFile(wb, `Canteen_Stock_Expenditures_${allDatesMode ? 'All_Time' : `${startDate}_to_${endDate}`}.xlsx`)
    } catch (err) {
      setError('Failed to export Excel: ' + err.message)
    }
  }

  const exportPDF = () => {
    try {
      const doc = new jsPDF('p', 'pt', 'a4')
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, 595.28, 65, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('CANTEEN MANAGEMENT SYSTEM', 40, 32)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Stock & Raw Material Expenditure Report | ${allDatesMode ? 'All Time' : `${startDate} to ${endDate}`}`, 40, 50)

      const tableData = filteredExpenses.map((e) => [
        e.date,
        e.item_name,
        e.category,
        `${e.quantity} ${e.unit}`,
        `INR ${Number(e.unit_price).toFixed(2)}`,
        `INR ${Number(e.total_cost).toFixed(2)}`,
        e.created_by,
      ])

      autoTable(doc, {
        startY: 85,
        head: [['Date', 'Stock Item', 'Category', 'Quantity', 'Rate', 'Total Cost', 'Cashier']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8.5 },
        margin: { left: 40, right: 40 },
      })

      doc.save(`Canteen_Stock_Report_${allDatesMode ? 'All_Time' : `${startDate}_to_${endDate}`}.pdf`)
    } catch (err) {
      setError('Failed to export PDF: ' + err.message)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.5, md: 3.5 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
              Stock & Expenditures
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
              {allDatesMode ? 'All Time' : `${startDate} to ${endDate}`}
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', mt: 0.5 }}>
            Track raw material purchases, ingredient supplies, and live net profit margins
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
          <Tooltip title="Reload stock data">
            <IconButton
              onClick={loadStockData}
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
            variant="outlined"
            onClick={exportExcel}
            disabled={loading || filteredExpenses.length === 0}
            startIcon={<TableChartOutlinedIcon />}
            sx={{
              borderRadius: '12px',
              borderColor: '#10b981',
              color: '#047857',
              backgroundColor: '#ecfdf5',
              fontWeight: 600,
              fontSize: '0.85rem',
              px: 2,
              py: 0.9,
              '&:hover': {
                backgroundColor: '#d1fae5',
                borderColor: '#059669',
              },
            }}
          >
            Excel (.xlsx)
          </Button>

          <Button
            variant="outlined"
            onClick={exportPDF}
            disabled={loading || filteredExpenses.length === 0}
            startIcon={<PictureAsPdfOutlinedIcon />}
            sx={{
              borderRadius: '12px',
              borderColor: '#cbd5e1',
              color: '#0f172a',
              backgroundColor: '#ffffff',
              fontWeight: 600,
              fontSize: '0.85rem',
              px: 2,
              py: 0.9,
              '&:hover': { backgroundColor: '#f8fafc', borderColor: '#94a3b8' },
            }}
          >
            PDF Report
          </Button>

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
              py: 1,
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
              '&:hover': {
                backgroundColor: '#1e293b',
              },
            }}
          >
            Record Expenditure
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
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.2fr 1.2fr 1.2fr 1fr' },
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
            gap: 1.25,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Today's Net Profit
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                backgroundColor: summary.today_net_profit >= 0 ? '#ecfdf5' : '#fef2f2',
                color: summary.today_net_profit >= 0 ? '#059669' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {summary.today_net_profit >= 0 ? (
                <TrendingUpOutlinedIcon sx={{ fontSize: 20 }} />
              ) : (
                <TrendingDownOutlinedIcon sx={{ fontSize: 20 }} />
              )}
            </Box>
          </Box>
          <Typography
            sx={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: summary.today_net_profit >= 0 ? '#059669' : '#dc2626',
              lineHeight: 1,
            }}
          >
            ₹{summary.today_net_profit.toFixed(2)}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', pt: 0.5 }}>
            <span>Sales: ₹{summary.today_sales.toFixed(2)}</span>
            <span>Expenses: ₹{summary.today_expenses.toFixed(2)}</span>
          </Box>
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
            gap: 1.25,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Monthly Net Profit
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                backgroundColor: summary.month_net_profit >= 0 ? '#ecfdf5' : '#fef2f2',
                color: summary.month_net_profit >= 0 ? '#059669' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {summary.month_net_profit >= 0 ? (
                <TrendingUpOutlinedIcon sx={{ fontSize: 20 }} />
              ) : (
                <TrendingDownOutlinedIcon sx={{ fontSize: 20 }} />
              )}
            </Box>
          </Box>
          <Typography
            sx={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: summary.month_net_profit >= 0 ? '#059669' : '#dc2626',
              lineHeight: 1,
            }}
          >
            ₹{summary.month_net_profit.toFixed(2)}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', pt: 0.5 }}>
            <span>Sales: ₹{summary.month_sales.toFixed(2)}</span>
            <span>Expenses: ₹{summary.month_expenses.toFixed(2)}</span>
          </Box>
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
            gap: 1.25,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Period Expenditures
            </Typography>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingCartOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
          </Box>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            ₹{Number(summary.period_expense || 0).toFixed(2)}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
            Across <strong>{summary.period_count || 0}</strong> raw material purchases
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
            gap: 1,
          }}
        >
          <Typography sx={{ color: '#64748b', fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Category Mix
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {Object.entries(summary.category_breakdown || {}).slice(0, 3).map(([cat, amount]) => (
              <Box key={cat} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: '#475569', fontWeight: 500 }}>{cat}:</span>
                <strong style={{ color: '#0f172a' }}>₹{Number(amount).toFixed(2)}</strong>
              </Box>
            ))}
            {Object.keys(summary.category_breakdown || {}).length === 0 && (
              <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>No expenses recorded</Typography>
            )}
          </Box>
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
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', gap: 1.5 }}>
          <Box sx={{ display: 'flex', flexWrap: { xs: 'nowrap', sm: 'wrap' }, overflowX: { xs: 'auto', sm: 'visible' }, maxWidth: '100%', pb: { xs: 0.5, sm: 0 }, gap: 0.75 }}>
            {PRESETS.map((preset) => {
              const isSelected = activePreset === preset
              return (
                <Box
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  sx={{
                    flexShrink: 0,
                    px: 1.75,
                    py: 0.55,
                    borderRadius: '10px',
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
                  {preset}
                </Box>
              )
            })}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: { xs: 'nowrap', sm: 'wrap' }, overflowX: { xs: 'auto', sm: 'visible' }, maxWidth: '100%', pb: { xs: 0.5, sm: 0 }, gap: 0.75 }}>
            {['All', 'Groceries', 'Dairy', 'Vegetables', 'Disposables', 'General'].map((cat) => {
              const isSelected = selectedCategory === cat
              return (
                <Box
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  sx={{
                    flexShrink: 0,
                    px: 1.5,
                    py: 0.45,
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                    backgroundColor: isSelected ? '#0f172a' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#475569',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {cat}
                </Box>
              )
            })}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1.2fr 2fr' },
            gap: 2,
            pt: 1,
            borderTop: '1px solid #f1f5f9',
            alignItems: 'center',
          }}
        >
          <TextField
            label="Start Date"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => {
              setActivePreset('Custom')
              setAllDatesMode(false)
              setStartDate(e.target.value)
            }}
            disabled={allDatesMode}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="End Date"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => {
              setActivePreset('Custom')
              setAllDatesMode(false)
              setEndDate(e.target.value)
            }}
            disabled={allDatesMode}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            size="small"
            placeholder="Search stock item, supplier note, cashier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />
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
            <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Loading stock expenditures...</Typography>
          </Box>
        ) : filteredExpenses.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, px: 2, textAlign: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              No stock purchases recorded
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 400 }}>
              Record ingredients, dairy, groceries, or disposable supplies to track daily canteen expenditures.
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
                px: 2.5,
                py: 0.9,
              }}
            >
              Add First Purchase
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead sx={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Stock Item</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Rate / Unit</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>
                    Total Cost (₹)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Logged By</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem', width: 110 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.map((exp) => {
                  const style = CATEGORY_STYLES[exp.category] || CATEGORY_STYLES.General

                  return (
                    <TableRow key={exp.id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                      <TableCell sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                        {exp.date}
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                          {exp.item_name}
                        </Typography>
                        {exp.notes && (
                          <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {exp.notes}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            px: 1.5,
                            py: 0.3,
                            borderRadius: '12px',
                            backgroundColor: style.bg,
                            color: style.color,
                            border: `1px solid ${style.border}`,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {exp.category || 'General'}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                          {exp.quantity} {exp.unit}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontSize: '0.85rem', color: '#475569' }}>
                          ₹{Number(exp.unit_price).toFixed(2)} / {exp.unit}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                          ₹{Number(exp.total_cost).toFixed(2)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AvatarBadge avatarId={exp.creator_avatar || 'executive'} size={24} />
                          <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem' }}>
                            {exp.creator_name || exp.created_by}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="Edit Entry">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(exp)}
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
                            <Tooltip title="Delete Entry (Admin / Owner)">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(exp)}
                                disabled={deletingId === exp.id}
                                sx={{
                                  color: '#ef4444',
                                  backgroundColor: '#fef2f2',
                                  '&:hover': { backgroundColor: '#fee2e2' },
                                }}
                              >
                                {deletingId === exp.id ? (
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
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <CreateStockExpenseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onExpenseSaved={handleExpenseSaved}
        initialExpense={editingExpense}
      />
    </Box>
  )
}

export default StockPage
