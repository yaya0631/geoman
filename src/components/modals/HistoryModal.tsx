import { useAppStore } from '@/store/appStore'
import { formatDatetime } from '@/lib/formatters'
import { X } from 'lucide-react'

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
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-md">
        <div className="modal-header">
          <span className="modal-title">Historique — <span style={{ color: 'var(--acc)', fontFamily: 'var(--font-mono)' }}>{dossier.id}</span></span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-dim)' }}>
              Aucun historique disponible
            </div>
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
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
