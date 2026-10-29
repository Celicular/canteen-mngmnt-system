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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined'
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import AvatarBadge from '../components/AvatarBadge'
import { fetchSalesApi, fetchSalesSummaryApi } from '../api/sales'

const PRESETS = [
  'Today',
  'Yesterday',
  'Last 7 Days',
  'This Month',
  'Last Month',
  'Last 30 Days',
  'All Time',
]

const MEAL_COLORS = {
  Breakfast: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  Lunch: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  Snack: { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' },
  Dinner: { bg: '#e0e7ff', color: '#4338ca', border: '#c7d2fe' },
}

function toISODate(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPresetDates(preset) {
  const now = new Date()
  const today = toISODate(now)

  if (preset === 'Today') {
    return { startDate: today, endDate: today, isAllTime: false }
  }
  if (preset === 'Yesterday') {
    const y = new Date(now)
    y.setDate(y.getDate() - 1)
    const yStr = toISODate(y)
    return { startDate: yStr, endDate: yStr, isAllTime: false }
  }
  if (preset === 'Last 7 Days') {
    const past = new Date(now)
    past.setDate(past.getDate() - 6)
    return { startDate: toISODate(past), endDate: today, isAllTime: false }
  }
  if (preset === 'This Month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    return { startDate: toISODate(firstDay), endDate: today, isAllTime: false }
  }
  if (preset === 'Last Month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
    return { startDate: toISODate(firstDay), endDate: toISODate(lastDay), isAllTime: false }
  }
  if (preset === 'Last 30 Days') {
    const past = new Date(now)
    past.setDate(past.getDate() - 29)
    return { startDate: toISODate(past), endDate: today, isAllTime: false }
  }
  if (preset === 'All Time') {
    return { startDate: '', endDate: '', isAllTime: true }
  }
  return { startDate: today, endDate: today, isAllTime: false }
}

function formatDateTime(isoString) {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return isoString
  }
}

function ReportsPage() {
  const todayStr = useMemo(() => toISODate(new Date()), [])
  const [activePreset, setActivePreset] = useState('This Month')
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    return toISODate(new Date(now.getFullYear(), now.getMonth(), 1))
  })
  const [endDate, setEndDate] = useState(todayStr)
  const [allDatesMode, setAllDatesMode] = useState(false)

  const [mealFilter, setMealFilter] = useState('All')
  const [cashierFilter, setCashierFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const [sales, setSales] = useState([])
  const [summary, setSummary] = useState({
    total_revenue: 0,
    total_orders: 0,
    meal_breakdown: {},
    meal_revenue: {},
    top_items: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedRows, setExpandedRows] = useState({})
  const [exporting, setExporting] = useState(false)

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError('')

      const queryParams = {
        startDate: allDatesMode ? undefined : startDate,
        endDate: allDatesMode ? undefined : endDate,
        allDates: allDatesMode,
        mealType: mealFilter,
        cashier: cashierFilter,
      }

      const [salesData, summaryData] = await Promise.all([
        fetchSalesApi(queryParams),
        fetchSalesSummaryApi(queryParams),
      ])

      setSales(salesData || [])
      setSummary(
        summaryData || {
          total_revenue: 0,
          total_orders: 0,
          meal_breakdown: {},
          meal_revenue: {},
          top_items: [],
        }
      )
    } catch (err) {
      setError(err.message || 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [startDate, endDate, allDatesMode, mealFilter, cashierFilter])

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

  const handleCustomDateChange = (field, val) => {
    setActivePreset('Custom')
    setAllDatesMode(false)
    if (field === 'start') setStartDate(val)
    if (field === 'end') setEndDate(val)
  }

  const toggleRowExpand = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const uniqueCashiers = useMemo(() => {
    const set = new Set()
    sales.forEach((s) => {
      if (s.created_by) set.add(s.created_by)
    })
    return Array.from(set)
  }, [sales])

  const filteredSales = sales.filter((sale) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true

    const matchesReceipt = sale.receipt_no?.toLowerCase().includes(q)
    const matchesCustomer = sale.customer_name?.toLowerCase().includes(q)
    const matchesPhone = sale.customer_phone?.toLowerCase().includes(q)
    const matchesCreator = sale.created_by?.toLowerCase().includes(q) || sale.creator_name?.toLowerCase().includes(q)
    const matchesItems = sale.items?.some((it) => it.item_name?.toLowerCase().includes(q))

    return matchesReceipt || matchesCustomer || matchesPhone || matchesCreator || matchesItems
  })

  const averageOrderValue =
    summary.total_orders > 0 ? (summary.total_revenue / summary.total_orders).toFixed(2) : '0.00'

  const totalItemsSold = useMemo(() => {
    return sales.reduce((acc, s) => {
      return acc + (s.items?.reduce((itAcc, it) => itAcc + (it.quantity || 1), 0) || 0)
    }, 0)
  }, [sales])

  const exportExcel = () => {
    try {
      setExporting(true)
      const rangeLabel = allDatesMode ? 'All_Time' : `${startDate}_to_${endDate}`

      const summaryAOA = [
        ['CANTEEN MANAGEMENT SYSTEM - SALES REPORT'],
        ['Generated On', new Date().toLocaleString()],
        ['Selected Date Range', allDatesMode ? 'All Time Records' : `${startDate} to ${endDate}`],
        ['Meal Filter', mealFilter],
        ['Cashier Filter', cashierFilter],
        [],
        ['FINANCIAL SUMMARY'],
        ['Total Revenue (INR)', summary.total_revenue],
        ['Total Orders Count', summary.total_orders],
        ['Average Order Value (INR)', Number(averageOrderValue)],
        ['Total Items Sold', totalItemsSold],
        [],
        ['MEAL SESSION BREAKDOWN'],
        ['Session', 'Orders Count', 'Total Revenue (INR)'],
        ['Breakfast', summary.meal_breakdown?.Breakfast || 0, summary.meal_revenue?.Breakfast || 0],
        ['Lunch', summary.meal_breakdown?.Lunch || 0, summary.meal_revenue?.Lunch || 0],
        ['Snack', summary.meal_breakdown?.Snack || 0, summary.meal_revenue?.Snack || 0],
        ['Dinner', summary.meal_breakdown?.Dinner || 0, summary.meal_revenue?.Dinner || 0],
      ]
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryAOA)

      const transactionsData = filteredSales.map((s) => ({
        'Receipt No': s.receipt_no,
        'Date & Time': formatDateTime(s.created_at),
        'Customer Name': s.customer_name || 'Walk-in Customer',
        'Customer Phone': s.customer_phone || '-',
        'Meal Session': s.meal_type,
        'Cashier': s.creator_name ? `${s.creator_name} (@${s.created_by})` : s.created_by,
        'Items Summary': s.items?.map((it) => `${it.quantity}x ${it.item_name}`).join(', ') || '',
        'Total Items': s.items?.reduce((sum, it) => sum + it.quantity, 0) || 0,
        'Total Amount (INR)': Number(s.total_amount),
      }))
      const wsTransactions = XLSX.utils.json_to_sheet(transactionsData)

      const itemizedData = []
      filteredSales.forEach((s) => {
        s.items?.forEach((it) => {
          itemizedData.push({
            'Receipt No': s.receipt_no,
            'Date': s.created_at?.slice(0, 10),
            'Meal Session': s.meal_type,
            'Item Name': it.item_name,
            'Quantity': it.quantity,
            'Unit Price (INR)': Number(it.unit_price),
            'Subtotal (INR)': Number(it.subtotal),
            'Cashier': s.created_by,
          })
        })
      })
      const wsItemized = XLSX.utils.json_to_sheet(itemizedData)

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Overview')
      XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transactions')
      XLSX.utils.book_append_sheet(wb, wsItemized, 'Itemized Sales')

      XLSX.writeFile(wb, `Canteen_Report_${rangeLabel}.xlsx`)
    } catch (err) {
      setError('Failed to export Excel report: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const exportPDF = () => {
    try {
      setExporting(true)
      const doc = new jsPDF('p', 'pt', 'a4')
      const rangeLabel = allDatesMode ? 'All Time' : `${startDate} to ${endDate}`

      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, 595.28, 70, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('CANTEEN MANAGEMENT SYSTEM', 40, 36)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Sales & Revenue Report | Period: ${rangeLabel}`, 40, 54)

      doc.setTextColor(71, 85, 105)
      doc.setFontSize(9)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 420, 54)

      doc.setTextColor(15, 23, 42)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Key Performance Indicators', 40, 95)

      const kpiData = [
        ['Total Revenue', `INR ${Number(summary.total_revenue || 0).toFixed(2)}`],
        ['Total Orders', `${summary.total_orders || 0}`],
        ['Avg Order Value', `INR ${averageOrderValue}`],
        ['Total Items Sold', `${totalItemsSold}`],
      ]
      autoTable(doc, {
        startY: 105,
        head: [['Metric', 'Value']],
        body: kpiData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 9 },
        margin: { left: 40, right: 320 },
      })

      const mealData = [
        ['Breakfast', `${summary.meal_breakdown?.Breakfast || 0}`, `INR ${Number(summary.meal_revenue?.Breakfast || 0).toFixed(2)}`],
        ['Lunch', `${summary.meal_breakdown?.Lunch || 0}`, `INR ${Number(summary.meal_revenue?.Lunch || 0).toFixed(2)}`],
        ['Snack', `${summary.meal_breakdown?.Snack || 0}`, `INR ${Number(summary.meal_revenue?.Snack || 0).toFixed(2)}`],
        ['Dinner', `${summary.meal_breakdown?.Dinner || 0}`, `INR ${Number(summary.meal_revenue?.Dinner || 0).toFixed(2)}`],
      ]
      autoTable(doc, {
        startY: 105,
        head: [['Session', 'Orders', 'Revenue']],
        body: mealData,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] },
        styles: { fontSize: 9 },
        margin: { left: 300, right: 40 },
      })

      const afterKpiY = doc.lastAutoTable.finalY + 25
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Sales Transactions Ledger', 40, afterKpiY)

      const tableRows = filteredSales.slice(0, 100).map((s) => [
        s.receipt_no,
        formatDateTime(s.created_at),
        s.customer_name || 'Walk-in',
        s.meal_type,
        s.created_by,
        `${s.items?.length || 0} items`,
        `INR ${Number(s.total_amount).toFixed(2)}`,
      ])

      autoTable(doc, {
        startY: afterKpiY + 10,
        head: [['Receipt #', 'Time & Date', 'Customer', 'Session', 'Cashier', 'Items', 'Total']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 4 },
        margin: { left: 40, right: 40 },
      })

      doc.save(`Canteen_Report_${allDatesMode ? 'All_Time' : `${startDate}_to_${endDate}`}.pdf`)
    } catch (err) {
      setError('Failed to export PDF report: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.45rem' }}>
              Reports & Financial Auditing
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
              {allDatesMode ? 'All Time Records' : `${startDate} to ${endDate}`}
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', mt: 0.5 }}>
            Filter across customizable date ranges, session audits, and export to Excel (.xlsx) and PDF
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Tooltip title="Reload report data">
            <IconButton
              onClick={loadReportData}
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
            disabled={loading || exporting || filteredSales.length === 0}
            startIcon={<TableChartOutlinedIcon />}
            sx={{
              borderRadius: '12px',
              borderColor: '#10b981',
              color: '#047857',
              backgroundColor: '#ecfdf5',
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 2.25,
              py: 1,
              '&:hover': {
                backgroundColor: '#d1fae5',
                borderColor: '#059669',
              },
            }}
          >
            Export Excel (.xlsx)
          </Button>

          <Button
            variant="contained"
            onClick={exportPDF}
            disabled={loading || exporting || filteredSales.length === 0}
            startIcon={<PictureAsPdfOutlinedIcon />}
            sx={{
              borderRadius: '12px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 2.5,
              py: 1,
              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
              '&:hover': {
                backgroundColor: '#1e293b',
              },
            }}
          >
            Export PDF Report
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: '14px', fontSize: '0.875rem' }}>
          {error}
        </Alert>
      )}

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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DateRangeOutlinedIcon sx={{ color: '#0f172a', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.925rem' }}>
              Date Range Presets
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {PRESETS.map((preset) => {
              const isSelected = activePreset === preset
              return (
                <Box
                  key={preset}
                  onClick={() => handlePresetClick(preset)}
                  sx={{
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
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.2fr 1.2fr 1.2fr 1.2fr 2fr' },
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
            onChange={(e) => handleCustomDateChange('start', e.target.value)}
            disabled={allDatesMode}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="End Date"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
            disabled={allDatesMode}
            InputLabelProps={{ shrink: true }}
          />

          <FormControl size="small" fullWidth>
            <InputLabel id="meal-filter-label">Meal Session</InputLabel>
            <Select
              labelId="meal-filter-label"
              value={mealFilter}
              label="Meal Session"
              onChange={(e) => setMealFilter(e.target.value)}
            >
              <MenuItem value="All">All Sessions</MenuItem>
              <MenuItem value="Breakfast">Breakfast</MenuItem>
              <MenuItem value="Lunch">Lunch</MenuItem>
              <MenuItem value="Snack">Snack</MenuItem>
              <MenuItem value="Dinner">Dinner</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel id="cashier-filter-label">Cashier</InputLabel>
            <Select
              labelId="cashier-filter-label"
              value={cashierFilter}
              label="Cashier"
              onChange={(e) => setCashierFilter(e.target.value)}
            >
              <MenuItem value="All">All Staff</MenuItem>
              {uniqueCashiers.map((c) => (
                <MenuItem key={c} value={c}>
                  @{c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Search receipt, customer, phone, item..."
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
              Period Revenue
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
            Total collected in selected date range
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
              Orders Count
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
            Completed counter receipts
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
              Avg. Order Value
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
              <AssessmentOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
          </Box>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            ₹{averageOrderValue}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
            Average basket size per customer
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
              Items Sold
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
              <RestaurantOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
          </Box>
          <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            {totalItemsSold}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
            Cumulative units served
          </Typography>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
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
            gap: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
            Meal Session Distribution
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map((type) => {
              const orders = summary.meal_breakdown?.[type] || 0
              const revenue = summary.meal_revenue?.[type] || 0
              const pct = summary.total_revenue > 0 ? (revenue / summary.total_revenue) * 100 : 0
              const style = MEAL_COLORS[type]

              return (
                <Box
                  key={type}
                  sx={{
                    p: 1.5,
                    borderRadius: '14px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.3,
                          borderRadius: '12px',
                          backgroundColor: style.bg,
                          color: style.color,
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          border: `1px solid ${style.border}`,
                        }}
                      >
                        {type}
                      </Box>
                      <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {orders} {orders === 1 ? 'order' : 'orders'}
                      </Typography>
                    </Box>

                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.925rem' }}>
                      ₹{Number(revenue).toFixed(2)} ({pct.toFixed(1)}%)
                    </Typography>
                  </Box>

                  <Box sx={{ width: '100%', height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: style.color,
                        borderRadius: 3,
                      }}
                    />
                  </Box>
                </Box>
              )
            })}
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
            gap: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
            Top Selling Products in Selected Period
          </Typography>

          {summary.top_items && summary.top_items.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {summary.top_items.slice(0, 5).map((item, idx) => (
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
                        width: 28,
                        height: 28,
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      {idx + 1}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                        {item.item_name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {item.total_qty} units served
                      </Typography>
                    </Box>
                  </Box>

                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.925rem' }}>
                    ₹{Number(item.total_revenue).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                No itemized product data available for this range
              </Typography>
            </Box>
          )}
        </Card>
      </Box>

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
        <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>
              Detailed Transaction Audit Ledger ({filteredSales.length})
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.825rem' }}>
              Click any row to reveal ordered items, prices, and quantities
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
            <CircularProgress size={36} sx={{ color: '#0f172a' }} />
            <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Compiling report data...</Typography>
          </Box>
        ) : filteredSales.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, px: 2, textAlign: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
              No records found for selected period
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 400 }}>
              Adjust the date range or clear the filters to view sales transactions.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                <TableRow>
                  <TableCell sx={{ width: 48, p: 1 }} />
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Receipt #</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Session</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>Cashier</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.825rem' }}>
                    Total (₹)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSales.map((sale) => {
                  const isExpanded = Boolean(expandedRows[sale.id])
                  const mealStyle = MEAL_COLORS[sale.meal_type] || MEAL_COLORS.Snack

                  return (
                    <Box component="tbody" key={sale.id} sx={{ display: 'contents' }}>
                      <TableRow
                        sx={{
                          '&:hover': { backgroundColor: '#f8fafc' },
                          borderBottom: isExpanded ? 'none' : '1px solid #f1f5f9',
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleRowExpand(sale.id)}
                      >
                        <TableCell sx={{ p: 1 }}>
                          <IconButton size="small" sx={{ color: '#64748b' }}>
                            {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                            {sale.receipt_no}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>
                            {formatDateTime(sale.created_at)}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                            {sale.customer_name || 'Walk-in'}
                          </Typography>
                          {sale.customer_phone && (
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {sale.customer_phone}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.5,
                              py: 0.35,
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
                            <AvatarBadge avatarId={sale.creator_avatar || 'executive'} size={24} />
                            <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem' }}>
                              {sale.creator_name || sale.created_by}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                            ₹{Number(sale.total_amount).toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>

                      <TableRow sx={{ backgroundColor: '#fbfcfd' }}>
                        <TableCell colSpan={7} sx={{ p: 0, borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, px: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.825rem' }}>
                                Ordered Items ({sale.items?.length || 0})
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                {sale.items?.map((it) => (
                                  <Box
                                    key={it.id}
                                    sx={{
                                      p: 1.2,
                                      px: 1.75,
                                      borderRadius: '12px',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #e2e8f0',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                      minWidth: 190,
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
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem', ml: 'auto' }}>
                                      ₹{Number(it.subtotal).toFixed(2)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
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
    </Box>
  )
}

export default ReportsPage
