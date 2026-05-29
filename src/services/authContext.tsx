import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { DIRECTUS_URL } from './env'

export type UserRole = 'admin' | 'recruiter' | 'expert'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
}

const STORAGE_KEY = 'rubricate_auth'

function loadFromStorage(): { user: AuthUser; token: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToStorage(user: AuthUser, token: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }))
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    const stored = loadFromStorage()
    if (stored) {
      setState({ user: stored.user, token: stored.token, isAuthenticated: true, isLoading: false })
    } else {
      setState(s => ({ ...s, isLoading: false }))
    }
  }, [])

  const login = useCallback(async (email: string, password: string, _role: UserRole) => {
    // Step 1: authenticate against Directus
    const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const body = await res.json()
    if (!res.ok) {
      const msg = body?.errors?.[0]?.message || 'Login failed'
      throw new Error(msg)
    }

    const accessToken: string = body.data.access_token

    // Step 2: fetch user profile
    const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id,email,first_name,last_name,role.name`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const meBody = await meRes.json()
    if (!meRes.ok) throw new Error('Failed to fetch user profile')

    const me = meBody.data
    const roleName = (typeof me.role === 'object' ? me.role?.name : me.role) || ''

    // Map Directus role name to app role
    let appRole: UserRole = 'expert'
    const rn = roleName.toLowerCase()
    if (rn.includes('admin') || email.toLowerCase() === 'admin@gmail.com') appRole = 'admin'
    else if (rn.includes('recruit')) appRole = 'recruiter'

    const authUser: AuthUser = {
      id: me.id,
      email: me.email,
      firstName: me.first_name || '',
      lastName: me.last_name || '',
      role: appRole,
    }

    saveToStorage(authUser, accessToken)
    setState({ user: authUser, token: accessToken, isAuthenticated: true, isLoading: false })
  }, [])

  const logout = useCallback(() => {
    clearStorage()
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
