import { useEffect, useState } from 'react'
import { api } from './apiClient'
import { clearTokens, getAccessToken } from './auth'

export type Me = {
  id: number
  email: string
  nickname: string
  role: string
}

export function useAuth() {
  const [me, setMe] = useState<Me | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (!getAccessToken()) {
      setAuthChecked(true)
      return
    }
    api
      .get<Me>('/api/auth/me')
      .then(setMe)
      .catch(() => clearTokens())
      .finally(() => setAuthChecked(true))
  }, [])

  const logout = () => {
    clearTokens()
    setMe(null)
  }

  return { me, authChecked, logout }
}
