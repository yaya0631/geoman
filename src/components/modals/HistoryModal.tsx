import { useAppStore } from '@/store/appStore'
import { formatDatetime } from '@/lib/formatters'
import { History, Clock, FileText } from 'lucide-react'
import ModalShell from '@/components/ui/ModalShell'
import { EmptyState } from '@/components/ui/States'

interface Props { onClose: () => void }

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  created: { label: 'Dossier créé', color: 'var(--green)' },
  modified: { label: 'Dossier modifié', color: 'var(--acc)' },
  archived: { label: 'Dossier archivé', color: 'var(--text-3)' },
  unarchived: { label: 'Dossier désarchivé', color: 'var(--acc)' },
  trashed: { label: 'Déplacé en corbeille', color: 'var(--orange)' },
  restored: { label: 'Restauré de la corbeille', color: 'var(--green)' },
  duplicated: { label: 'Dossier dupliqué', color: 'var(--purple)' },
  payment_added: { label: 'Versement enregistré', color: 'var(--green)' },
  payment_deleted: { label: 'Versement supprimé', color: 'var(--red)' },
}

export default function HistoryModal({ onClose }: Props) {
  const { editingDossierId, dossiers } = useAppStore()
  const dossier = dossiers.find(d => d.id === editingDossierId)

  if (!dossier) return null
  const history = dossier.historique || []

  return (
    <ModalShell
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={18} style={{ color: 'var(--purple)' }} />
          <span>Journal d'audit & Historique — </span>
          <span style={{ color: 'var(--acc)', fontFamily: 'var(--font-mono)' }}>{dossier.id}</span>
        </div>
      }
      onClose={onClose}
      size="md"
      footer={<button type="button" className="btn btn-primary" onClick={onClose}>Fermer</button>}
    >
      {history.length === 0 ? (
        <EmptyState
          title="Aucun historique d'activité"
          description="Les actions effectuées sur ce dossier apparaîtront ici sous forme de timeline chronologique."
          icon={<Clock size={36} style={{ color: 'var(--text-3)' }} />}
        />
      ) : (
        <div className="timeline">
          {history.map(entry => {
            const config = ACTION_LABELS[entry.action] || { label: entry.action, color: 'var(--acc)' }
            return (
              <div key={entry.id} className="timeline-item">
                <div className="timeline-dot" style={{ background: config.color }} />
                <div className="timeline-time">{formatDatetime(entry.created_at)}</div>
                <div className="timeline-action">
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{config.label}</span>
                  {entry.details && Object.keys(entry.details).length > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {JSON.stringify(entry.details)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </ModalShell>
  )
}
