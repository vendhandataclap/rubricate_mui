import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Button,
  useTheme,
} from '@mui/material'
import { LayoutDashboard, UserCircle2, LogOut, Users, ClipboardCheck } from 'lucide-react'
import { useAuth } from '../../services/authContext'
import ThemeToggle from './ThemeToggle'

const DRAWER_WIDTH = 280

export default function RecruiterLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/recruiter' },
    { label: 'Assessments', icon: ClipboardCheck, path: '/recruiter/assignments' },
    { label: 'Expert', icon: Users, path: '/recruiter/expert' },
  ]

  const isActive = (path: string) => {
    if (path === '/recruiter') return location.pathname === '/recruiter'
    return location.pathname.startsWith(path)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {/* Logo Section */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.25rem',
              color: theme.palette.primary.main,
            }}
          >
            Rubricate
          </Typography>
          <ThemeToggle iconOnly />
        </Box>

        {/* Role Badge */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: theme.palette.text.secondary,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Recruiter
          </Typography>
        </Box>

        {/* Navigation */}
        <List sx={{ flex: 1, px: 1 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => navigate(item.path)}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                color: isActive(item.path) ? theme.palette.primary.main : theme.palette.text.primary,
                backgroundColor: isActive(item.path)
                  ? `${theme.palette.primary.main}15`
                  : 'transparent',
                '&:hover': {
                  backgroundColor: isActive(item.path)
                    ? `${theme.palette.primary.main}25`
                    : theme.palette.action.hover,
                },
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}15`,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: `${theme.palette.primary.main}25`,
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: 'inherit',
                }}
              >
                <item.icon size={20} />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>

        <Divider />

        {/* Bottom Section */}
        <Box sx={{ p: 2 }}>
          <ListItemButton
            onClick={() => navigate('/recruiter/profile')}
            selected={isActive('/recruiter/profile')}
            sx={{
              borderRadius: 1,
              mb: 1.5,
              color: isActive('/recruiter/profile') ? theme.palette.primary.main : theme.palette.text.primary,
              backgroundColor: isActive('/recruiter/profile')
                ? `${theme.palette.primary.main}15`
                : 'transparent',
              '&:hover': {
                backgroundColor: isActive('/recruiter/profile')
                  ? `${theme.palette.primary.main}25`
                  : theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              <UserCircle2 size={20} />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItemButton>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: theme.palette.text.secondary,
              px: 1.5,
              mb: 1.5,
              wordBreak: 'break-all',
            }}
          >
            {user?.email}
          </Typography>

          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<LogOut size={16} />}
            onClick={handleLogout}
            sx={{
              textTransform: 'none',
              justifyContent: 'flex-start',
            }}
          >
            Sign Out
          </Button>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
