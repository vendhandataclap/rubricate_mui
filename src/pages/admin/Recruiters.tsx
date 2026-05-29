import { useState, useEffect } from 'react'
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Grid, IconButton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Tooltip, Typography, Avatar, Alert, alpha,
} from '@mui/material'
import { Plus, Edit2, Mail, Phone, Send, RefreshCw, Eye, UserCheck, UserX, Trash2, X } from 'lucide-react'
import { adminApi } from '../../services/api'
import type { Recruiter, Domain } from '../../types'

type RecruiterStatus = 'active' | 'inactive' | 'invited' | 'pending'
interface ExtendedRecruiter extends Omit<Recruiter, 'status'> {
  status: RecruiterStatus; invited_at?: string | null; accepted_at?: string | null
}

const STATUS_COLOR: Record<RecruiterStatus, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success', invited: 'warning', inactive: 'error', pending: 'default',
}

const fmt = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString() : '—'
const initials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export default function Recruiters() {
  const [recruiters, setRecruiters] = useState<ExtendedRecruiter[]>([])
  const [domains, setDomains] = useState<Domain[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [viewRecruiter, setViewRecruiter] = useState<ExtendedRecruiter | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ExtendedRecruiter | null>(null)
  const [statusTarget, setStatusTarget] = useState<{ r: ExtendedRecruiter; action: 'activate' | 'deactivate' } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])

  useEffect(() => {
    adminApi.getDomains().then(({ domains: ds }) => setDomains(ds)).catch(() => {})
    load()
  }, [])

  const load = () => adminApi.getRecruiters().then(list => setRecruiters(list as ExtendedRecruiter[])).catch(() => {})

  const openForm = (r?: ExtendedRecruiter) => {
    if (r) {
      setEditingId(r.id)
      const parts = r.full_name.split(/\s+/)
      setFirstName(parts[0] || ''); setLastName(parts.slice(1).join(' ') || '')
      setEmail(r.email); setPhone(r.phone || ''); setCompany(r.company || '')
      setSelectedDomains(r.domain_ids)
    } else {
      setEditingId(null); setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setCompany(''); setSelectedDomains([])
    }
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !company.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await adminApi.updateRecruiter(editingId, { first_name: firstName.trim(), last_name: lastName.trim(), full_name: `${firstName.trim()} ${lastName.trim()}`, email: email.trim(), phone: phone.trim() || undefined })
      } else {
        await adminApi.createRecruiter({ company_id: company.trim(), first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim(), phone: phone.trim() || undefined })
      }
      load(); setFormOpen(false)
    } catch (err: any) { alert(err?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const handleStatusAction = async () => {
    if (!statusTarget) return
    setActionLoading(true)
    try {
      if (statusTarget.action === 'activate') await adminApi.updateRecruiter(statusTarget.r.id, { status: 'active', is_active: true })
      else await adminApi.deleteRecruiter(statusTarget.r.id)
      load(); setStatusTarget(null)
    } catch (err: any) { alert(err?.message || 'Failed') }
    finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try { await adminApi.deleteRecruiter(deleteTarget.id); load(); setDeleteTarget(null) }
    catch (err: any) { alert(err?.message || 'Failed to delete') }
    finally { setActionLoading(false) }
  }

  const handleResend = async (id: string) => {
    try { await adminApi.resendInvitation(id); alert('Invitation resent') }
    catch (err: any) { alert(err?.message || 'Failed') }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>Recruiters</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage expert recruiters and their domains</Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => openForm()}>Add Recruiter</Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Invited</TableCell>
                <TableCell>Accepted</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recruiters.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>No recruiters yet. Add your first recruiter.</TableCell></TableRow>
              ) : recruiters.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(99,102,241,0.15)', color: 'primary.main', fontSize: 12, fontWeight: 700 }}>{initials(r.full_name)}</Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.company || '—'}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{r.email}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{r.phone || '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{r.company || '—'}</Typography></TableCell>
                  <TableCell><Chip label={r.status} size="small" color={STATUS_COLOR[r.status]} /></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{fmt(r.invited_at)}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{fmt(r.accepted_at)}</Typography></TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      <Tooltip title="View"><IconButton size="small" onClick={() => setViewRecruiter(r)}><Eye size={15} /></IconButton></Tooltip>
                      {r.status === 'invited' && <Tooltip title="Resend invite"><IconButton size="small" onClick={() => handleResend(r.id)}><RefreshCw size={15} /></IconButton></Tooltip>}
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => openForm(r)}><Edit2 size={15} /></IconButton></Tooltip>
                      <Tooltip title={r.status === 'inactive' ? 'Activate' : 'Deactivate'}>
                        <IconButton size="small" color={r.status === 'inactive' ? 'success' : 'warning'} onClick={() => setStatusTarget({ r, action: r.status === 'inactive' ? 'activate' : 'deactivate' })}>
                          {r.status === 'inactive' ? <UserCheck size={15} /> : <UserX size={15} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteTarget(r)}><Trash2 size={15} /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { bgcolor: 'background.paper' } } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingId ? 'Edit Recruiter' : 'Add New Recruiter'}
          <IconButton size="small" onClick={() => setFormOpen(false)}><X size={18} /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {!editingId && (
            <Alert severity="info" icon={<Send size={16} />} sx={{ mb: 2 }}>
              An invitation email will be sent. After accepting, login credentials will be emailed automatically.
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="First Name *" value={firstName} onChange={e => setFirstName(e.target.value)} size="small" /></Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Last Name *" value={lastName} onChange={e => setLastName(e.target.value)} size="small" /></Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} size="small" /></Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Phone" value={phone} onChange={e => setPhone(e.target.value)} size="small" /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="Company ID *" value={company} onChange={e => setCompany(e.target.value)} size="small" /></Grid>
            {domains.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>ASSIGNED DOMAINS (OPTIONAL)</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {domains.map(d => (
                    <Chip key={d.id} label={d.name} size="small" clickable
                      color={selectedDomains.includes(d.id) ? 'primary' : 'default'}
                      variant={selectedDomains.includes(d.id) ? 'filled' : 'outlined'}
                      onClick={() => setSelectedDomains(prev => prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id])} />
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !firstName.trim() || !lastName.trim() || !email.trim() || !company.trim()} startIcon={!editingId ? <Send size={16} /> : undefined}>
            {saving ? 'Saving…' : editingId ? 'Update' : 'Add & Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewRecruiter} onClose={() => setViewRecruiter(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { bgcolor: 'background.paper' } } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Recruiter Details <IconButton size="small" onClick={() => setViewRecruiter(null)}><X size={18} /></IconButton>
        </DialogTitle>
        {viewRecruiter && (
          <DialogContent dividers>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(99,102,241,0.15)', color: 'primary.main', fontWeight: 700 }}>{initials(viewRecruiter.full_name)}</Avatar>
              <Box><Typography sx={{ fontWeight: 700 }}>{viewRecruiter.full_name}</Typography><Chip label={viewRecruiter.status} size="small" color={STATUS_COLOR[viewRecruiter.status]} /></Box>
            </Box>
            <Stack spacing={1.5}>
              {[{ icon: Mail, label: viewRecruiter.email }, { icon: Phone, label: viewRecruiter.phone || '—' }].map(({ icon: Icon, label }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Icon size={15} color="#94a3b8" /><Typography variant="body2">{label}</Typography></Box>
              ))}
              <Divider />
              <Box><Typography variant="caption" color="text.secondary">Invited</Typography><Typography variant="body2">{fmt(viewRecruiter.invited_at)}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Accepted</Typography><Typography variant="body2">{fmt(viewRecruiter.accepted_at)}</Typography></Box>
            </Stack>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setViewRecruiter(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { bgcolor: 'background.paper' } } }}>
        <DialogTitle>Delete Recruiter</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">Permanently delete <strong>{deleteTarget?.full_name}</strong>? This cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setDeleteTarget(null)} disabled={actionLoading}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={actionLoading}>{actionLoading ? 'Deleting…' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>

      {/* Status Confirm */}
      <Dialog open={!!statusTarget} onClose={() => setStatusTarget(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { bgcolor: 'background.paper' } } }}>
        <DialogTitle>{statusTarget?.action === 'activate' ? 'Activate' : 'Deactivate'} Recruiter</DialogTitle>
        <DialogContent><Typography variant="body2" color="text.secondary">Are you sure you want to {statusTarget?.action} <strong>{statusTarget?.r.full_name}</strong>?</Typography></DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setStatusTarget(null)} disabled={actionLoading}>Cancel</Button>
          <Button variant="contained" color={statusTarget?.action === 'activate' ? 'success' : 'warning'} onClick={handleStatusAction} disabled={actionLoading}>{actionLoading ? 'Processing…' : 'Confirm'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
