import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Card, Chip, CircularProgress, Divider, FormControl,
  IconButton, InputAdornment, InputLabel, MenuItem, Pagination, Select,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography, alpha, useTheme, Checkbox, Alert,
} from '@mui/material'
import { Plus, Upload, Search, Archive, CheckCircle, RefreshCw } from 'lucide-react'
import { adminApi } from '../../services/api'
import type { Question, Domain } from '../../types'

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success', draft: 'warning', archived: 'default',
}


export default function QuestionList() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [search, setSearch] = useState('')
  const [domainFilter, setDomainFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [filterDomains, setFilterDomains] = useState<Domain[]>([])
  const [domainNames, setDomainNames] = useState<Record<string, string>>({})
  const [subNames, setSubNames] = useState<Record<string, string>>({})

  useEffect(() => {
    adminApi.getDomains().then(({ domains }) => setFilterDomains(domains)).catch(() => {})
  }, [])

  const fetchQuestions = useCallback(() => {
    setLoading(true); setError(null)
    adminApi.getQuestions({ domain: domainFilter || undefined, type: typeFilter || undefined, difficulty: tierFilter || undefined, status: statusFilter || undefined, search: search || undefined, page, limit: pageSize, per_page: pageSize, pagination: 1 })
      .then(({ questions: qs, total: t, domainNames: dn, subNames: sn }) => {
        setQuestions(qs); setTotal(t)
        setDomainNames(p => ({ ...p, ...dn }))
        setSubNames(p => ({ ...p, ...sn }))
        setSelected(new Set())
      })
      .catch(err => setError(err.message ?? 'Failed to load questions'))
      .finally(() => setLoading(false))
  }, [domainFilter, typeFilter, tierFilter, statusFilter, search, page, pageSize])

  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const toggleAll = () => setSelected(selected.size === questions.length ? new Set() : new Set(questions.map(q => q.id)))

  const bulkAction = async (action: 'activate' | 'archive') => {
    const ids = Array.from(selected)
    if (!ids.length) return
    setBulkLoading(true)
    try { await adminApi.bulkUpdate(ids, action); fetchQuestions() }
    catch (err: any) { alert(`Bulk ${action} failed: ${err.message}`) }
    finally { setBulkLoading(false) }
  }

  const onFilter = (setter: (v: string) => void) => (e: any) => { setter(e.target.value); setPage(1) }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>Question Bank</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage assessment questions across all domains</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Upload size={16} />} onClick={() => {}}>Import</Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => navigate('/admin/questions/new')}>New Question</Button>
        </Stack>
      </Box>

      <Card>
        {/* Filters */}
        <Box sx={{ p: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField size="small" placeholder="Search questions…" value={search} onChange={onFilter(setSearch)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment> } }}
            sx={{ minWidth: 220, flex: 1 }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Domain</InputLabel>
            <Select value={domainFilter} label="Domain" onChange={onFilter(setDomainFilter)}>
              <MenuItem value="">All Domains</MenuItem>
              {filterDomains.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} label="Type" onChange={onFilter(setTypeFilter)}>
              <MenuItem value="">All Types</MenuItem>
              {['open_text','comparison','error_identification','ranking','multiple_choice'].map(t => (
                <MenuItem key={t} value={t}>{t.replace(/_/g, ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Tier</InputLabel>
            <Select value={tierFilter} label="Tier" onChange={onFilter(setTierFilter)}>
              <MenuItem value="">All Tiers</MenuItem>
              {['no_experience','junior','mid','senior'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={onFilter(setStatusFilter)}>
              <MenuItem value="">All Status</MenuItem>
              {['draft','active','archived'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <Tooltip title="Refresh"><IconButton onClick={fetchQuestions} size="small"><RefreshCw size={16} /></IconButton></Tooltip>
        </Box>

        {/* Bulk Actions */}
        {selected.size > 0 && (
          <Box sx={{ px: 2, py: 1.2, bgcolor: alpha(theme.palette.primary.main, 0.08), display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selected.size} selected</Typography>
            <Button size="small" variant="outlined" startIcon={<Archive size={14} />} disabled={bulkLoading} onClick={() => bulkAction('archive')}>Archive</Button>
            <Button size="small" variant="outlined" color="success" startIcon={<CheckCircle size={14} />} disabled={bulkLoading} onClick={() => bulkAction('activate')}>Activate</Button>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"><Checkbox checked={selected.size === questions.length && questions.length > 0} indeterminate={selected.size > 0 && selected.size < questions.length} onChange={toggleAll} size="small" /></TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Subdomain</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Tier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Max Score</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : questions.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>No questions match your filters</TableCell></TableRow>
              ) : questions.map(q => (
                <TableRow key={q.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/questions/${q.id}/edit`)}>
                  <TableCell padding="checkbox" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)} size="small" />
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{domainNames[q.domain_id] || q.domain_id || '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{q.subdomain_id ? (subNames[q.subdomain_id] || q.subdomain_id) : '—'}</Typography></TableCell>
                  <TableCell>
                    <Chip label={q.question_type.replace(/_/g, ' ')} size="small"
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontWeight: 600, fontSize: 11 }} />
                  </TableCell>
                  <TableCell><Chip label={q.difficulty_tier} size="small" variant="outlined" /></TableCell>
                  <TableCell><Chip label={q.status} size="small" color={STATUS_COLOR[q.status] || 'default'} /></TableCell>
                  <TableCell align="center"><Typography variant="body2" sx={{ fontWeight: 600 }}>{q.max_score}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{q.created_at ? new Date(q.created_at).toLocaleDateString() : '—'}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            {loading ? 'Loading…' : `${total === 0 ? 0 : Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} of ${total} questions`}
          </Typography>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
        </Box>
      </Card>
    </Box>
  )
}
