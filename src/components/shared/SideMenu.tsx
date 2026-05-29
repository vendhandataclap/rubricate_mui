import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Button,
} from '@mui/material'

import {
  LayoutDashboard,
  FileQuestion,
  FolderTree,
  Users,
  Zap,
  Building2,
  CheckCheck,
  ClipboardList,
  ChevronDown,
  Settings,
  Info,
  HelpCircle,
  MoreVertical,
  LogOut,
} from 'lucide-react'

import { useAuth } from '../../services/authContext'

const DRAWER_WIDTH = 185

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'Domains', icon: FolderTree, path: '/admin/domains' },
  { label: 'Question Bank', icon: FileQuestion, path: '/admin/questions' },
  { label: 'Experts', icon: Zap, path: '/admin/experts' },
  { label: 'Recruiters', icon: Users, path: '/admin/recruiters' },
  { label: 'Company Users', icon: Building2, path: '/admin/company-users' },
  { label: 'Assessments', icon: ClipboardList, path: '/admin/assignments' },
  { label: 'Completed Tasks', icon: CheckCheck, path: '/admin/completed-tasks' },
]

const NAV_BOTTOM = [
  { label: 'Settings', Icon: Settings },
  { label: 'About', Icon: Info },
  { label: 'Feedback', Icon: HelpCircle },
]

export default function SideMenu() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const isActive = (path: string) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path)

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,

        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          background: '#050505',
          borderRight: '1px solid #111',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* TOP LOGO */}
      <Box
        sx={{
          m: 1.2,
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          background: '#0f0f0f',
          border: '1px solid #1a1a1a',
          borderRadius: 2,
          cursor: 'pointer',

          '&:hover': {
            background: '#151515',
          },
        }}
        onClick={() => navigate('/admin')}
      >
        <Avatar
          sx={{
            bgcolor: '#ea580c',
            width: 24,
            height: 24,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          R
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
            }}
            noWrap
          >
            Rubricate
          </Typography>

          <Typography
            sx={{
              fontSize: 9,
              color: '#777',
            }}
            noWrap
          >
            Admin
          </Typography>
        </Box>

        <ChevronDown size={12} color="#777" />
      </Box>

      {/* SECTION TITLE */}
      <Typography
        sx={{
          px: 1.7,
          pt: 0.3,
          pb: 0.8,
          color: '#444',
          fontSize: 9,
          letterSpacing: 1.2,
          fontWeight: 700,
          textTransform: 'uppercase',
        }}
      >
        Administrator
      </Typography>

      {/* MAIN NAVIGATION */}
      <List
        sx={{
          px: 0.8,
          py: 0,
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {NAV.map(({ label, icon: Icon, path }) => {
          const active = isActive(path)

          return (
            <ListItemButton
              key={path}
              selected={active}
              onClick={() => navigate(path)}
              sx={{
                mb: 0.35,
                py: 0.55,
                px: 1,
                borderRadius: 2,
                minHeight: 34,

                color: active ? '#ffffff' : '#7a7a7a',

                backgroundColor: active
                  ? '#111111'
                  : 'transparent',

                transition: 'all 0.2s ease',

                '&:hover': {
                  backgroundColor: '#141414',
                  color: '#ffffff',
                },

                '&.Mui-selected': {
                  backgroundColor: '#111111',
                  color: '#ffffff',
                },

                '&.Mui-selected:hover': {
                  backgroundColor: '#171717',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: 'inherit',
                  minWidth: 26,
                }}
              >
                <Icon size={15} />
              </ListItemIcon>

              <ListItemText
                primary={label}
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: 11.5,
                      fontWeight: active ? 700 : 500,
                    },
                  },
                }}
              />
            </ListItemButton>
          )
        })}
      </List>

      {/* DIVIDER */}
      <Box
        sx={{
          mx: 1.5,
          borderTop: '1px solid #1a1a1a',
          my: 0.8,
        }}
      />

      {/* BOTTOM MENU */}
      <List sx={{ px: 0.8, py: 0 }}>
        {NAV_BOTTOM.map(({ label, Icon }) => (
          <ListItemButton
            key={label}
            sx={{
              mb: 0.2,
              py: 0.5,
              px: 1,
              borderRadius: 2,
              minHeight: 32,
              color: '#777',

              '&:hover': {
                backgroundColor: '#141414',
                color: '#fff',
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: 'inherit',
                minWidth: 26,
              }}
            >
              <Icon size={14} />
            </ListItemIcon>

            <ListItemText
              primary={label}
              slotProps={{
                primary: {
                  sx: {
                    fontSize: 11,
                    fontWeight: 500,
                  },
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>

      {/* FOOTER */}
      <Box
        sx={{
          px: 1.2,
          pb: 1.2,
          pt: 1,
          borderTop: '1px solid #1a1a1a',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Avatar
            sx={{
              bgcolor: '#ea580c',
              width: 26,
              height: 26,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            A
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
              }}
              noWrap
            >
              Admin
            </Typography>

            <Typography
              sx={{
                color: '#777',
                fontSize: 9,
              }}
              noWrap
            >
              admin@gmail.com
            </Typography>
          </Box>

          <MoreVertical
            color="#777"
            size={13}
            style={{
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
        </Box>

        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<LogOut size={12} />}
          onClick={() => {
            logout()
            navigate('/signin')
          }}
          sx={{
            fontSize: 10,
            fontWeight: 600,
            color: '#888',
            borderColor: '#222',
            textTransform: 'none',

            '&:hover': {
              borderColor: '#333',
              background: '#111',
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Drawer>
  )
}