import { useState, useEffect } from 'react'
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
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { createItemApi, updateItemApi } from '../api/items'

const CATEGORIES = [
  { id: 'Snacks', label: 'Snacks', color: '#f59e0b' },
  { id: 'Meals', label: 'Meals', color: '#10b981' },
  { id: 'Beverages', label: 'Beverages', color: '#0284c7' },
  { id: 'Desserts', label: 'Desserts', color: '#ec4899' },
  { id: 'General', label: 'General', color: '#64748b' },
]

function CreateItemDialog({ open, onClose, onItemSaved, initialItem = null }) {
  const isEditing = Boolean(initialItem)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Snacks')
  const [description, setDescription] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name || '')
      setPrice(initialItem.price?.toString() || '')
      setCategory(initialItem.category || 'Snacks')
      setDescription(initialItem.description || '')
      setIsAvailable(Boolean(initialItem.is_available))
    } else {
      setName('')
      setPrice('')
      setCategory('Snacks')
      setDescription('')
      setIsAvailable(true)
    }
    setError('')
  }, [initialItem, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Item name is required')
      return
    }

    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Please enter a valid price')
      return
    }

    setSubmitting(true)

    try {
      let savedItem
      if (isEditing) {
        savedItem = await updateItemApi(initialItem.id, {
          name: trimmedName,
          price: numPrice,
          category,
          description: description.trim(),
          is_available: isAvailable,
        })
      } else {
        savedItem = await createItemApi({
          name: trimmedName,
          price: numPrice,
          category,
          description: description.trim(),
          is_available: isAvailable,
        })
      }

      handleClose()
      if (onItemSaved) {
        onItemSaved(savedItem, isEditing)
      }
    } catch (err) {
      setError(err.message || 'Failed to save item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setName('')
    setPrice('')
    setCategory('Snacks')
    setDescription('')
    setIsAvailable(true)
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
          borderRadius: '24px',
          p: { xs: 2, sm: 2.5 },
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.2)',
          maxWidth: '560px !important',
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
            {isEditing ? 'Edit Menu Item' : 'Add Menu Item'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.825rem', mt: 0.25 }}>
            {isEditing ? 'Update pricing, details, and availability' : 'Create a food or beverage item for the canteen menu'}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={submitting} size="small" sx={{ color: '#94a3b8' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, px: 2, py: 1.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: '12px', fontSize: '0.85rem' }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            required
            id="item-name"
            label="Item Name"
            placeholder="e.g. Veg Cheese Burger, Cold Coffee"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />

          <TextField
            fullWidth
            required
            id="item-price"
            label="Price"
            type="number"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={submitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ fontWeight: 600, color: '#0f172a' }}>₹</Typography>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
              Category
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id
                return (
                  <Box
                    key={cat.id}
                    onClick={() => !submitting && setCategory(cat.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2,
                      py: 0.9,
                      borderRadius: '12px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      border: isSelected ? '2px solid #0f172a' : '1.5px solid #e2e8f0',
                      backgroundColor: isSelected ? '#0f172a' : '#f8fafc',
                      color: isSelected ? '#ffffff' : '#334155',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '0.875rem',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: isSelected ? '#0f172a' : '#ffffff',
                        borderColor: isSelected ? '#0f172a' : '#cbd5e1',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#ffffff' : cat.color,
                      }}
                    />
                    {cat.label}
                  </Box>
                )
              })}
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            id="item-description"
            label="Description (Optional)"
            placeholder="Brief details about ingredients, portion size, or preparation..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
          />

          {isEditing && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  sx={{
                    color: '#94a3b8',
                    '&.Mui-checked': { color: '#0f172a' },
                  }}
                />
              }
              label={<Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>Available for ordering</Typography>}
            />
          )}
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
            {submitting ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : (isEditing ? 'Save Changes' : 'Add Item')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default CreateItemDialog
