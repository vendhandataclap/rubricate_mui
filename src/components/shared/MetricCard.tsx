import { Box, Card, CardContent, Typography, Skeleton, useTheme } from '@mui/material'
import type { ElementType } from 'react'

interface MetricCardProps {
  title: string
  value: number | string
  icon: ElementType
  color?: string
  loading?: boolean
  onClick?: () => void
  suffix?: string
}

export default function MetricCard({
  title, value, icon: Icon,
  color, loading = false, onClick, suffix = '',
}: MetricCardProps) {
  const theme = useTheme()
  const c = color || theme.palette.primary.main

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        transition: 'all 0.2s ease',
        '&:hover': onClick ? {
          transform: 'translateY(-3px)',
        } : {},
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Top row with icon */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: 2,
            bgcolor: c,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', flexShrink: 0,
          }}>
            <Icon size={24} />
          </Box>
        </Box>

        {/* Value */}
        {loading ? (
          <Skeleton variant="text" width="60%" height={40} />
        ) : (
          <Typography sx={{ fontSize: '26px', fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1, mb: 0.75 }}>
            {value}{suffix}
          </Typography>
        )}

        {/* Title */}
        {loading ? (
          <Skeleton variant="text" width="80%" height={16} />
        ) : (
          <Typography sx={{ fontSize: '13px', color: 'text.secondary', fontWeight: 500 }}>
            {title}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
