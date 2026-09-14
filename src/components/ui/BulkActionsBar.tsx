import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import { Archive, Trash2, X, CheckSquare } from 'lucide-react'
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
    toast.success(`${count} dossiers déplacés en corbeille`)
  }

  const doArchive = () => {
    [...selectedIds].forEach(id => archiveDossier.mutate(id))
    clearSelection()
    toast.success(`${count} dossiers archivés`)
  }

  return (
    <>
      <div className="bulk-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CheckSquare size={14} style={{ color: 'var(--acc)' }} />
          <span><strong style={{ color: 'var(--acc)' }}>{count}</strong> dossiers sélectionnés</span>
        </div>
        <div style={{ width: 1, height: 18, background: 'var(--border-2)' }} />
        <button
          className="btn btn-sm"
          onClick={() => settings.confirmBeforeDelete ? setConfirmAction('archive') : doArchive()}
          style={{ background: 'var(--bg-3)' }}
        >
          <Archive size={12} />
          <span>Archiver tout</span>
        </button>
        <button
          className="btn btn-sm btn-danger"
          onClick={() => settings.confirmBeforeDelete ? setConfirmAction('trash') : doTrash()}
        >
          <Trash2 size={12} />
          <span>Supprimer tout</span>
        </button>
        <button
          className="btn btn-sm btn-icon btn-ghost"
          onClick={clearSelection}
          title="Annuler la sélection"
          style={{ width: 24, height: 24 }}
        >
          <X size={13} />
        </button>
      </div>

      {confirmAction === 'trash' && (
        <ConfirmModal
          title="Confirmer le déplacement en corbeille"
          message={`Vous êtes sur le point de déplacer ${count} dossiers dans la corbeille. Vous pourrez annuler avec Ctrl+Z.`}
          confirmLabel="Mettre en corbeille"
          danger
          onConfirm={doTrash}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'archive' && (
        <ConfirmModal
          title="Confirmer l'archivage groupé"
          message={`Vous allez archiver ${count} dossiers. Ils seront conservés dans la section Archives.`}
          confirmLabel="Archiver les dossiers"
          onConfirm={doArchive}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </>
  )
}
