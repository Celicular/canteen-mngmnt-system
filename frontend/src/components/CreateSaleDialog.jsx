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
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined'
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import AddPatientDialog from './AddPatientDialog'
import { fetchItemsApi } from '../api/items'
import { fetchPatientsApi } from '../api/patients'
import { createSaleApi, updateSaleApi } from '../api/sales'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snack', 'Dinner']

function CreateSaleDialog({ open, onClose, onSaleSaved, initialSale = null }) {
  const isEditing = Boolean(initialSale)

  const [customerName, setCustomerName] = useState('Walk-in Customer')
  const [customerPhone, setCustomerPhone] = useState('')
  const [wardNumber, setWardNumber] = useState('')
  const [patientId, setPatientId] = useState(null)
  const [mealType, setMealType] = useState('Snack')

  const [menuItems, setMenuItems] = useState([])
  const [patients, setPatients] = useState([])
  const [patientSearchOpen, setPatientSearchOpen] = useState(false)
  const [addPatientModalOpen, setAddPatientModalOpen] = useState(false)

  const [rows, setRows] = useState([
    { id: 1, item_name: '', unit_price: 0, quantity: 1, item_id: null },
  ])
  const [focusedRowIndex, setFocusedRowIndex] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadInitialData = async () => {
    try {
      const [itemsData, patientsData] = await Promise.all([
        fetchItemsApi(),
        fetchPatientsApi(),
      ])
      setMenuItems(itemsData || [])
      setPatients(patientsData || [])
    } catch {
      setMenuItems([])
      setPatients([])
    }
  }

  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  useEffect(() => {
    if (initialSale) {
      setCustomerName(initialSale.customer_name || 'Walk-in Customer')
      setCustomerPhone(initialSale.customer_phone || '')
      setWardNumber(initialSale.ward_number || '')
      setPatientId(initialSale.patient_id || null)
      setMealType(initialSale.meal_type || 'Snack')
      if (initialSale.items && initialSale.items.length > 0) {
        setRows(
          initialSale.items.map((item, idx) => ({
            id: idx + 1,
            item_name: item.item_name || '',
            unit_price: Number(item.unit_price) || 0,
            quantity: Number(item.quantity) || 1,
            item_id: item.item_id || null,
          }))
        )
      } else {
        setRows([{ id: 1, item_name: '', unit_price: 0, quantity: 1, item_id: null }])
      }
    } else {
      setCustomerName('Walk-in Customer')
      setCustomerPhone('')
      setWardNumber('')
      setPatientId(null)
      setMealType('Snack')
      setRows([{ id: 1, item_name: '', unit_price: 0, quantity: 1, item_id: null }])
    }
    setError('')
  }, [initialSale, open])

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now(), item_name: '', unit_price: 0, quantity: 1, item_id: null },
    ])
  }

  const handleSelectItem = (rowIndex, menuItem) => {
    setRows((prev) => {
      const next = [...prev]
      next[rowIndex] = {
        ...next[rowIndex],
        item_name: menuItem.name,
        unit_price: Number(menuItem.price),
        item_id: menuItem.id,
        quantity: next[rowIndex].quantity || 1,
      }

      if (rowIndex === next.length - 1) {
        next.push({
          id: Date.now(),
          item_name: '',
          unit_price: 0,
          quantity: 1,
          item_id: null,
        })
      }

      return next
    })
    setFocusedRowIndex(null)
  }

  const handleItemNameChange = (rowIndex, value) => {
    setRows((prev) => {
      const next = [...prev]
      next[rowIndex] = {
        ...next[rowIndex],
        item_name: value,
      }

      const match = menuItems.find(
        (m) => m.name.toLowerCase() === value.trim().toLowerCase()
      )
      if (match) {
        next[rowIndex].unit_price = Number(match.price)
        next[rowIndex].item_id = match.id
      }

      if (value.trim() && rowIndex === next.length - 1) {
        next.push({
          id: Date.now(),
          item_name: '',
          unit_price: 0,
          quantity: 1,
          item_id: null,
        })
      }

      return next
    })
  }

  const handleQuantityChange = (rowIndex, delta) => {
    setRows((prev) => {
      const next = [...prev]
      const current = next[rowIndex].quantity || 1
      const newQty = Math.max(1, current + delta)
      next[rowIndex] = { ...next[rowIndex], quantity: newQty }
      return next
    })
  }

  const handlePriceChange = (rowIndex, value) => {
    const p = parseFloat(value) || 0
    setRows((prev) => {
      const next = [...prev]
      next[rowIndex] = { ...next[rowIndex], unit_price: p }
      return next
    })
  }

  const handleRemoveRow = (rowIndex) => {
    setRows((prev) => {
      if (prev.length <= 1) {
        return [{ id: 1, item_name: '', unit_price: 0, quantity: 1, item_id: null }]
      }
      return prev.filter((_, idx) => idx !== rowIndex)
    })
  }

  const handleSelectPatient = (patient) => {
    setCustomerName(patient.name)
    setCustomerPhone(patient.mobile_number || '')
    setWardNumber(patient.ward_number || '')
    setPatientId(patient.id)
    setPatientSearchOpen(false)
  }

  const handlePatientAdded = (newPatient) => {
    setPatients((prev) => [newPatient, ...prev])
    setCustomerName(newPatient.name)
    setCustomerPhone(newPatient.mobile_number || '')
    setWardNumber(newPatient.ward_number || '')
    setPatientId(newPatient.id)
    setPatientSearchOpen(false)
  }

  const patientQuery = customerName.toLowerCase().trim()
  const patientMatches =
    patientQuery && customerName !== 'Walk-in Customer'
      ? patients.filter(
          (p) =>
            p.name.toLowerCase().includes(patientQuery) ||
            (p.mobile_number && p.mobile_number.includes(patientQuery)) ||
            (p.ward_number && p.ward_number.toLowerCase().includes(patientQuery))
        ).slice(0, 5)
      : []

  const validRows = rows.filter((r) => r.item_name.trim())
  const grandTotal = validRows.reduce(
    (sum, r) => sum + (r.quantity || 1) * (r.unit_price || 0),
    0
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (validRows.length === 0) {
      setError('Please add at least one item to the sale')
      return
    }

    setSubmitting(true)

    const payload = {
      customer_name: customerName.trim() || 'Walk-in Customer',
      customer_phone: customerPhone.trim(),
      ward_number: wardNumber.trim(),
      patient_id: patientId,
      meal_type: mealType,
      items: validRows.map((r) => ({
        item_id: r.item_id,
        item_name: r.item_name.trim(),
        quantity: r.quantity,
        unit_price: r.unit_price,
      })),
    }

    try {
      let result
      if (isEditing) {
        result = await updateSaleApi(initialSale.id, payload)
      } else {
        result = await createSaleApi(payload)
      }

      handleClose()
      if (onSaleSaved) {
        onSaleSaved(result, isEditing)
      }
    } catch (err) {
      setError(err.message || 'Failed to record sale')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setCustomerName('Walk-in Customer')
    setCustomerPhone('')
    setWardNumber('')
    setPatientId(null)
    setMealType('Snack')
    setRows([{ id: 1, item_name: '', unit_price: 0, quantity: 1, item_id: null }])
    setError('')
    onClose()
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={submitting ? undefined : handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            p: { xs: 2, sm: 2.5 },
            backgroundColor: '#ffffff',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.2)',
            maxWidth: '860px !important',
            maxHeight: '92vh',
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
            pb: 1,
            pt: 0.5,
            px: 1.5,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.25rem' }}>
              {isEditing ? 'Edit Sale Transaction' : 'Record New Sale'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.825rem', mt: 0.25 }}>
              Hospital canteen billing with patient directory autocomplete, auto-line addition, and live totals
            </Typography>
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
              px: 1.5,
              py: 1,
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {error && (
              <Alert severity="error" sx={{ borderRadius: '12px', fontSize: '0.85rem' }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr 1fr' }, gap: 1.5 }}>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>
                    Customer / Patient Name
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setAddPatientModalOpen(true)}
                    disabled={submitting}
                    startIcon={<PersonAddAlt1OutlinedIcon sx={{ fontSize: 14 }} />}
                    sx={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      py: 0.2,
                      px: 1,
                      borderRadius: '8px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      lineHeight: 1.2,
                      '&:hover': { backgroundColor: '#dbeafe' },
                    }}
                  >
                    Add Patient
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  size="small"
                  id="customer-name"
                  placeholder="Type patient name or Walk-in..."
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value)
                    setPatientSearchOpen(true)
                    if (patientId) setPatientId(null)
                  }}
                  onFocus={() => setPatientSearchOpen(true)}
                  onBlur={() => setTimeout(() => setPatientSearchOpen(false), 250)}
                  disabled={submitting}
                />

                {patientSearchOpen && patientMatches.length > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 110,
                      mt: 0.5,
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
                      border: '1px solid #cbd5e1',
                      overflow: 'hidden',
                    }}
                  >
                    {patientMatches.map((patient) => (
                      <Box
                        key={patient.id}
                        onMouseDown={() => handleSelectPatient(patient)}
                        sx={{
                          p: 1.25,
                          px: 1.75,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease',
                          '&:hover': { backgroundColor: '#f1f5f9' },
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                            {patient.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {patient.mobile_number ? `Mob: ${patient.mobile_number}` : 'No phone recorded'}
                          </Typography>
                        </Box>
                        {patient.ward_number && (
                          <Box
                            sx={{
                              px: 1.25,
                              py: 0.3,
                              borderRadius: '10px',
                              backgroundColor: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                          >
                            {patient.ward_number}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <TextField
                  fullWidth
                  size="small"
                  id="customer-phone"
                  label="Mobile Number (Optional)"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  disabled={submitting}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <TextField
                  fullWidth
                  size="small"
                  id="ward-number"
                  label="Ward / Bed / Room No."
                  placeholder="e.g. Ward 4B - Bed 12"
                  value={wardNumber}
                  onChange={(e) => setWardNumber(e.target.value)}
                  disabled={submitting}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>
                Meal Session:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {MEAL_TYPES.map((type) => {
                  const isSelected = mealType === type
                  return (
                    <Box
                      key={type}
                      onClick={() => !submitting && setMealType(type)}
                      sx={{
                        px: 2,
                        py: 0.6,
                        borderRadius: '10px',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        border: isSelected ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                        backgroundColor: isSelected ? '#0f172a' : '#f8fafc',
                        color: isSelected ? '#ffffff' : '#334155',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.825rem',
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
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, flex: 1, minHeight: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.925rem' }}>
                    Order Items ({validRows.length})
                  </Typography>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.2,
                      borderRadius: '10px',
                      backgroundColor: '#e2e8f0',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#334155',
                    }}
                  >
                    {validRows.reduce((sum, r) => sum + r.quantity, 0)} units
                  </Box>
                </Box>

                <Button
                  size="small"
                  onClick={handleAddRow}
                  disabled={submitting}
                  startIcon={<AddOutlinedIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    py: 0.4,
                    px: 1.5,
                    backgroundColor: '#f1f5f9',
                    color: '#0f172a',
                    '&:hover': { backgroundColor: '#e2e8f0' },
                  }}
                >
                  Add Line
                </Button>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.2,
                  maxHeight: { xs: '260px', sm: '320px' },
                  overflowY: 'auto',
                  pr: 0.75,
                  pb: 2,
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-track': { background: '#f1f5f9', borderRadius: '8px' },
                  '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '8px' },
                  '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
                }}
              >
                {rows.map((row, index) => {
                  const query = row.item_name.toLowerCase().trim()
                  const recommendations = query
                    ? menuItems.filter((m) =>
                        m.name.toLowerCase().includes(query)
                      ).slice(0, 5)
                    : []

                  const rowSubtotal = (row.quantity || 1) * (row.unit_price || 0)
                  const showDropdown = focusedRowIndex === index && recommendations.length > 0

                  return (
                    <Box
                      key={row.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '2.5fr 1fr 1.2fr 0.8fr 36px' },
                        gap: 1.25,
                        alignItems: 'center',
                        p: 1.25,
                        borderRadius: '14px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        position: 'relative',
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder={`Start typing item ${index + 1}...`}
                          value={row.item_name}
                          onChange={(e) => handleItemNameChange(index, e.target.value)}
                          onFocus={() => setFocusedRowIndex(index)}
                          onBlur={() => setTimeout(() => setFocusedRowIndex(null), 250)}
                          disabled={submitting}
                        />

                        {showDropdown && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 100,
                              mt: 0.5,
                              backgroundColor: '#ffffff',
                              borderRadius: '14px',
                              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)',
                              border: '1px solid #cbd5e1',
                              overflow: 'hidden',
                            }}
                          >
                            {recommendations.map((item) => (
                              <Box
                                key={item.id}
                                onMouseDown={() => handleSelectItem(index, item)}
                                sx={{
                                  p: 1.25,
                                  px: 1.75,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease',
                                  '&:hover': {
                                    backgroundColor: '#f1f5f9',
                                  },
                                }}
                              >
                                <Box>
                                  <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
                                    {item.name}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {item.category || 'General'}
                                  </Typography>
                                </Box>
                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                                  ₹{Number(item.price).toFixed(2)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>

                      <TextField
                        size="small"
                        label="Price"
                        type="number"
                        value={row.unit_price}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        disabled={submitting}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                      />

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(index, -1)}
                          disabled={submitting || row.quantity <= 1}
                          sx={{ color: '#64748b', p: 0.5 }}
                        >
                          <RemoveCircleOutlinedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, color: '#0f172a', minWidth: 24, textAlign: 'center' }}>
                          {row.quantity}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(index, 1)}
                          disabled={submitting}
                          sx={{ color: '#0f172a', p: 0.5 }}
                        >
                          <AddCircleOutlinedIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Box>

                      <Typography sx={{ fontWeight: 700, color: '#0f172a', textAlign: 'right', fontSize: '0.95rem' }}>
                        ₹{rowSubtotal.toFixed(2)}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={() => handleRemoveRow(index)}
                        disabled={submitting || rows.length === 1}
                        sx={{
                          color: '#94a3b8',
                          p: 0.5,
                          '&:hover': { color: '#ef4444' },
                        }}
                      >
                        <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                  )
                })}
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderRadius: '16px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                mt: 'auto',
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                  Total Items: <strong>{validRows.reduce((sum, r) => sum + r.quantity, 0)}</strong>
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  All taxes and hospital discounts included
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Grand Total
                </Typography>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                  ₹{grandTotal.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 2, pt: 1, pb: 1, gap: 1, borderTop: '1px solid #f1f5f9' }}>
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
              disabled={submitting || validRows.length === 0}
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
              {submitting ? <CircularProgress size={20} sx={{ color: '#ffffff' }} /> : (isEditing ? 'Update Sale' : 'Complete & Save Sale')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <AddPatientDialog
        open={addPatientModalOpen}
        onClose={() => setAddPatientModalOpen(false)}
        onPatientAdded={handlePatientAdded}
      />
    </>
  )
}

export default CreateSaleDialog
