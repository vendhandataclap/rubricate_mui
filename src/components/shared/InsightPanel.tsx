import {
  Box, Card, CardContent, Typography, Avatar, Chip, LinearProgress,
  Divider, Button, Skeleton, alpha, useTheme, Stack,
} from '@mui/material'
import { ArrowUpRight } from 'lucide-react'
import type { ElementType } from 'react'

export interface InsightItem {
  id: string
  title: string
  subtitle?: string
  value?: string | number
  badge?: string
  badgeColor?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  progress?: number
  progressColor?: string
  avatarText?: string
  avatarColor?: string
  icon?: ElementType
  iconColor?: string
  meta?: string
}

interface InsightPanelProps {
  title: string
  subtitle?: string
  items: InsightItem[]
  loading?: boolean
  onViewAll?: () => void
  viewAllLabel?: string
  headerIcon?: ElementType
  headerColor?: string
  emptyMessage?: string
  maxItems?: number
}

export default function InsightPanel({
  title, subtitle, items, loading = false, onViewAll,
  viewAllLabel = 'View All', headerIcon: HeaderIcon, headerColor,
  emptyMessage = 'No data available', maxItems = 6,
}: InsightPanelProps) {
  const theme = useTheme()
  const hc = headerColor || theme.palette.primary.main
  const displayItems = items.slice(0, maxItems)

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(hc, 0.04),
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          {HeaderIcon && (
            <Box sx={{ p: 0.7, borderRadius: 1.5, bgcolor: alpha(hc, 0.12), color: hc, display: 'flex' }}>
              <HeaderIcon size={15} />
            </Box>
          )}
          <Box>
            <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 700 }}>{title}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
        </Box>
        {onViewAll && (
          <Button size="small" endIcon={<ArrowUpRight size={13} />} onClick={onViewAll}
            sx={{ fontSize: 11, color: hc, minWidth: 0, px: 1, '&:hover': { bgcolor: alpha(hc, 0.08) } }}>
            {viewAllLabel}
          </Button>
        )}
      </Box>

      {/* Items */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <Stack spacing={0}>
            {[...Array(4)].map((_, i) => (
              <Box key={i} sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="40%" height={12} />
                  </Box>
                  <Skeleton variant="rounded" width={40} height={20} />
                </Box>
              </Box>
            ))}
          </Stack>
        ) : displayItems.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />}>
            {displayItems.map((item) => {
              const ItemIcon = item.icon
              const ac = item.avatarColor || hc
              const pc = item.progressColor || hc
              return (
                <Box key={item.id} sx={{
                  px: 2.5, py: 1.4,
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: theme.palette.action.hover },
                }}>
                  {/* Avatar or Icon */}
                  {item.avatarText ? (
                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(ac, 0.15), color: ac, fontSize: 11, fontWeight: 700, borderRadius: 1.5, flexShrink: 0 }}>
                      {item.avatarText}
                    </Avatar>
                  ) : ItemIcon ? (
                    <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(item.iconColor || hc, 0.12), color: item.iconColor || hc, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ItemIcon size={15} />
                    </Box>
                  ) : null}

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap color="text.primary" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                    {item.subtitle && <Typography variant="caption" color="text.secondary" noWrap>{item.subtitle}</Typography>}
                    {item.progress !== undefined && (
                      <LinearProgress variant="determinate" value={Math.min(item.progress, 100)}
                        sx={{ mt: 0.5, height: 3, borderRadius: 2, bgcolor: alpha(pc, 0.12), '& .MuiLinearProgress-bar': { bgcolor: pc, borderRadius: 2 } }} />
                    )}
                  </Box>

                  {/* Right side */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.3, flexShrink: 0 }}>
                    {item.value !== undefined && (
                      <Typography variant="caption" color="text.primary" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                    )}
                    {item.badge && (
                      <Chip label={item.badge} size="small" color={item.badgeColor || 'default'}
                        sx={{ height: 18, fontSize: 10, fontWeight: 700 }} />
                    )}
                    {item.meta && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{item.meta}</Typography>
                    )}
                  </Box>
                </Box>
              )
            })}
          </Stack>
        )}
      </Box>
    </Card>
  )
}
