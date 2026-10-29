import { useState } from 'react'
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
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import { createPatientApi } from '../api/patients'

function AddPatientDialog({ open, onClose, onPatientAdded }) {
  const [name, setName] = useState('')
  const [mobileNumber, setMobileNumber] = useState('')
  const [wardNumber, setWardNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Patient name is required')
      return
    }

    try {
      setLoading(true)
      const newPatient = await createPatientApi({
        name: trimmedName,
        mobile_number: mobileNumber.trim(),
        ward_number: wardNumber.trim(),
      })

      handleClose()
      if (onPatientAdded) {
        onPatientAdded(newPatient)
      }
    } catch (err) {
      setError(err.message || 'Failed to save patient')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setName('')
    setMobileNumber('')
    setWardNumber('')
    setError('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          p: 2,
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
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
          px: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
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
            <PersonAddAlt1OutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
              Add Hospital Patient
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Register regular inpatient for counter billing
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={handleClose} disabled={loading} size="small" sx={{ color: '#94a3b8' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 1, py: 1.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: '12px', fontSize: '0.85rem' }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            required
            autoFocus
            label="Patient Full Name"
            placeholder="e.g. Anita Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Mobile Number (Optional)"
            placeholder="e.g. 9876543210"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Ward / Bed / Room No."
            placeholder="e.g. Ward 4B - Bed 12"
            value={wardNumber}
            onChange={(e) => setWardNumber(e.target.value)}
            disabled={loading}
          />
        </DialogContent>

        <DialogActions sx={{ px: 1, pt: 1, pb: 0.5, gap: 1 }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              color: '#475569',
              borderColor: '#cbd5e1',
              px: 2,
              '&:hover': { borderColor: '#94a3b8', backgroundColor: '#f8fafc' },
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={loading || !name.trim()}
            variant="contained"
            sx={{
              borderRadius: '12px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              px: 3,
              py: 0.9,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.18)',
              '&:hover': { backgroundColor: '#1e293b' },
            }}
          >
            {loading ? <CircularProgress size={18} sx={{ color: '#ffffff' }} /> : 'Save Patient'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AddPatientDialog
