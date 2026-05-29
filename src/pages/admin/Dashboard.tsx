import { Box, Typography, Card, CardContent, Chip, Stack } from '@mui/material'
import {
  TrendingUp, TrendingDown, Users, ClipboardList, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
import { BarChart } from '@mui/x-charts/BarChart'
import { LineChart } from '@mui/x-charts/LineChart'
 
const assessmentData = [12, 18, 15, 22, 28, 25, 30, 35, 32, 40, 38, 46]
const passRateData   = [20, 25, 22, 30, 28, 34, 32, 36, 33, 38, 35, 34]
const pendingData    = [30, 28, 35, 32, 40, 38, 42, 45, 48, 50, 47, 46]
const usersData      = [60, 70, 65, 80, 90, 85, 95, 100, 110, 115, 120, 128]
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
 
// ── colours ──────────────────────────────────────────────────────────────────
const BG      = '#000000'
const SURFACE = '#0d0d0d'
const BORDER  = '#1f1f1f'
const TEXT    = '#f0f0f0'
const MUTED   = '#6b7280'
 
interface StatCardProps {
  value: string | number
  subtitle: string
  trend: string
  trendUp: boolean
  icon: React.ReactNode
  color: string
  data: number[]
}
 
function StatCard({ value, subtitle, trend, trendUp, icon, color, data }: StatCardProps) {
  return (
    <Card sx={{
      width: '100%',
      background: SURFACE,
      border: `1px solid ${BORDER}`,
      borderRadius: '12px',
      boxShadow: 'none',
      '&:hover': { borderColor: `${color}66`, transform: 'none', boxShadow: 'none' },
    }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* top row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography sx={{ color: MUTED, fontSize: 13, fontWeight: 500 }}>
            {subtitle}
          </Typography>
          <Chip
            icon={trendUp ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
            label={trend}
            size="small"
            sx={{
              height: 22, fontSize: 11, fontWeight: 700, border: 'none',
              backgroundColor: trendUp ? '#22c55e18' : '#ef444418',
              color: trendUp ? '#22c55e' : '#ef4444',
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        </Box>
 
        {/* value */}
        <Typography sx={{ fontSize: 36, fontWeight: 800, color: TEXT, lineHeight: 1, mb: 0.5 }}>
          {value}
        </Typography>
 
        {/* icon row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Box sx={{ p: 0.8, borderRadius: 1.5, backgroundColor: `${color}18`, color, display: 'flex' }}>
            {icon}
          </Box>
          <Typography sx={{ color: MUTED, fontSize: 11 }}>Last 30 days</Typography>
        </Box>
 
        {/* sparkline */}
        <SparkLineChart data={data} height={56} color={color} curve="natural" />
      </CardContent>
    </Card>
  )
}
 
export default function AdminDashboard() {
  return (
    <Box sx={{ background: BG, minHeight: '100vh', p: 3 }}>
 
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 800, color: TEXT, mb: 0.3 }}>
          Overview
        </Typography>
        <Typography sx={{ color: MUTED, fontSize: 13 }}>
          Welcome back! Here's your platform overview.
        </Typography>
      </Box>
 
      {/* ── 4 Stat Cards ── */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3 
      }}>
        {[
          { value: '62',  subtitle: 'Total Assessments', trend: '+18%', trendUp: true,  icon: <ClipboardList size={18}/>, color: '#3b82f6', data: assessmentData },
          { value: '46',  subtitle: 'Pending Review',    trend: '-2%',  trendUp: false, icon: <AlertCircle   size={18}/>, color: '#ef4444', data: pendingData    },
          { value: '64%', subtitle: 'Pass Rate',         trend: '+5%',  trendUp: true,  icon: <CheckCircle2  size={18}/>, color: '#22c55e', data: passRateData   },
          { value: '128', subtitle: 'Active Users',      trend: '+12%', trendUp: true,  icon: <Users         size={18}/>, color: '#a78bfa', data: usersData      },
        ].map((props) => (
          <StatCard key={props.subtitle} {...props} />
        ))}
      </Box>
 
      {/* ── Charts Row ── */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
        gap: 2,
        mb: 3 
      }}>
        {/* Line chart — 2/3 */}
        <Card sx={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', boxShadow: 'none', '&:hover': { transform: 'none', boxShadow: 'none' } }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Box>
                <Typography sx={{ color: MUTED, fontSize: 13, fontWeight: 500 }}>Sessions</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: 28, fontWeight: 800, color: TEXT }}>62</Typography>
                  <Chip label="+18%" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, backgroundColor: '#22c55e18', color: '#22c55e', border: 'none' }} />
                </Box>
                <Typography sx={{ color: MUTED, fontSize: 11 }}>Assessment submissions per month</Typography>
              </Box>
            </Box>
            <LineChart
              xAxis={[{ data: months, scaleType: 'point' }]}
              series={[{ data: assessmentData, area: true, color: '#3b82f6' }]}
              height={260}
              sx={{
                '& .MuiChartsAxis-tickLabel': { fill: MUTED, fontSize: 11 },
                '& .MuiChartsAxis-line': { stroke: BORDER },
                '& .MuiChartsAxis-tick': { stroke: BORDER },
                '& .MuiAreaElement-root': { fillOpacity: 0.15 },
              }}
            />
          </CardContent>
        </Card>

        {/* Bar chart — 1/3 */}
        <Card sx={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', boxShadow: 'none', '&:hover': { transform: 'none', boxShadow: 'none' } }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Typography sx={{ color: MUTED, fontSize: 13, fontWeight: 500 }}>Page views and downloads</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: 28, fontWeight: 800, color: TEXT }}>1.3M</Typography>
              <Chip label="-8%" size="small" sx={{ height: 22, fontSize: 11, fontWeight: 700, backgroundColor: '#ef444418', color: '#ef4444', border: 'none' }} />
            </Box>
            <Typography sx={{ color: MUTED, fontSize: 11, mb: 1 }}>Questions added for the last 6 months</Typography>
            <BarChart
              xAxis={[{ data: months.slice(6), scaleType: 'band' }]}
              series={[{ data: [8, 12, 11, 15, 13, 18], color: '#3b82f6' }]}
              height={260}
              sx={{
                '& .MuiChartsAxis-tickLabel': { fill: MUTED, fontSize: 11 },
                '& .MuiChartsAxis-line': { stroke: BORDER },
                '& .MuiChartsAxis-tick': { stroke: BORDER },
              }}
            />
          </CardContent>
        </Card>
      </Box>
      {/* ── Bottom Row ── */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2
      }}>
        {/* Recent Assessments */}
        <Card sx={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', boxShadow: 'none', '&:hover': { transform: 'none', boxShadow: 'none' } }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 14, mb: 2 }}>
              Recent Assessments
            </Typography>
            <Stack spacing={1}>
              {['React Fundamentals', 'Node Backend', 'System Design', 'TypeScript Advanced'].map(item => (
                <Box key={item} sx={{
                  px: 2, py: 1.2, borderRadius: '8px',
                  background: BG, border: `1px solid ${BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: '#3b82f644' },
                }}>
                  <Typography sx={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>{item}</Typography>
                  <Chip label="Active" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700, backgroundColor: '#3b82f618', color: '#3b82f6', border: 'none' }} />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card sx={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '12px', boxShadow: 'none', '&:hover': { transform: 'none', boxShadow: 'none' } }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Typography sx={{ color: TEXT, fontWeight: 700, fontSize: 14, mb: 2 }}>
              Performance Insights
            </Typography>
            <Stack spacing={1}>
              {[
                ['Completion Time',    '24 min', '#3b82f6'],
                ['Passing Candidates', '64%',    '#22c55e'],
                ['Average Score',      '72%',    '#a78bfa'],
                ['Active Assessments', '128',    '#f97316'],
              ].map(([label, value, color]) => (
                <Box key={label} sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  px: 2, py: 1.2, borderRadius: '8px',
                  background: BG, border: `1px solid ${BORDER}`,
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: '#ffffff11' },
                }}>
                  <Typography sx={{ color: MUTED, fontSize: 13 }}>{label}</Typography>
                  <Typography sx={{ color, fontSize: 14, fontWeight: 700 }}>{value}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}