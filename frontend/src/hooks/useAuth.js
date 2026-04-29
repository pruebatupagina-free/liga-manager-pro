import { useState, useEffect, useCallback } from 'react'
import client from '../api/client'

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]))
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
      return null
    }
    return payload
  })

  const login = useCallback((token) => {
    localStorage.setItem('token', token)
    setUser(parseJwt(token))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
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

  return { user, login, logout, isAuthenticated: !!user }
}
