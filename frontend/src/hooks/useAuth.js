import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function loadUserData() {
  try {
    const raw = localStorage.getItem('userData')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token')
    if (!token) return null
    const payload = parseJwt(token)
    if (!payload || payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      localStorage.removeItem('userData')
      return null
    }
    return payload
  })

  const [userFull, setUserFull] = useState(loadUserData)

  const login = useCallback((token, userData) => {
    localStorage.setItem('token', token)
    setUser(parseJwt(token))
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData))
      setUserFull(userData)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    setUser(null)
    setUserFull(null)
  }, [])

  // Ping every 60 seconds
  useEffect(() => {
    if (!user) return
    const isMobile = /Mobi|Android/i.test(navigator.userAgent)
    const sendPing = () => {
      client.post('/auth/ping', { dispositivo: isMobile ? 'mobile' : 'desktop' }).catch(() => {})
    }
    sendPing()
    const interval = setInterval(sendPing, 60_000)
    return () => clearInterval(interval)
  }, [user])

  return { user, userFull, login, logout, isAuthenticated: !!user }
}
