import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  useTheme,
  Stack,
  Container,
} from '@mui/material'
import {
  FileQuestion,
  CheckCircle,
  Globe,
  ClipboardList,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { adminApi, recruiterApi } from '../../services/api'
import type { DashboardStats, Question, Assessment } from '../../types'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  onClick?: () => void
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
}

function StatCard({ icon, label, value, onClick, color = 'primary' }: StatCardProps) {
  const theme = useTheme()

  const colorMap: Record<string, string> = {
    primary: theme.palette.primary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        } : {},
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              backgroundColor: `${colorMap[color]}20`,
              color: colorMap[color],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 0.5,
              }}
            >
              {value}
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
            >
              {label}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [stats, setStats] = useState<DashboardStats>({
    totalQuestions: 0,
    activeQuestions: 0,
    totalDomains: 0,
    totalAssessments: 0,
    pendingReview: 0,
    passRate: 0,
    avgScore: 0,
    flagRate: 0,
  })
  const [recentQuestions, setRecentQ] = useState<Question[]>([])
  const [recentAssessments, setRecentA] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      adminApi.getStats().then(setStats),
      adminApi
        .getQuestions({ limit: 3, status: 'active', page: 1 })
        .then((r) => setRecentQ(r.questions)),
      recruiterApi
        .getAssessments({ status: 'graded', limit: 3 })
        .then((r) => setRecentA(r.assessments)),
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Admin Dashboard
          </Typography>
          {loading && <CircularProgress size={24} />}
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Overview of your assessment platform
        </Typography>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<FileQuestion size={24} />}
            label="Total Questions"
            value={stats.totalQuestions}
            color="primary"
            onClick={() => navigate('/admin/questions')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<CheckCircle size={24} />}
            label="Active Questions"
            value={stats.activeQuestions}
            color="success"
            onClick={() => navigate('/admin/questions')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Globe size={24} />}
            label="Domains"
            value={stats.totalDomains}
            color="info"
            onClick={() => navigate('/admin/domains')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<ClipboardList size={24} />}
            label="Total Assessments"
            value={stats.totalAssessments}
            color="warning"
            onClick={() => navigate('/admin/assignments')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Clock size={24} />}
            label="Pending Review"
            value={stats.pendingReview}
            color="error"
            onClick={() => navigate('/admin/assignments')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<TrendingUp size={24} />}
            label="Pass Rate"
            value={`${stats.passRate}%`}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<TrendingUp size={24} />}
            label="Average Score"
            value={`${stats.avgScore}%`}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<AlertTriangle size={24} />}
            label="Flag Rate"
            value={`${stats.flagRate}%`}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Recent Data Grid */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Recent Questions
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Latest active questions in the bank
              </Typography>

              <Stack spacing={1}>
                {recentQuestions.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No active questions yet.
                  </Typography>
                ) : (
                  recentQuestions.map((q) => (
                    <Box
                      key={q.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.02)',
                        borderBottom:
                          recentQuestions.indexOf(q) !== recentQuestions.length - 1
                            ? `1px solid ${theme.palette.divider}`
                            : 'none',
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, mb: 0.25 }}
                        >
                          {q.question_type.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {(q as any)._domain_name || q.domain_id} · {q.difficulty_tier}
                        </Typography>
                      </Box>
                      <Chip
                        label={q.status}
                        size="small"
                        color={q.status === 'active' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                Assessment Activity
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Recent graded assessments awaiting review
              </Typography>

              <Stack spacing={1}>
                {recentAssessments.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No graded assessments yet.
                  </Typography>
                ) : (
                  recentAssessments.map((a) => (
                    <Box
                      key={a.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.02)',
                        borderBottom:
                          recentAssessments.indexOf(a) !== recentAssessments.length - 1
                            ? `1px solid ${theme.palette.divider}`
                            : 'none',
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, mb: 0.25 }}
                        >
                          {a.expert?.full_name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Score: {a.percentage ?? '—'}%
                        </Typography>
                      </Box>
                      {a.ai_recommendation && (
                        <Chip
                          label={a.ai_recommendation}
                          size="small"
                          color={
                            a.ai_recommendation === 'pass' ? 'success' : 'error'
                          }
                          variant="outlined"
                        />
                      )}
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
