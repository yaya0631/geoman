import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import { Dossier } from '@/types'
import {
  Pencil, Copy, CreditCard, Folder, History, Archive, Trash2, RotateCcw, Flame, ArchiveRestore
} from 'lucide-react'
import ConfirmModal from '@/components/modals/ConfirmModal'

interface Props {
  x: number
  y: number
  dossier: Dossier
  onClose: () => void
}

export default function ContextMenu({ x, y, dossier, onClose }: Props) {
  const { setModalOpen, setEditingDossierId, settings } = useAppStore()
  const { trashDossier, archiveDossier, unarchiveDossier, restoreDossier, purgeDossier, duplicateDossier } = useDossiers()
  const ref = useRef<HTMLDivElement>(null)
  const [confirm, setConfirm] = useState<'trash' | 'purge' | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [onClose])

  const style: React.CSSProperties = {
    left: Math.min(x, window.innerWidth - 210),
    top: Math.min(y, window.innerHeight - 300),
  }

  const openModal = (modal: string) => {
    setEditingDossierId(dossier.id)
    setModalOpen(modal)
    onClose()
  }

  const doTrash = () => { trashDossier.mutate(dossier.id); onClose() }
  const doPurge = () => { purgeDossier.mutate(dossier.id); onClose() }

  return (
    <>
      <div className="context-menu" style={style} ref={ref}>
        {!dossier.in_trash && (
          <>
            <div className="ctx-item" onClick={() => openModal('edit-dossier')}>
              <Pencil size={13} /> Modifier <span className="ctx-shortcut">F2</span>
            </div>
            <div className="ctx-item" onClick={() => { duplicateDossier.mutate(dossier.id); onClose() }}>
              <Copy size={13} /> Dupliquer
            </div>
            <div className="ctx-sep" />
            <div className="ctx-item" onClick={() => openModal('paiements')}>
              <CreditCard size={13} /> Paiements
            </div>
            <div className="ctx-item" onClick={() => openModal('fichiers')}>
              <Folder size={13} /> Fichiers
            </div>
            <div className="ctx-item" onClick={() => openModal('historique')}>
              <History size={13} /> Historique
            </div>
            <div className="ctx-sep" />
            {dossier.archived ? (
              <div className="ctx-item" onClick={() => { unarchiveDossier.mutate(dossier.id); onClose() }}>
                <ArchiveRestore size={13} /> Désarchiver
              </div>
            ) : (
              <div className="ctx-item" onClick={() => { archiveDossier.mutate(dossier.id); onClose() }}>
                <Archive size={13} /> Archiver <span className="ctx-shortcut">Ctrl+A</span>
              </div>
            )}
            <div className="ctx-item danger" onClick={() => settings.confirmBeforeDelete ? setConfirm('trash') : doTrash()}>
              <Trash2 size={13} /> Supprimer <span className="ctx-shortcut">Suppr</span>
            </div>
          </>
        )}

        {dossier.in_trash && (
          <>
            <div className="ctx-item" onClick={() => { restoreDossier.mutate(dossier.id); onClose() }}>
              <RotateCcw size={13} /> Restaurer
            </div>
            <div className="ctx-sep" />
            <div className="ctx-item danger" onClick={() => settings.confirmBeforeDelete ? setConfirm('purge') : doPurge()}>
              <Flame size={13} /> Supprimer définitivement
            </div>
          </>
        )}
      </div>

      {confirm === 'trash' && (
        <ConfirmModal
          title="Déplacer en corbeille ?"
          message={`"${dossier.nom}" sera déplacé dans la corbeille. Vous pouvez annuler avec Ctrl+Z.`}
          confirmLabel="Supprimer"
          danger
          onConfirm={doTrash}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'purge' && (
        <ConfirmModal
          title="Suppression définitive"
          message={`"${dossier.nom}" sera supprimé définitivement et de manière irréversible.`}
          confirmLabel="Supprimer définitivement"
          danger
          onConfirm={doPurge}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  )
}
