import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Box, Card, CardContent, Typography, Chip, Skeleton, alpha, useTheme } from '@mui/material'

interface ChartDataPoint {
  label: string
  [key: string]: string | number
}

interface SeriesConfig {
  key: string
  label: string
  color?: string
}

interface AnalyticsChartProps {
  title: string
  subtitle?: string
  type: 'area' | 'bar'
  data: ChartDataPoint[]
  series: SeriesConfig[]
  loading?: boolean
  height?: number
  badge?: string
}

export default function AnalyticsChart({
  title, subtitle, type, data, series, loading = false, height = 220, badge,
}: AnalyticsChartProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    theme.palette.secondary.main,
  ]

  const resolvedSeries = series.map((s, i) => ({
    ...s,
    color: s.color || defaultColors[i % defaultColors.length],
  }))

  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 10,
    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
    color: theme.palette.text.primary,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
  }

  const axisStyle = {
    fontSize: 11,
    fill: theme.palette.text.secondary,
    fontFamily: theme.typography.fontFamily,
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 700 }}>{title}</Typography>
              {badge && (
                <Chip label={badge} size="small" color="primary" variant="outlined"
                  sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
              )}
            </Box>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {resolvedSeries.map(s => (
              <Box key={s.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {loading ? (
          <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 2 }} />
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {type === 'area' ? (
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  {resolvedSeries.map(s => (
                    <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.color} stopOpacity={isDark ? 0.3 : 0.2} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <ReTooltip contentStyle={tooltipStyle} cursor={{ stroke: theme.palette.divider }} />
                {resolvedSeries.map(s => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2.5}
                    fill={`url(#grad-${s.key})`}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: s.color }}
                  />
                ))}
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <ReTooltip contentStyle={tooltipStyle} cursor={{ fill: alpha(theme.palette.primary.main, 0.06) }} />
                {resolvedSeries.map(s => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    fill={s.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    fillOpacity={0.9}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
