import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Alert,
  Avatar,
} from '@mui/material'

import { Eye, Mail, Check, RefreshCw } from 'lucide-react'
import { adminApi, recruiterApi } from '../../services/api'
import type { Assessment } from '../../types'

type StatusFilter =
  | 'all'
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'reviewed'

type RecFilter = 'all' | 'pass' | 'review' | 'fail'

const STATUS_STYLES: Record<string, any> = {
  assigned: {
    bgcolor: '#1a1a1a',
    color: '#facc15',
    border: '1px solid #3a3a3a',
  },
  in_progress: {
    bgcolor: '#1a1a1a',
    color: '#38bdf8',
    border: '1px solid #3a3a3a',
  },
  submitted: {
    bgcolor: '#1a1a1a',
    color: '#a78bfa',
    border: '1px solid #3a3a3a',
  },
  graded: {
    bgcolor: '#1a1a1a',
    color: '#fb7185',
    border: '1px solid #3a3a3a',
  },
  reviewed: {
    bgcolor: '#1a1a1a',
    color: '#4ade80',
    border: '1px solid #3a3a3a',
  },
}

const REC_STYLES: Record<string, any> = {
  pass: {
    bgcolor: '#102014',
    color: '#4ade80',
    border: '1px solid #1f3a28',
  },
  fail: {
    bgcolor: '#2a1111',
    color: '#fb7185',
    border: '1px solid #4a1d1d',
  },
  review: {
    bgcolor: '#2a2412',
    color: '#facc15',
    border: '1px solid #4a3f1d',
  },
}

