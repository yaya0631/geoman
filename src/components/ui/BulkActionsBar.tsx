import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import { Archive, Trash2, X } from 'lucide-react'
import ConfirmModal from '@/components/modals/ConfirmModal'
import toast from 'react-hot-toast'

export default function BulkActionsBar() {
  const { selectedIds, clearSelection, settings } = useAppStore()
  const { trashDossier, archiveDossier } = useDossiers()
  const [confirmAction, setConfirmAction] = useState<'trash' | 'archive' | null>(null)

  const count = selectedIds.size
  if (count <= 1) return null

  const doTrash = () => {
    [...selectedIds].forEach(id => trashDossier.mutate(id))
    clearSelection()
    toast.success(`${count} dossiers mis en corbeille`)
  }

  const doArchive = () => {
    [...selectedIds].forEach(id => archiveDossier.mutate(id))
    clearSelection()
    toast.success(`${count} dossiers archivés`)
  }

  return (
    <>
      <div className="bulk-bar">
        <span><strong style={{ color: 'var(--acc)' }}>{count}</strong> dossiers sélectionnés</span>
        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
        <button className="btn btn-sm" onClick={() => settings.confirmBeforeDelete ? setConfirmAction('archive') : doArchive()}>
          <Archive size={12} /> Archiver tout
        </button>
        <button className="btn btn-sm btn-danger" onClick={() => settings.confirmBeforeDelete ? setConfirmAction('trash') : doTrash()}>
          <Trash2 size={12} /> Supprimer tout
        </button>
        <button className="btn btn-sm btn-icon" onClick={clearSelection} title="Déselectionner">
          <X size={12} />
        </button>
      </div>

      {confirmAction === 'trash' && (
        <ConfirmModal
          title="Confirmer la suppression"
          message={`Vous allez déplacer ${count} dossier(s) dans la corbeille. Cette action peut être annulée avec Ctrl+Z.`}
          confirmLabel="Supprimer"
          danger
          onConfirm={doTrash}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'archive' && (
        <ConfirmModal
          title="Confirmer l'archivage"
          message={`Vous allez archiver ${count} dossier(s). Vous pourrez les désarchiver plus tard.`}
          confirmLabel="Archiver"
          onConfirm={doArchive}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </>
  )
}
