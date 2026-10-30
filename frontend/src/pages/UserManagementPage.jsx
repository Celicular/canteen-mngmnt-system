import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import AvatarBadge from '../components/AvatarBadge'
import UserTypeChip from '../components/UserTypeChip'
import CreateUserDialog from '../components/CreateUserDialog'
import { fetchUsersApi, deleteUserApi } from '../api/users'
import { useAuth } from '../context/AuthContext'

function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState(null)

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await fetchUsersApi()
      setUsers(data)
    } catch (err) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleDelete = async (username) => {
    if (!window.confirm(`Are you sure you want to delete user @${username}?`)) {
      return
    }

    setDeletingUser(username)
    setError('')
    setSuccessMsg('')

    try {
      await deleteUserApi(username)
      setSuccessMsg(`User @${username} was removed`)
      setUsers((prev) => prev.filter((u) => u.username !== username))
    } catch (err) {
      setError(err.message || 'Failed to delete user')
    } finally {
      setDeletingUser(null)
    }
  }

  const handleUserCreated = (newUser) => {
    setUsers((prev) => [...prev, newUser])
    setSuccessMsg(`User @${newUser.username} created successfully`)
  }

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.user_type?.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
              User Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem', mt: 0.25 }}>
              Create and manage staff accounts, roles (Worker, Owner, Admin), and professional avatars
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={() => setDialogOpen(true)}
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
            Add New User
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
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by name, username, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: { xs: '100%', sm: 340 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 8 }}>
              <CircularProgress size={32} sx={{ color: '#0f172a' }} />
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table sx={{ minWidth: 600 }}>
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '0.825rem', py: 1.5 }}>User</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '0.825rem', py: 1.5 }}>Username</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '0.825rem', py: 1.5 }}>User Type</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '0.825rem', py: 1.5 }}>Avatar Preset</TableCell>
                    <TableCell sx={{ color: '#475569', fontWeight: 600, fontSize: '0.825rem', py: 1.5, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const isSelf = currentUser?.username === u.username
                    const isPrimaryAdmin = u.username === 'admin'
                    const isDeleting = deletingUser === u.username

                    return (
                      <TableRow
                        key={u.username}
                        hover
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <TableCell sx={{ py: 1.75 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                            <AvatarBadge avatarId={u.avatar} size={42} />
                            <Box>
                              <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.925rem', lineHeight: 1.3 }}>
                                {u.full_name}
                              </Typography>
                              {isSelf && (
                                <Typography sx={{ color: '#059669', fontSize: '0.75rem', fontWeight: 600 }}>
                                  Current Session
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ color: '#475569', fontSize: '0.875rem' }}>
                          @{u.username}
                        </TableCell>

                        <TableCell>
                          <UserTypeChip type={u.user_type || u.role} />
                        </TableCell>

                        <TableCell sx={{ textTransform: 'capitalize', color: '#64748b', fontSize: '0.85rem' }}>
                          {u.avatar || 'executive'}
                        </TableCell>

                        <TableCell sx={{ textAlign: 'right' }}>
                          {isPrimaryAdmin ? (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', px: 1 }}>
                              Protected
                            </Typography>
                          ) : (
                            <Tooltip title={isSelf ? 'Cannot delete current account' : 'Delete user'}>
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(u.username)}
                                  disabled={isSelf || isDeleting}
                                  sx={{
                                    color: '#94a3b8',
                                    borderRadius: '8px',
                                    '&:hover': { color: '#ef4444', backgroundColor: '#fef2f2' },
                                  }}
                                >
                                  {isDeleting ? (
                                    <CircularProgress size={18} sx={{ color: '#ef4444' }} />
                                  ) : (
                                    <DeleteOutlinedIcon sx={{ fontSize: 20 }} />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                        No users match your query
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>

      <CreateUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onUserCreated={handleUserCreated}
      />
    </>
  )
}

export default UserManagementPage
