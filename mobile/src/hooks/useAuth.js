import { useState, useEffect, createContext, useContext } from 'react'
import * as SecureStore from 'expo-secure-store'
import { router } from 'expo-router'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync('token').then(async token => {
      if (token) {
        try {
          const { data } = await client.get('/auth/me')
          setUser(data)
        } catch {
          await SecureStore.deleteItemAsync('token')
        }
      }
      setLoading(false)
    })
  }, [])

  async function login(email, password) {
    const { data } = await client.post('/auth/login', { email, password })
    await SecureStore.setItemAsync('token', data.token)
    setUser(data.user)
    router.replace('/(tabs)')
  }

  async function logout() {
    await SecureStore.deleteItemAsync('token')
    setUser(null)
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
