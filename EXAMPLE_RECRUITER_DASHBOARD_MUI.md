# Example: Converting Recruiter Dashboard to MUI

This is an example conversion template for `/src/pages/recruiter/Dashboard.tsx`.
Use this as a reference for converting other similar components.

## Key Changes

1. **Stats Grid** → MUI Grid + Card
2. **Tab/Pill Buttons** → MUI Tabs or ToggleButtonGroup
3. **Table Layout** → MUI Table or custom Grid layout
4. **Empty State** → MUI Box with Typography

## Template Structure

```typescript
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from '@mui/material'
import {
  ClipboardCheck,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { recruiterApi, adminApi } from '../../services/api'
import type { Assessment, Expert } from '../../types'

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
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[8],
            }
          : {},
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
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {label}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function RecruiterDashboard() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<'recent' | 'completed'>('recent')
  const [experts, setExperts] = useState<Expert[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      recruiterApi
        .getExperts()
        .then(({ experts }) => setExperts(experts))
        .catch((err) => console.error('Failed to load experts', err)),
      recruiterApi
        .getAssessments({ status: 'graded,reviewed', limit: 100 })
        .then((r) => setAssessments(r.assessments))
        .catch((err) => console.error('Failed to load assessments', err)),
    ]).finally(() => setLoading(false))
  }, [])

  const stats = {
    pendingReview: assessments.filter((a) => a.status === 'graded').length,
    completedReviews: assessments.filter((a) => a.status === 'reviewed').length,
    totalAssessments: assessments.length,
    passRate: (() => {
      const g = assessments.filter((a) => a.ai_recommendation)
      return g.length
        ? Math.round((g.filter((a) => a.ai_recommendation === 'pass').length / g.length) * 100)
        : 0
    })(),
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Recruiter Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Review assessments and manage expert applications
            {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
          </Typography>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Clock size={24} />}
            label="Pending Review"
            value={stats.pendingReview}
            color="error"
            onClick={() => navigate('/recruiter/assignments')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CheckCircle size={24} />}
            label="Completed Reviews"
            value={stats.completedReviews}
            color="success"
            onClick={() => navigate('/recruiter/assignments')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ClipboardCheck size={24} />}
            label="Total Assessments"
            value={stats.totalAssessments}
            color="primary"
            onClick={() => navigate('/recruiter/assignments')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<TrendingUp size={24} />}
            label="Pass Rate"
            value={`${stats.passRate}%`}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Tab
            label={`Recent Applications (${experts.length})`}
            value="recent"
            icon={<Users size={18} />}
            iconPosition="start"
          />
          <Tab
            label={`Completed Assessments (${assessments.length})`}
            value="completed"
            icon={<ClipboardCheck size={18} />}
            iconPosition="start"
          />
        </Tabs>

        <CardContent>
          {activeTab === 'recent' && (
            <RecentApplicationsTab experts={experts} />
          )}
          {activeTab === 'completed' && (
            <CompletedAssessmentsTab assessments={assessments} />
          )}
        </CardContent>
      </Card>
    </Container>
  )
}

// Sub-component: Recent Applications
function RecentApplicationsTab({ experts }: { experts: Expert[] }) {
  if (experts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          No pending applications
        </Typography>
        <Typography variant="body2" color="textSecondary">
          All expert applications have been processed.
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {experts.map((expert) => (
            <TableRow key={expert.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {expert.full_name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{expert.email}</Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={expert.onboarding_status?.replace(/_/g, ' ')}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">
                <Button size="small" variant="outlined">
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// Sub-component: Completed Assessments
function CompletedAssessmentsTab({ assessments }: { assessments: Assessment[] }) {
  if (assessments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          No completed assessments
        </Typography>
        <Typography variant="body2" color="textSecondary">
          No graded or reviewed assessments yet.
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
            <TableCell>Expert</TableCell>
            <TableCell>Score</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Recommendation</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assessments.map((assessment) => (
            <TableRow key={assessment.id} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {assessment.expert?.full_name || 'Unknown'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{assessment.percentage ?? '—'}%</Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={assessment.status}
                  size="small"
                  color={assessment.status === 'reviewed' ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell>
                {assessment.ai_recommendation && (
                  <Chip
                    label={assessment.ai_recommendation}
                    size="small"
                    color={assessment.ai_recommendation === 'pass' ? 'success' : 'error'}
                    variant="outlined"
                  />
                )}
              </TableCell>
              <TableCell align="right">
                <Button size="small" variant="outlined">
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
```

## Key Techniques Used

1. **StatCard Component**: Reusable component with proper theming
2. **Tabs**: Use MUI Tabs instead of custom buttons
3. **Table**: Use MUI Table for displaying data
4. **Grid**: Responsive grid layout
5. **useTheme Hook**: Access theme colors and styles
6. **Conditional Rendering**: Show empty states
7. **Proper Typography**: Use MUI Typography for all text

## Apply This Pattern To:
- `/src/pages/admin/Assignments.tsx`
- `/src/pages/admin/CompanyUsers.tsx`
- `/src/pages/admin/QuestionList.tsx`
- `/src/pages/recruiter/Assignments.tsx`
- Any other page with tables or grids
