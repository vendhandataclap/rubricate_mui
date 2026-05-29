import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, Typography, Avatar, Chip, alpha, useTheme,
} from '@mui/material'
import { LayoutDashboard, UserCircle2, LogOut, Users, ClipboardCheck, Briefcase } from 'lucide-react'
import { useAuth } from '../../services/authContext'
import ThemeToggle from './ThemeToggle'

const DRAWER_WIDTH = 256

const NAV = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/recruiter' },
  { label: 'Assessments', icon: ClipboardCheck,  path: '/recruiter/assignments' },
  { label: 'Experts',     icon: Users,           path: '/recruiter/expert' },
]

export default function RecruiterLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const { logout, user } = useAuth()
  const isDark = theme.palette.mode === 'dark'

  const isActive = (path: string) =>
    path === '/recruiter' ? location.pathname === '/recruiter' : location.pathname.startsWith(path)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH, flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH, boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: `1px solid ${theme.palette.divider}`,
          display: 'flex', flexDirection: 'column',
          boxShadow: isDark ? '4px 0 24px rgba(0,0,0,0.3)' : '2px 0 8px rgba(0,0,0,0.06)',
        },
      }}>
        <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: 2, background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.4)}` }}>
              <Briefcase size={17} color="#fff" />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.03em', color: theme.palette.primary.main }}>
              Rubricate
            </Typography>
          </Box>
          <ThemeToggle iconOnly />
        </Box>

        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Chip label="Recruiter" size="small" sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', height: 22 }} />
        </Box>

        <List sx={{ flex: 1, px: 1, py: 0.5 }}>
          {NAV.map(({ label, icon: Icon, path }) => {
            const active = isActive(path)
            return (
              <ListItemButton key={path} onClick={() => navigate(path)} selected={active} sx={{
                borderRadius: 2, mb: 0.5, px: 1.5, py: 0.9,
                color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                bgcolor: active ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                border: `1px solid ${active ? alpha(theme.palette.primary.main, 0.25) : 'transparent'}`,
                '&:hover': { bgcolor: active ? alpha(theme.palette.primary.main, 0.15) : theme.palette.action.hover, color: active ? theme.palette.primary.main : theme.palette.text.primary },
                '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                '&.Mui-selected:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                transition: 'all 0.15s',
              }}>
                <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}><Icon size={17} /></ListItemIcon>
                <ListItemText primary={label} slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: active ? 700 : 500 } } }} />
              </ListItemButton>
            )
          })}
        </List>

        <Divider />

        <Box sx={{ p: 1.5 }}>
          <ListItemButton onClick={() => navigate('/recruiter/profile')} selected={isActive('/recruiter/profile')} sx={{
            borderRadius: 2, mb: 1, px: 1.5, py: 0.9,
            color: isActive('/recruiter/profile') ? theme.palette.primary.main : theme.palette.text.secondary,
            '&:hover': { bgcolor: theme.palette.action.hover },
            '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main },
          }}>
            <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}><UserCircle2 size={17} /></ListItemIcon>
            <ListItemText primary="Profile" slotProps={{ primary: { sx: { fontSize: 13.5, fontWeight: 500 } } }} />
          </ListItemButton>

          <Box sx={{ p: 1.5, borderRadius: 2, mb: 1, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 30, height: 30, bgcolor: theme.palette.primary.main, fontSize: 12, fontWeight: 700 }}>
              {(user?.email || 'R').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.primary" noWrap sx={{ display: 'block', fontWeight: 700 }}>{user?.firstName || 'Recruiter'}</Typography>
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }} noWrap>{user?.email}</Typography>
            </Box>
          </Box>

          <ListItemButton onClick={() => { logout(); navigate('/signin') }} sx={{
            borderRadius: 2, px: 1.5, py: 0.8, color: theme.palette.error.main,
            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
          }}>
            <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}><LogOut size={16} /></ListItemIcon>
            <ListItemText primary="Sign Out" slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 600 } } }} />
          </ListItemButton>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1, overflow: 'auto', bgcolor: 'background.default', minHeight: '100vh' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
