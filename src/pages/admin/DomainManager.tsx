import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Tooltip,
} from '@mui/material'

import {
  Plus,
  Edit2,
  Trash2,
  X,
  Globe,
  Tag,
} from 'lucide-react'

import { adminApi } from '../../services/api'
import type { Domain, Subdomain } from '../../types'

export default function DomainManager() {

  const [domains, setDomains] = useState<Domain[]>([])
  const [subdomains, setSubdomains] = useState<Subdomain[]>([])
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [domainDialog, setDomainDialog] =
    useState<{ open: boolean; editing?: Domain }>({ open: false })

  const [domainName, setDomainName] = useState('')
  const [domainDesc, setDomainDesc] = useState('')
  const [domainSaving, setDomainSaving] = useState(false)

  const [subDialog, setSubDialog] =
    useState<{ open: boolean; editing?: Subdomain }>({ open: false })

  const [subName, setSubName] = useState('')
  const [subDesc, setSubDesc] = useState('')
  const [subSaving, setSubSaving] = useState(false)

  const [deleteDomain, setDeleteDomain] = useState<Domain | null>(null)
  const [deleteSub, setDeleteSub] = useState<Subdomain | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)

    adminApi.getDomains()
      .then(({ domains: ds, subdomains: ss }) => {
        setDomains(ds)
        setSubdomains(ss)
      })
      .finally(() => setLoading(false))

  }, [])

  const openDomainForm = (d?: Domain) => {
    setDomainName(d?.name || '')
    setDomainDesc(d?.description || '')
    setDomainDialog({ open: true, editing: d })
  }

  const saveDomain = async () => {
    if (!domainName.trim()) return

    setDomainSaving(true)

    try {
      if (domainDialog.editing) {
        const updated = await adminApi.updateDomain(
          domainDialog.editing.id,
          domainName.trim(),
          domainDesc.trim()
        )

        setDomains(prev =>
          prev.map(d =>
            d.id === domainDialog.editing!.id ? updated : d
          )
        )
      } else {
        const created = await adminApi.createDomain(
          domainName.trim(),
          domainDesc.trim()
        )

        setDomains(prev => [...prev, created])
      }

      setDomainDialog({ open: false })

    } finally {
      setDomainSaving(false)
    }
  }

  const openSubForm = (s?: Subdomain) => {
    setSubName(s?.name || '')
    setSubDesc(s?.description || '')
    setSubDialog({ open: true, editing: s })
  }

  const saveSub = async () => {

    if (!subName.trim() || !selectedDomain) return

    setSubSaving(true)

    try {

      if (subDialog.editing) {

        const updated = await adminApi.updateSubdomain(
          subDialog.editing.id,
          subName.trim(),
          subDesc.trim()
        )

        setSubdomains(prev =>
          prev.map(s =>
            s.id === subDialog.editing!.id ? updated : s
          )
        )

      } else {

        const created = await adminApi.createSubdomain(
          selectedDomain,
          subName.trim(),
          subDesc.trim()
        )

        setSubdomains(prev => [...prev, created])
      }

      setSubDialog({ open: false })

    } finally {
      setSubSaving(false)
    }
  }

  const confirmDeleteDomain = async () => {

    if (!deleteDomain) return

    setDeleting(true)

    try {

      await adminApi.deleteDomain(deleteDomain.id)

      setDomains(prev =>
        prev.filter(d => d.id !== deleteDomain.id)
      )

      setSubdomains(prev =>
        prev.filter(s => s.domain_id !== deleteDomain.id)
      )

      if (selectedDomain === deleteDomain.id) {
        setSelectedDomain(null)
      }

      setDeleteDomain(null)

    } finally {
      setDeleting(false)
    }
  }

  const confirmDeleteSub = async () => {

    if (!deleteSub) return

    setDeleting(true)

    try {

      await adminApi.deleteSubdomain(deleteSub.id)

      setSubdomains(prev =>
        prev.filter(s => s.id !== deleteSub.id)
      )

      setDeleteSub(null)

    } finally {
      setDeleting(false)
    }
  }

  const selectedSubs = subdomains.filter(
    s => s.domain_id === selectedDomain
  )

  const selectedDomainObj =
    domains.find(d => d.id === selectedDomain)

  // COLORS

  const bg = '#050505'
  const card = '#0b0b0b'
  const border = '#1a1a1a'

  const hover = '#121212'

  const text = '#f5f5f5'
  const subtext = '#7b7b7b'

  const blue = '#3b82f6'
  const purple = '#8b5cf6'

  return (

    <Box
      sx={{
        background: bg,
        minHeight: '100vh',
        px: 3,
        py: 2.5,
      }}
    >

      {/* HEADER */}

      <Box
        sx={{
          mb: 3,
          background: card,
          border: `1px solid ${border}`,
          borderRadius: '18px',
          px: 3,
          py: 2.5,
        }}
      >

        <Typography
          sx={{
            color: text,
            fontSize: 26,
            fontWeight: 700,
            mb: 0.5,
          }}
        >
          Domains & Subdomains
        </Typography>

        <Typography
          sx={{
            color: subtext,
            fontSize: 12,
          }}
        >
          Manage assessment knowledge structure
        </Typography>

      </Box>

      {loading ? (

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 10,
          }}
        >
          <CircularProgress />
        </Box>

      ) : (

        <Grid container spacing={2.2}>

          {/* LEFT PANEL */}

          <Grid item xs={12} md={5}>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.8,
              }}
            >

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>

                <Typography
                  sx={{
                    color: text,
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Domains
                </Typography>

                <Chip
                  label={domains.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    background: '#111827',
                    color: blue,
                  }}
                />

              </Box>

              <Button
                startIcon={<Plus size={13} />}
                onClick={() => openDomainForm()}
                sx={{
                  background: blue,
                  color: '#fff',
                  textTransform: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 2,
                  py: 0.8,
                  minWidth: 0,
                  '&:hover': {
                    background: '#2563eb',
                  },
                }}
              >
                Add Domain
              </Button>

            </Box>

            <Stack spacing={1.4}>

              {domains.map(d => {

                const subCount =
                  subdomains.filter(
                    s => s.domain_id === d.id
                  ).length

                const isSelected =
                  selectedDomain === d.id

                return (

                  <Card
                    key={d.id}
                    onClick={() => setSelectedDomain(d.id)}
                    sx={{
                      background: isSelected ? '#101827' : card,
                      border: `1px solid ${isSelected ? blue : border}`,
                      borderRadius: '18px',
                      cursor: 'pointer',
                      transition: '0.2s',
                      minHeight: 112,

                      '&:hover': {
                        background: hover,
                        borderColor: blue,
                      },
                    }}
                  >

                    <CardContent
                      sx={{
                        p: 2,
                        '&:last-child': { pb: 2 },
                      }}
                    >

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          height: '100%',
                        }}
                      >

                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1.5,
                            flex: 1,
                          }}
                        >

                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: '10px',
                              background: '#111827',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: blue,
                              flexShrink: 0,
                            }}
                          >
                            <Globe size={15} />
                          </Box>

                          <Box>

                            <Typography
                              sx={{
                                color: text,
                                fontSize: 14,
                                fontWeight: 700,
                                mb: 0.5,
                              }}
                            >
                              {d.name}
                            </Typography>

                            <Typography
                              sx={{
                                color: subtext,
                                fontSize: 11,
                                lineHeight: 1.5,
                                mb: 1.3,
                              }}
                            >
                              {d.description}
                            </Typography>

                            <Chip
                              label={`${subCount} subdomains`}
                              size="small"
                              sx={{
                                height: 19,
                                fontSize: 10,
                                background: '#101827',
                                color: blue,
                              }}
                            />

                          </Box>

                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >

                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDomainForm(d)
                            }}
                            sx={{
                              color: subtext,
                            }}
                          >
                            <Edit2 size={13} />
                          </IconButton>

                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteDomain(d)
                            }}
                            sx={{
                              color: '#ef4444',
                            }}
                          >
                            <Trash2 size={13} />
                          </IconButton>

                        </Box>

                      </Box>

                    </CardContent>

                  </Card>

                )
              })}

            </Stack>

          </Grid>

          {/* RIGHT PANEL */}

          <Grid item xs={12} md={7}>

            {!selectedDomain ? (

              <Card
                sx={{
                  background: card,
                  border: `1px dashed ${border}`,
                  borderRadius: '18px',
                  height: '100%',
                  minHeight: 500,

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >

                <Box textAlign="center">

                  <Tag
                    size={38}
                    color={subtext}
                    style={{ marginBottom: 12 }}
                  />

                  <Typography
                    sx={{
                      color: text,
                      fontWeight: 700,
                      fontSize: 18,
                      mb: 0.5,
                    }}
                  >
                    Select Domain
                  </Typography>

                  <Typography
                    sx={{
                      color: subtext,
                      fontSize: 12,
                    }}
                  >
                    Choose a domain to manage subdomains
                  </Typography>

                </Box>

              </Card>

            ) : (

              <>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.8,
                  }}
                >

                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                    }}
                  >

                    <Typography
                      sx={{
                        color: text,
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      {selectedDomainObj?.name}
                    </Typography>

                    <Chip
                      label={selectedSubs.length}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        background: '#1a1027',
                        color: purple,
                      }}
                    />

                  </Box>

                  <Button
                    startIcon={<Plus size={13} />}
                    onClick={() => openSubForm()}
                    sx={{
                      background: purple,
                      color: '#fff',
                      textTransform: 'none',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: '10px',
                      px: 2,
                      py: 0.8,
                      '&:hover': {
                        background: '#7c3aed',
                      },
                    }}
                  >
                    Add Subdomain
                  </Button>

                </Box>

                <Stack spacing={1.4}>

                  {selectedSubs.map(s => (

                    <Card
                      key={s.id}
                      sx={{
                        background: card,
                        border: `1px solid ${border}`,
                        borderRadius: '18px',
                        minHeight: 92,

                        '&:hover': {
                          background: hover,
                          borderColor: purple,
                        },
                      }}
                    >

                      <CardContent
                        sx={{
                          p: 2,
                          '&:last-child': { pb: 2 },
                        }}
                      >

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >

                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1.5,
                            }}
                          >

                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: '10px',
                                background: '#1a1027',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: purple,
                              }}
                            >
                              <Tag size={14} />
                            </Box>

                            <Box>

                              <Typography
                                sx={{
                                  color: text,
                                  fontSize: 13,
                                  fontWeight: 700,
                                  mb: 0.5,
                                }}
                              >
                                {s.name}
                              </Typography>

                              <Typography
                                sx={{
                                  color: subtext,
                                  fontSize: 11,
                                  lineHeight: 1.5,
                                }}
                              >
                                {s.description}
                              </Typography>

                            </Box>

                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >

                            <IconButton
                              size="small"
                              onClick={() => openSubForm(s)}
                              sx={{ color: subtext }}
                            >
                              <Edit2 size={13} />
                            </IconButton>

                            <IconButton
                              size="small"
                              onClick={() => setDeleteSub(s)}
                              sx={{ color: '#ef4444' }}
                            >
                              <Trash2 size={13} />
                            </IconButton>

                          </Box>

                        </Box>

                      </CardContent>

                    </Card>

                  ))}

                </Stack>

              </>

            )}

          </Grid>

        </Grid>

      )}

      {/* DIALOGS */}

      {[domainDialog.open, subDialog.open].map((_, idx) => {

        const isDomain = idx === 0

        return (
          <Dialog
            key={idx}
            open={isDomain ? domainDialog.open : subDialog.open}
            onClose={() =>
              isDomain
                ? setDomainDialog({ open: false })
                : setSubDialog({ open: false })
            }
            fullWidth
            maxWidth="sm"
            PaperProps={{
              sx: {
                background: card,
                border: `1px solid ${border}`,
                borderRadius: '20px',
              },
            }}
          >

            <DialogTitle
              sx={{
                color: text,
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              {isDomain
                ? domainDialog.editing
                  ? 'Edit Domain'
                  : 'Create Domain'
                : subDialog.editing
                  ? 'Edit Subdomain'
                  : 'Create Subdomain'}
            </DialogTitle>

            <DialogContent>

              <Stack spacing={2} mt={1}>

                <TextField
                  fullWidth
                  size="small"
                  label={isDomain ? 'Domain Name' : 'Subdomain Name'}
                  value={isDomain ? domainName : subName}
                  onChange={(e) =>
                    isDomain
                      ? setDomainName(e.target.value)
                      : setSubName(e.target.value)
                  }
                  InputProps={{
                    sx: {
                      color: text,
                      fontSize: 13,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: subtext,
                      fontSize: 12,
                    },
                  }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  label="Description"
                  value={isDomain ? domainDesc : subDesc}
                  onChange={(e) =>
                    isDomain
                      ? setDomainDesc(e.target.value)
                      : setSubDesc(e.target.value)
                  }
                  InputProps={{
                    sx: {
                      color: text,
                      fontSize: 13,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: subtext,
                      fontSize: 12,
                    },
                  }}
                />

              </Stack>

            </DialogContent>

            <DialogActions sx={{ p: 2 }}>

              <Button
                onClick={() =>
                  isDomain
                    ? setDomainDialog({ open: false })
                    : setSubDialog({ open: false })
                }
                sx={{
                  color: subtext,
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={isDomain ? saveDomain : saveSub}
                sx={{
                  background: isDomain ? blue : purple,
                }}
              >
                Save
              </Button>

            </DialogActions>

          </Dialog>
        )
      })}

    </Box>
  )
}