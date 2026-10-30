import { useState, useEffect } from 'react'
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
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import RestaurantMenuOutlinedIcon from '@mui/icons-material/RestaurantMenuOutlined'
import CreateItemDialog from '../components/CreateItemDialog'
import { fetchItemsApi, deleteItemApi } from '../api/items'

const CATEGORY_COLORS = {
  Snacks: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  Meals: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  Beverages: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  Desserts: { bg: '#fce7f3', color: '#be185d', border: '#fbcfe8' },
  General: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
}

function ItemsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await fetchItemsApi()
      setItems(data)
    } catch (err) {
      setError(err.message || 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  const handleCreateClick = () => {
    setEditingItem(null)
    setDialogOpen(true)
  }

  const handleEditClick = (item) => {
    setEditingItem(item)
    setDialogOpen(true)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from the menu?`)) {
      return
    }

    setDeletingId(id)
    setError('')
    setSuccessMsg('')

    try {
      await deleteItemApi(id)
      setSuccessMsg(`"${name}" was removed`)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete item')
    } finally {
      setDeletingId(null)
    }
  }

  const handleItemSaved = (savedItem, isEditing) => {
    if (isEditing) {
      setItems((prev) => prev.map((item) => (item.id === savedItem.id ? savedItem : item)))
      setSuccessMsg(`"${savedItem.name}" updated successfully`)
    } else {
      setItems((prev) => [savedItem, ...prev])
      setSuccessMsg(`"${savedItem.name}" added to menu`)
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesQuery = !q || (
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    )
    return matchesCategory && matchesQuery
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.5, md: 3.5 } }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
            Menu Items
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', mt: 0.25 }}>
            Create, edit, and manage food & beverage catalog, pricing, and availability
          </Typography>
        </Box>

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
            px: 2.5,
            py: 1,
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.15)',
            '&:hover': {
              backgroundColor: '#1e293b',
            },
          }}
        >
          Add Menu Item
        </Button>
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
          placeholder="Search items by name or keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', sm: 320 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: 'flex', flexWrap: { xs: 'nowrap', sm: 'wrap' }, overflowX: { xs: 'auto', sm: 'visible' }, maxWidth: '100%', pb: { xs: 0.5, sm: 0 }, gap: 1 }}>
          {['All', 'Snacks', 'Meals', 'Beverages', 'Desserts', 'General'].map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <Box
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                sx={{
                  flexShrink: 0,
                  px: 1.75,
                  py: 0.6,
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
                    borderColor: '#cbd5e1',
                  },
                }}
              >
                {cat}
              </Box>
            )
          })}
        </Box>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
          <CircularProgress size={32} sx={{ color: '#0f172a' }} />
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {filteredItems.map((item) => {
            const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.General
            const isDeleting = deletingId === item.id
            const isAvailable = Boolean(item.is_available)

            return (
              <Card
                key={item.id}
                elevation={0}
                sx={{
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 2,
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)',
                  opacity: isAvailable ? 1 : 0.72,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.07)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '12px',
                          backgroundColor: '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#0f172a',
                        }}
                      >
                        <RestaurantMenuOutlinedIcon sx={{ fontSize: 22 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem', lineHeight: 1.25 }}>
                          {item.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.2,
                              borderRadius: '6px',
                              backgroundColor: catStyle.bg,
                              border: `1px solid ${catStyle.border}`,
                              color: catStyle.color,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                            }}
                          >
                            {item.category || 'General'}
                          </Box>

                          {!isAvailable && (
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                px: 1,
                                py: 0.2,
                                borderRadius: '6px',
                                backgroundColor: '#fee2e2',
                                border: '1px solid #fecaca',
                                color: '#b91c1c',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                              }}
                            >
                              Unavailable
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Edit item">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(item)}
                          sx={{
                            color: '#64748b',
                            borderRadius: '8px',
                            '&:hover': { color: '#0f172a', backgroundColor: '#f1f5f9' },
                          }}
                        >
                          <EditOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete item">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={isDeleting}
                          sx={{
                            color: '#94a3b8',
                            borderRadius: '8px',
                            '&:hover': { color: '#ef4444', backgroundColor: '#fef2f2' },
                          }}
                        >
                          {isDeleting ? <CircularProgress size={16} sx={{ color: '#ef4444' }} /> : <DeleteOutlinedIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      color: item.description ? '#64748b' : '#94a3b8',
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      minHeight: 36,
                      fontStyle: item.description ? 'normal' : 'italic',
                    }}
                  >
                    {item.description || 'No description provided'}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    pt: 1.5,
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                    Unit Price
                  </Typography>
                  <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    ₹{Number(item.price).toFixed(2)}
                  </Typography>
                </Box>
              </Card>
            )
          })}
        </Box>
      )}

      {!loading && filteredItems.length === 0 && (
        <Card
          elevation={0}
          sx={{
            p: 6,
            borderRadius: '20px',
            border: '1.5px dashed #cbd5e1',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
          }}
        >
          <RestaurantMenuOutlinedIcon sx={{ fontSize: 44, color: '#94a3b8' }} />
          <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '1rem' }}>
            No menu items found
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
            {searchQuery ? 'Try adjusting your search filter' : 'Get started by creating your first canteen item'}
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
              textTransform: 'none',
              fontSize: '0.85rem',
              '&:hover': { backgroundColor: '#1e293b' },
            }}
          >
            Add Menu Item
          </Button>
        </Card>
      )}

      <CreateItemDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingItem(null)
        }}
        onItemSaved={handleItemSaved}
        initialItem={editingItem}
      />
    </Box>
  )
}

export default ItemsPage
