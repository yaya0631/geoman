import { useAppStore } from '@/store/appStore'
import { formatDatetime } from '@/lib/formatters'
import ModalShell from '@/components/ui/ModalShell'
import { EmptyState } from '@/components/ui/States'

interface Props { onClose: () => void }

const ACTION_LABELS: Record<string, string> = {
  created: '✨ Dossier créé',
  modified: '✏️ Dossier modifié',
  archived: '📦 Archivé',
  unarchived: '📂 Désarchivé',
  trashed: '🗑️ Mis en corbeille',
  restored: '♻️ Restauré',
  duplicated: '📋 Dupliqué',
  payment_added: '💰 Paiement ajouté',
  payment_deleted: '💸 Paiement supprimé',
}

export default function HistoryModal({ onClose }: Props) {
  const { editingDossierId, dossiers } = useAppStore()
  const dossier = dossiers.find(d => d.id === editingDossierId)

  if (!dossier) return null
  const history = dossier.historique || []

  return (
    <ModalShell
      title={<><span>Historique — </span><span style={{ color: 'var(--acc)', fontFamily: 'var(--font-mono)' }}>{dossier.id}</span></>}
      onClose={onClose}
      size="md"
    >
      {history.length === 0 ? (
        <EmptyState title="Aucun historique" description="Les actions sur ce dossier apparaîtront ici." />
      ) : (
        <div className="timeline">
          {history.map(entry => (
            <div key={entry.id} className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-time">{formatDatetime(entry.created_at)}</div>
              <div className="timeline-action">
                {ACTION_LABELS[entry.action] || entry.action}
                {entry.details && Object.keys(entry.details).length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {JSON.stringify(entry.details)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  )
}
