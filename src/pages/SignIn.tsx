import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Container,
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
  useTheme,
} from '@mui/material'
import { BriefcaseBusiness, LogIn, Shield, Users } from 'lucide-react'
import { useAuth, type UserRole } from '../services/authContext'

export default function SignIn() {
  const { login, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const [searchParams] = useSearchParams()

  const returnUrl = sessionStorage.getItem('rubricate_return_url')
  const requestedRole = searchParams.get('role')
  const allowExpertSignIn = Boolean(returnUrl) || requestedRole === 'expert'

  // Clear any existing session when arriving from an assessment redirect
  useEffect(() => {
    if (returnUrl && isAuthenticated) {
      logout()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [role, setRole] = useState<UserRole>(allowExpertSignIn ? 'expert' : 'admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (requestedRole === 'admin' || requestedRole === 'recruiter') {
      setRole(requestedRole)
      return
    }
    if (requestedRole === 'expert' && allowExpertSignIn) {
      setRole('expert')
      return
    }
    if (allowExpertSignIn) {
      setRole('expert')
    }
  }, [allowExpertSignIn, requestedRole])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Email and password are required')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password, role)

      if (returnUrl) {
        sessionStorage.removeItem('rubricate_return_url')
        navigate(returnUrl, { replace: true })
      } else if (role === 'expert') {
        navigate('/signin?role=expert', { replace: true })
      } else {
        navigate(role === 'admin' ? '/admin' : '/recruiter', { replace: true })
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const getPlaceholder = () => {
    switch (role) {
      case 'admin':
        return 'admin@gmail.com'
      case 'recruiter':
        return 'recruiter@company.com'
      case 'expert':
        return 'candidate@company.com'
      default:
        return 'email@example.com'
    }
  }

  const getHint = () => {
    switch (role) {
      case 'admin':
        return 'Sign in with your Directus admin credentials.'
      case 'recruiter':
        return 'Use the credentials sent to your email after accepting the invitation.'
      case 'expert':
        return 'Use the credentials for the email address that received this assessment.'
      default:
        return ''
    }
  }

  const handleRoleChange = (_event: React.SyntheticEvent, newRole: string) => {
    setRole(newRole as UserRole)
    setError('')
  }

  const roleOptions = [
    { value: 'admin', label: 'Administrator', icon: Shield },
    { value: 'recruiter', label: 'Recruiter', icon: Users },
  ]

  if (allowExpertSignIn) {
    roleOptions.push({ value: 'expert', label: 'Expert', icon: BriefcaseBusiness })
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            p: 4,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 10px 30px rgba(0,0,0,0.5)'
              : '0 10px 30px rgba(0,0,0,0.1)',
          }}
        >
          {/* Logo */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              textAlign: 'center',
              mb: 0.5,
              color: theme.palette.primary.main,
            }}
          >
            Rubricate
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: theme.palette.text.secondary,
              mb: 2.5,
            }}
          >
            Sign in to your account
          </Typography>

          {/* Return URL Banner */}
          {returnUrl && (
            <Alert severity="info" sx={{ mb: 2.5 }}>
              Please sign in with the email assigned to this assessment.
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          {/* Role Tabs */}
          <Tabs
            value={role}
            onChange={handleRoleChange}
            variant="fullWidth"
            sx={{
              mb: 3,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                display: 'flex',
                gap: 1,
              },
            }}
          >
            {roleOptions.map((option) => {
              const Icon = option.icon
              return (
                <Tab
                  key={option.value}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Icon size={18} />
                      <span>{option.label}</span>
                    </Box>
                  }
                  value={option.value}
                />
              )
            })}
          </Tabs>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              placeholder={getPlaceholder()}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              margin="normal"
              variant="outlined"
              disabled={loading}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              margin="normal"
              variant="outlined"
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <LogIn size={20} />}
              sx={{
                mt: 3,
                mb: 2,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Box>

          {/* Hint */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: theme.palette.text.secondary,
              mt: 1,
            }}
          >
            {getHint()}
          </Typography>
        </Card>
      </Container>
    </Box>
  )
}
