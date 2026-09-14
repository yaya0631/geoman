import { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { computeStatus } from '@/lib/status'
import { getEncaisse } from '@/lib/utils'
import { formatDate } from '@/lib/formatters'
import { differenceInDays, parseISO } from 'date-fns'
import { AlertTriangle, Clock, Bell, ChevronRight, CheckCircle2 } from 'lucide-react'
import ModalShell from '@/components/ui/ModalShell'
import { EmptyState } from '@/components/ui/States'

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
    <ModalShell
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={18} style={{ color: 'var(--yellow)' }} />
          <span>Centre des rappels & alertes d'échéances</span>
        </div>
      }
      onClose={onClose}
      size="md"
      footer={<button type="button" className="btn btn-primary" onClick={onClose}>Fermer</button>}
    >
      {overdue.length === 0 && soon.length === 0 ? (
        <EmptyState
          title="Tous les dossiers sont à jour !"
          description="Aucun dossier n'est actuellement en retard ou avec une échéance urgente."
          icon={<CheckCircle2 size={36} style={{ color: 'var(--green)' }} />}
        />
      ) : null}

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
            color: 'var(--red)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <AlertTriangle size={14} />
            <span>Dossiers en retard ({overdue.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {overdue.map(d => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'var(--bg-2)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderLeft: '4px solid var(--red)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
                onClick={() => openDossier(d.id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{d.nom}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    <span style={{ color: 'var(--acc)', fontWeight: 600 }}>{d.id}</span> — {d.endroit || 'Localité non définie'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {formatDate(d.date_finale)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 500 }}>
                    + {getDaysOverdue(d.date_finale)} j de retard
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Soon Section */}
      {soon.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
            color: 'var(--yellow)',
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Clock size={14} />
            <span>Échéance proche (&le; 7 jours) ({soon.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {soon.map(d => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'var(--bg-2)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderLeft: '4px solid var(--yellow)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
                onClick={() => openDossier(d.id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{d.nom}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    <span style={{ color: 'var(--acc)', fontWeight: 600 }}>{d.id}</span> — {d.endroit || 'Localité non définie'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--yellow)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {formatDate(d.date_finale)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    Échéance imminente
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  )
}