export default function Assignments() {
  const navigate = useNavigate()

  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [domains, setDomains] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all')

  const [recFilter, setRecFilter] =
    useState<RecFilter>('all')

  const [domainFilter, setDomainFilter] = useState('all')

  const [sendingId, setSendingId] = useState<string | null>(null)
  const [sentId, setSentId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)

    try {
      const [{ domains: ds }, { assessments: as }] =
        await Promise.all([
          adminApi.getDomains(),
          adminApi.getAssignments({ limit: 500 }),
        ])

      setDomains(
        ds.reduce(
          (acc, d) => ({ ...acc, [d.id]: d.name }),
          {} as Record<string, string>
        )
      )

      setAssessments(as)
    } catch (err: any) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSendLink = async (id: string) => {
    setSendingId(id)

    try {
      await recruiterApi.sendTestLink(id)

      setSentId(id)

      setTimeout(() => {
        setSentId((c) => (c === id ? null : c))
      }, 3000)
    } catch {}

    setSendingId(null)
  }

  const filtered = assessments.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter)
      return false

    if (
      recFilter !== 'all' &&
      a.ai_recommendation !== recFilter
    )
      return false

    if (
      domainFilter !== 'all' &&
      a.domain_id !== domainFilter
    )
      return false

    return true
  })

  return (
    <Box sx={{ p: 3, background: '#000', minHeight: '100vh' }}>
      {/* HEADER */}

      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 28,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            Assessments
          </Typography>

          <Typography
            sx={{
              fontSize: 13,
              color: '#777',
              mt: 0.5,
            }}
          >
            Manage and review expert assessments
          </Typography>
        </Box>

        <Tooltip title="Refresh">
          <IconButton
            onClick={load}
            sx={{
              border: '1px solid #222',
              color: '#aaa',
              background: '#0a0a0a',

              '&:hover': {
                background: '#111',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={16} />
            ) : (
              <RefreshCw size={16} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* MAIN CARD */}

      <Card
        sx={{
          background: '#050505',
          border: '1px solid #1a1a1a',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: 'none',
        }}
      >
        {/* FILTERS */}

        <Box
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
            borderBottom: '1px solid #1a1a1a',
          }}
        >
          {[{
            label: 'Status',
            value: statusFilter,
            set: setStatusFilter,
            items: [
              'all',
              'assigned',
              'in_progress',
              'submitted',
              'graded',
              'reviewed',
            ],
          },
          {
            label: 'Recommendation',
            value: recFilter,
            set: setRecFilter,
            items: ['all', 'pass', 'fail', 'review'],
          }].map((f) => (
            <FormControl
              key={f.label}
              size="small"
              sx={{
                minWidth: 150,

                '& .MuiOutlinedInput-root': {
                  background: '#0b0b0b',
                  color: '#fff',
                  fontSize: 13,
                  borderRadius: 2,

                  '& fieldset': {
                    borderColor: '#222',
                  },

                  '&:hover fieldset': {
                    borderColor: '#333',
                  },

                  '&.Mui-focused fieldset': {
                    borderColor: '#444',
                  },
                },

                '& .MuiInputLabel-root': {
                  color: '#666',
                  fontSize: 13,
                },

                '& .MuiSvgIcon-root': {
                  color: '#888',
                },
              }}
            >
              <InputLabel>{f.label}</InputLabel>

              <Select
                value={f.value}
                label={f.label}
                onChange={(e) =>
                  f.set(e.target.value as any)
                }
              >
                {f.items.map((x) => (
                  <MenuItem key={x} value={x}>
                    {x.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}

          <Typography
            sx={{
              ml: 'auto',
              fontSize: 12,
              color: '#777',
            }}
          >
            {filtered.length} assessments
          </Typography>
        </Box>

        {/* TABLE */}

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow
                sx={{
                  background: '#090909',
                }}
              >
                {[
                  'Expert',
                  'Domain',
                  'Status',
                  'Score',
                  'Recommendation',
                  'Assigned',
                  'Actions',
                ].map((head) => (
                  <TableCell
                    key={head}
                    sx={{
                      color: '#666',
                      fontSize: 11,
                      fontWeight: 700,
                      borderBottom: '1px solid #1a1a1a',
                    }}
                    align={
                      head === 'Actions'
                        ? 'center'
                        : 'left'
                    }
                  >
                    {head}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 6 }}
                  >
                    <CircularProgress size={26} />
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow
                    key={a.id}
                    sx={{
                      '&:hover': {
                        background: '#0a0a0a',
                      },
                    }}
                  >
                    {/* EXPERT */}

                    <TableCell
                      sx={{
                        borderBottom:
                          '1px solid #111',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 30,
                            height: 30,
                            bgcolor: '#111827',
                            color: '#60a5fa',
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {(a.expert?.full_name || '?')
                            .charAt(0)
                            .toUpperCase()}
                        </Avatar>

                        <Box>
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#fff',
                            }}
                          >
                            {a.expert?.full_name}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: 11,
                              color: '#666',
                            }}
                          >
                            {a.expert?.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* DOMAIN */}

                    <TableCell
                      sx={{
                        color: '#ccc',
                        fontSize: 12,
                        borderBottom:
                          '1px solid #111',
                      }}
                    >
                      {domains[a.domain_id] || '—'}
                    </TableCell>

                    {/* STATUS */}

                    <TableCell
                      sx={{
                        borderBottom:
                          '1px solid #111',
                      }}
                    >
                      <Chip
                        label={a.status.replace('_', ' ')}
                        size="small"
                        sx={{
                          ...STATUS_STYLES[a.status],
                          fontSize: 11,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>

                    {/* SCORE */}

                    <TableCell
                      sx={{
                        borderBottom:
                          '1px solid #111',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#fff',
                        }}
                      >
                        {a.total_score !== null
                          ? `${a.total_score}/${a.max_possible_score}`
                          : '—'}
                      </Typography>
                    </TableCell>

                    {/* RECOMMEND */}

                    <TableCell
                      sx={{
                        borderBottom:
                          '1px solid #111',
                      }}
                    >
                      {a.ai_recommendation ? (
                        <Chip
                          label={a.ai_recommendation}
                          size="small"
                          sx={{
                            ...REC_STYLES[
                              a.ai_recommendation
                            ],
                            fontSize: 11,
                          }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            color: '#555',
                            fontSize: 11,
                          }}
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* DATE */}

                    <TableCell
                      sx={{
                        color: '#888',
                        fontSize: 12,
                        borderBottom:
                          '1px solid #111',
                      }}
                    >
                      {a.assigned_at
                        ? new Date(
                            a.assigned_at
                          ).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              year: '2-digit',
                            }
                          )
                        : '—'}
                    </TableCell>

                    {/* ACTIONS */}

                    <TableCell
                      align="center"
                      sx={{
                        borderBottom:
                          '1px solid #111',
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <Button
                          size="small"
                          startIcon={<Eye size={13} />}
                          onClick={() =>
                            navigate(
                              `/admin/assessments/${a.id}`
                            )
                          }
                          sx={{
                            background: '#111827',
                            color: '#60a5fa',
                            border:
                              '1px solid #1e293b',
                            textTransform: 'none',
                            fontSize: 11,
                            px: 1.5,

                            '&:hover': {
                              background: '#172033',
                            },
                          }}
                        >
                          View
                        </Button>

                        {(a.status === 'assigned' ||
                          a.status ===
                            'in_progress') && (
                          <Button
                            size="small"
                            startIcon={
                              sentId === a.id ? (
                                <Check size={13} />
                              ) : (
                                <Mail size={13} />
                              )
                            }
                            disabled={
                              sendingId === a.id
                            }
                            onClick={() =>
                              handleSendLink(a.id)
                            }
                            sx={{
                              background: '#101010',
                              color:
                                sentId === a.id
                                  ? '#4ade80'
                                  : '#aaa',
                              border:
                                '1px solid #222',
                              textTransform:
                                'none',
                              fontSize: 11,
                              px: 1.5,

                              '&:hover': {
                                background:
                                  '#181818',
                              },
                            }}
                          >
                            {sentId === a.id
                              ? 'Sent'
                              : 'Email'}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  )
}