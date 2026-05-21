/**
 * Auth context for the Rubricate platform.
 *
 * Stores user/token in localStorage and exposes
 * login(), logout(), and current-user state to the entire app.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { API_BASE_URL } from './env'

// ---------- Types ----------

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

// ---------- Storage helpers ----------

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

// ---------- Context ----------

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage()
    if (stored) {
      setState({
        user: stored.user,
        token: stored.token,
        isAuthenticated: true,
        isLoading: false,
      })
    } else {
      setState(s => ({ ...s, isLoading: false }))
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string, role: UserRole) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Login failed')
      }
      const { user, accessToken } = body.data
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        role: user.role as UserRole,
      }
      saveToStorage(authUser, accessToken)
      setState({
        user: authUser,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      })
    },
    [],
  )

  const logout = useCallback(() => {
    clearStorage()
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false })
  }, [])

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
