import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import { createStockExpenseApi, updateStockExpenseApi } from '../api/stock'

const CATEGORIES = ['Groceries', 'Dairy', 'Vegetables', 'Disposables', 'General']
const UNITS = ['Kg', 'G', 'L', 'N', 'Box']

function toTodayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function CreateStockExpenseDialog({ open, onClose, onExpenseSaved, initialExpense = null }) {
  const isEditing = Boolean(initialExpense)

  const [date, setDate] = useState(toTodayString())
  const [itemName, setItemName] = useState('')
  const [category, setCategory] = useState('Groceries')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('Kg')
  const [unitPrice, setUnitPrice] = useState(0)
  const [notes, setNotes] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialExpense) {
      setDate(initialExpense.date || toTodayString())
      setItemName(initialExpense.item_name || '')
      setCategory(initialExpense.category || 'Groceries')
      setQuantity(Number(initialExpense.quantity) || 1)
      setUnit(initialExpense.unit || 'Kg')
      setUnitPrice(Number(initialExpense.unit_price) || 0)
      setNotes(initialExpense.notes || '')
    } else {
      setDate(toTodayString())
      setItemName('')
      setCategory('Groceries')
      setQuantity(1)
      setUnit('Kg')
      setUnitPrice(0)
      setNotes('')
    }
    setError('')
  }, [initialExpense, open])

  const totalCost = (Number(quantity) || 0) * (Number(unitPrice) || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedItem = itemName.trim()
    if (!trimmedItem) {
      setError('Item name is required')
      return
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than 0')
      return
    }

    if (unitPrice < 0) {
      setError('Unit price cannot be negative')
      return
    }

    setSubmitting(true)

    const payload = {
      date: date || toTodayString(),
      item_name: trimmedItem,
      category,
      quantity: Number(quantity),
      unit,
      unit_price: Number(unitPrice),
      notes: notes.trim(),
    }

    try {
      let result
      if (isEditing) {
        result = await updateStockExpenseApi(initialExpense.id, payload)
      } else {
        result = await createStockExpenseApi(payload)
      }

      handleClose()
      if (onExpenseSaved) {
        onExpenseSaved(result, isEditing)
      }
    } catch (err) {
      setError(err.message || 'Failed to save expenditure')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: '20px', sm: '24px' },
          p: 0,
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          maxWidth: '560px !important',
          width: { xs: 'calc(100% - 16px)', sm: '100%' },
          maxHeight: { xs: '94vh', sm: '90vh' },
          height: { xs: 'auto', sm: 'auto' },
          m: { xs: '8px auto', sm: '32px auto' },
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: { xs: 2, sm: 2.5 },
          borderBottom: '1px solid #f1f5f9',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              backgroundColor: '#f1f5f9',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Inventory2OutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.05rem', sm: '1.15rem' } }}>
              {isEditing ? 'Edit Stock Expenditure' : 'Record Stock Expenditure'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Raw materials, ingredients & canteen supplies
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={handleClose} disabled={submitting} size="small" sx={{ color: '#94a3b8' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: { xs: 2, sm: 2.5 },
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ borderRadius: '12px', fontSize: '0.85rem' }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 2fr' }, gap: 1.5 }}>
            <TextField
              size="small"
              type="date"
              label="Purchase Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              size="small"
              required
              label="Stock / Ingredient Name"
              placeholder="e.g. Milk, Onions, Cooking Oil, Rice"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              disabled={submitting}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase' }}>
              Category
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat
                return (
                  <Box
                    key={cat}
                    onClick={() => !submitting && setCategory(cat)}
                    sx={{
                      px: 1.75,
                      py: 0.5,
                      borderRadius: '10px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      border: isSelected ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#0f172a' : '#f8fafc',
                      color: isSelected ? '#ffffff' : '#475569',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.8rem',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: isSelected ? '#0f172a' : '#ffffff',
                      },
                    }}
                  >
                    {cat}
                  </Box>
                )
              })}
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <TextField
              size="small"
              required
              type="number"
              label="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={submitting}
              inputProps={{ min: 0.01, step: 'any' }}
            />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                Unit
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {UNITS.map((u) => {
                  const isSelected = unit === u
                  return (
                    <Box
                      key={u}
                      onClick={() => !submitting && setUnit(u)}
                      sx={{
                        px: 1,
                        py: 0.45,
                        borderRadius: '8px',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        border: isSelected ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#0f172a' : '#f8fafc',
                        color: isSelected ? '#ffffff' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        flex: 1,
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {u}
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </Box>

          <TextField
            size="small"
            required
            type="number"
            label={`Rate per ${unit}`}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            disabled={submitting}
            inputProps={{ min: 0, step: 'any' }}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
          />

          <TextField
            size="small"
            fullWidth
            label="Notes / Supplier Info (Optional)"
            placeholder="e.g. Purchased from wholesale mandi / local dairy"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={submitting}
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderRadius: '16px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.825rem' }}>
                Total Expenditure
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                {quantity} {unit} &times; ₹{unitPrice}/{unit}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Calculated Total
              </Typography>
              <Typography sx={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                ₹{totalCost.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
            flexShrink: 0,
          }}
        >
          <Button
            onClick={handleClose}
            disabled={submitting}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              color: '#475569',
              borderColor: '#cbd5e1',
              px: 2.5,
              py: 0.9,
              fontSize: '0.85rem',
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={submitting || !itemName.trim()}
            variant="contained"
            sx={{
              borderRadius: '12px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              px: 3.5,
              py: 0.9,
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.18)',
              '&:hover': { backgroundColor: '#1e293b' },
            }}
          >
            {submitting ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : (isEditing ? 'Update Entry' : 'Save Expenditure')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default CreateStockExpenseDialog
