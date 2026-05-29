import { Outlet } from 'react-router-dom'
import { Box, Container, useTheme } from '@mui/material'
import SideMenu from './SideMenu'

const DRAWER_WIDTH = 260

export default function AdminLayout() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
      }}
    >
      {/* Sidebar */}
      <SideMenu />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: theme.palette.background.default,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Page Content with padding */}
        <Container maxWidth="xl" sx={{ flex: 1, py: 4, px: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}

