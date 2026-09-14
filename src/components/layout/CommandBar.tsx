import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import {
  Plus, Pencil, Copy, Archive, Trash2, RotateCcw, Flame,
  CreditCard, Folder, History, Download, Columns, Command, ArchiveRestore, CheckSquare
} from 'lucide-react'
import ConfirmModal from '@/components/modals/ConfirmModal'

export default function CommandBar() {
  const {
    selectedIds, setModalOpen, setEditingDossierId, dossiers, settings
  } = useAppStore()
  const { trashDossier, archiveDossier, unarchiveDossier, restoreDossier, purgeDossier, duplicateDossier } = useDossiers()
  const [confirmAction, setConfirmAction] = useState<'trash' | 'purge' | null>(null)

  const selArray = [...selectedIds]
  const hasSel = selArray.length > 0
  const singleSel = selArray.length === 1
  const selectedDossier = singleSel ? dossiers.find(d => d.id === selArray[0]) : null
  const inTrash = selectedDossier?.in_trash
  const isArchived = selectedDossier?.archived

  const handleEdit = () => {
    if (singleSel) {
      setEditingDossierId(selArray[0])
      setModalOpen('edit-dossier')
    }
  }

  const doTrash = () => {
    selArray.forEach(id => trashDossier.mutate(id))
    setConfirmAction(null)
  }

  const doPurge = () => {
    selArray.forEach(id => purgeDossier.mutate(id))
    setConfirmAction(null)
  }

  return (
    <>
      <div className="command-bar">
        {/* Creation & Primary group */}
        <div className="cmd-group">
          <button
            className="btn btn-primary"
            onClick={() => { setEditingDossierId(null); setModalOpen('new-dossier') }}
            title="Créer un nouveau dossier foncier (Ctrl+N)"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Nouveau dossier</span>
            <kbd className="kbd-shortcut" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'transparent' }}>Ctrl+N</kbd>
          </button>
        </div>

        {/* Edit & Duplicate group */}
        <div className="cmd-group">
          <button
            className="btn"
            onClick={handleEdit}
            disabled={!singleSel}
            title="Modifier le dossier sélectionné (F2)"
          >
            <Pencil size={13} />
            <span>Modifier</span>
            <kbd className="kbd-shortcut">F2</kbd>
          </button>
          <button
            className="btn"
            onClick={() => singleSel && duplicateDossier.mutate(selArray[0])}
            disabled={!singleSel}
            title="Dupliquer le dossier sélectionné"
          >
            <Copy size={13} />
            <span>Dupliquer</span>
          </button>
        </div>

        {/* Modules group */}
        <div className="cmd-group">
          <button
            className="btn"
            onClick={() => { singleSel && setEditingDossierId(selArray[0]); setModalOpen('paiements') }}
            disabled={!singleSel}
            title="Gestion des règlements et paiements"
          >
            <CreditCard size={13} style={{ color: 'var(--green)' }} />
            <span>Paiements</span>
          </button>
          <button
            className="btn"
            onClick={() => { singleSel && setEditingDossierId(selArray[0]); setModalOpen('fichiers') }}
            disabled={!singleSel}
            title="Fichiers et plans attachés"
          >
            <Folder size={13} style={{ color: 'var(--acc)' }} />
            <span>Fichiers</span>
          </button>
          <button
            className="btn"
            onClick={() => { singleSel && setEditingDossierId(selArray[0]); setModalOpen('historique') }}
            disabled={!singleSel}
            title="Journal des modifications"
          >
            <History size={13} style={{ color: 'var(--purple)' }} />
            <span>Historique</span>
          </button>
        </div>

        {/* Status / Lifecycle group */}
        <div className="cmd-group">
          {inTrash ? (
            <>
              <button
                className="btn"
                onClick={() => singleSel && restoreDossier.mutate(selArray[0])}
                disabled={!singleSel}
                title="Restaurer depuis la corbeille"
                style={{ color: 'var(--green)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              >
                <RotateCcw size={13} />
                <span>Restaurer</span>
              </button>
              <button
                className="btn btn-danger"
                onClick={() => settings.confirmBeforeDelete ? setConfirmAction('purge') : doPurge()}
                disabled={!singleSel}
                title="Supprimer définitivement ce dossier"
              >
                <Flame size={13} />
                <span>Purger</span>
              </button>
            </>
          ) : (
            <>
              <button
                className="btn"
                onClick={() => {
                  if (isArchived) {
                    selArray.forEach(id => unarchiveDossier.mutate(id))
                  } else {
                    selArray.forEach(id => archiveDossier.mutate(id))
                  }
                }}
                disabled={!hasSel}
                title={isArchived ? 'Désarchiver' : 'Archiver (Ctrl+A)'}
              >
                {isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                <span>{isArchived ? 'Désarchiver' : 'Archiver'}</span>
                {!isArchived && <kbd className="kbd-shortcut">Ctrl+A</kbd>}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => settings.confirmBeforeDelete ? setConfirmAction('trash') : doTrash()}
                disabled={!hasSel}
                title="Déplacer dans la corbeille (Suppr)"
              >
                <Trash2 size={13} />
                <span>Supprimer</span>
                <kbd className="kbd-shortcut" style={{ color: 'var(--red)', background: 'var(--red-dim)', borderColor: 'transparent' }}>Suppr</kbd>
              </button>
            </>
          )}
        </div>

        {/* Tools & Views group */}
        <div className="cmd-group">
          <button
            className="btn"
            onClick={() => setModalOpen('export')}
            title="Importation / Exportation Excel, CSV, JSON (Ctrl+E)"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
          <button
            className="btn"
            onClick={() => setModalOpen('columns')}
            title="Personnaliser les colonnes du tableau"
          >
            <Columns size={13} />
            <span>Colonnes</span>
          </button>
          <button
            className="btn"
            onClick={() => setModalOpen('command-palette')}
            title="Palette de commandes rapides"
          >
            <Command size={13} />
            <span>Palette</span>
          </button>
        </div>

        {/* Selection Badge Indicator */}
        {selArray.length > 0 && (
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              background: 'var(--bg-3)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-2)',
            }}
          >
            <CheckSquare size={13} style={{ color: 'var(--acc)' }} />
            <span>
              <strong style={{ color: 'var(--acc)' }}>{selArray.length}</strong> {selArray.length > 1 ? 'dossiers sélectionnés' : 'dossier sélectionné'}
            </span>
          </div>
        )}
      </div>

      {confirmAction === 'trash' && (
        <ConfirmModal
          title={singleSel ? 'Déplacer en corbeille ?' : 'Confirmer la suppression'}
          message={`${selArray.length} dossier(s) seront déplacés dans la corbeille. Vous pouvez annuler avec Ctrl+Z.`}
          confirmLabel="Déplacer en corbeille"
          danger
          onConfirm={doTrash}
          onClose={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'purge' && (
        <ConfirmModal
          title="Suppression définitive"
          message={`${selArray.length} dossier(s) seront supprimés définitivement et de manière irréversible de la base de données.`}
          confirmLabel="Purger définitivement"
          danger
          onConfirm={doPurge}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </>
  )
}
