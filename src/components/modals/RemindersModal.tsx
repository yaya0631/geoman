import { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { computeStatus } from '@/lib/status'
import { getEncaisse } from '@/lib/utils'
import { formatDate } from '@/lib/formatters'
import { differenceInDays, parseISO } from 'date-fns'
import { X, AlertTriangle, Clock } from 'lucide-react'

interface Props { onClose: () => void }

export default function RemindersModal({ onClose }: Props) {
  const { dossiers, setEditingDossierId, setModalOpen } = useAppStore()

  const { overdue, soon } = useMemo(() => {
    const active = dossiers.filter(d => !d.in_trash && !d.archived)
    const overdue = active.filter(d => computeStatus(d, getEncaisse(d)) === 'En retard')
    const soon = active.filter(d => computeStatus(d, getEncaisse(d)) === 'Echeance proche')
    return { overdue, soon }
  }, [dossiers])

  const openDossier = (id: string) => {
    setEditingDossierId(id)
    setModalOpen('edit-dossier')
    onClose()
  }

  const getDaysOverdue = (dateStr?: string | null) => {
    if (!dateStr) return 0
    try {
      return Math.abs(differenceInDays(parseISO(dateStr), new Date()))
    } catch { return 0 }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-md">
        <div className="modal-header">
          <AlertTriangle size={16} style={{ color: 'var(--red)' }} />
          <span className="modal-title">Rappels & Alertes</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {overdue.length === 0 && soon.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--green)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14 }}>Aucun dossier en retard ou en urgence</div>
            </div>
          ) : null}

          {/* Overdue */}
          {overdue.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--red)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <AlertTriangle size={13} /> En retard ({overdue.length})
              </div>
              {overdue.map(d => (
                <div
                  key={d.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--red-dim)', borderRadius: 6, marginBottom: 4, cursor: 'pointer' }}
                  onClick={() => openDossier(d.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{d.nom}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {d.id} — {d.endroit || '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11.5, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                      {formatDate(d.date_finale)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--red)' }}>
                      il y a {getDaysOverdue(d.date_finale)} jour(s)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Soon */}
          {soon.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--yellow)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Clock size={13} /> Échéance proche ({soon.length})
              </div>
              {soon.map(d => (
                <div
                  key={d.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--yellow-dim)', borderRadius: 6, marginBottom: 4, cursor: 'pointer' }}
                  onClick={() => openDossier(d.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{d.nom}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {d.id} — {d.endroit || '—'}
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--yellow)', fontFamily: 'var(--font-mono)' }}>
                    {formatDate(d.date_finale)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
