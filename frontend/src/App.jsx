import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { AuthProvider } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import SalesPage from './pages/SalesPage'
import ReportsPage from './pages/ReportsPage'
import StockPage from './pages/StockPage'
import ItemsPage from './pages/ItemsPage'
import UserManagementPage from './pages/UserManagementPage'
import ProtectedRoute from './components/ProtectedRoute'

const theme = createTheme({
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: "'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14.5,
  },
  components: {
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.925rem',
          color: '#64748b',
          '&.Mui-focused': {
            color: '#0f172a',
            fontWeight: 500,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: '#f8fafc',
          fontSize: '0.95rem',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: '#ffffff',
          },
          '&.Mui-focused': {
            backgroundColor: '#ffffff',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e2e8f0',
            borderWidth: '1.5px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#cbd5e1',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0f172a',
            borderWidth: '1.5px',
          },
        },
        input: {
          padding: '13.5px 16px',
          fontSize: '0.95rem',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 22,
        },
      },
    },
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route
                path="/items"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <ItemsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'owner']}>
                    <UserManagementPage />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
