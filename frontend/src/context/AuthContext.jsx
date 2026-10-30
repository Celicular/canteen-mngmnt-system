import { createContext, useContext, useEffect, useState } from 'react'
import { fetchCurrentUserApi, loginApi, logoutApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savedUser, setSavedUser] = useState(() => {
    try {
      const stored = localStorage.getItem('canteen_saved_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    fetchCurrentUserApi()
      .then((data) => {
        setUser(data)
      })
      .catch(() => {
        localStorage.removeItem('canteen_access_token')
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  async function login({ username, password, saveUser = false, quickLogin = false }) {
    const data = await loginApi({ username, password, saveUser, quickLogin })
    setUser(data)
    if (saveUser) {
      const savedData = {
        username: data.username,
        full_name: data.full_name,
        avatar: data.avatar,
        user_type: data.user_type,
      }
      localStorage.setItem('canteen_saved_user', JSON.stringify(savedData))
      setSavedUser(savedData)
    }
    return data
  }

  async function logout() {
    await logoutApi()
    setUser(null)
  }

  function forgetSavedUser() {
    localStorage.removeItem('canteen_saved_user')
    setSavedUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        savedUser,
        login,
        logout,
        forgetSavedUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
