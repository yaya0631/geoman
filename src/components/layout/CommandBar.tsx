import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import {
  Plus, Pencil, Copy, Archive, Trash2, RotateCcw, Flame,
  CreditCard, Folder, History, Download, Columns, Search, ArchiveRestore
} from 'lucide-react'

export default function CommandBar() {
  const {
    selectedIds, setModalOpen, setEditingDossierId, dossiers, filters
  } = useAppStore()
  const { trashDossier, archiveDossier, unarchiveDossier, restoreDossier, purgeDossier, duplicateDossier } = useDossiers()

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

  return (
    <div className="command-bar">
      {/* CRUD group */}
      <div className="cmd-group">
        <button
          className="btn btn-primary"
          onClick={() => { setEditingDossierId(null); setModalOpen('new-dossier') }}
          title="Nouveau dossier (Ctrl+N)"
        >
          <Plus size={13} /> Nouveau
        </button>
        <button
          className="btn"
          onClick={handleEdit}
          disabled={!singleSel}
          title="Modifier (F2)"
        >
          <Pencil size={13} /> Modifier
        </button>
        <button
          className="btn"
          onClick={() => singleSel && duplicateDossier.mutate(selArray[0])}
          disabled={!singleSel}
          title="Dupliquer"
        >
          <Copy size={13} /> Dupliquer
        </button>
      </div>

      {/* Detail group */}
      <div className="cmd-group">
        <button
          className="btn"
          onClick={() => { singleSel && setEditingDossierId(selArray[0]); setModalOpen('paiements') }}
          disabled={!singleSel}
          title="Paiements"
        >
          <CreditCard size={13} /> Paiements
        </button>
        <button
          className="btn"
          onClick={() => { singleSel && setEditingDossierId(selArray[0]); setModalOpen('fichiers') }}
          disabled={!singleSel}
          title="Fichiers"
        >
          <Folder size={13} /> Fichiers
        </button>
        <button
          className="btn"
          onClick={() => { singleSel && setEditingDossierId(selArray[0]); setModalOpen('historique') }}
          disabled={!singleSel}
          title="Historique"
        >
          <History size={13} /> Historique
        </button>
      </div>

      {/* Actions group */}
      <div className="cmd-group">
        {inTrash ? (
          <>
            <button
              className="btn"
              onClick={() => singleSel && restoreDossier.mutate(selArray[0])}
              disabled={!singleSel}
              title="Restaurer"
            >
              <RotateCcw size={13} /> Restaurer
            </button>
            <button
              className="btn btn-danger"
              onClick={() => singleSel && purgeDossier.mutate(selArray[0])}
              disabled={!singleSel}
              title="Supprimer définitivement"
            >
              <Flame size={13} /> Purger
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
              {isArchived ? 'Désarchiver' : 'Archiver'}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => selArray.forEach(id => trashDossier.mutate(id))}
              disabled={!hasSel}
              title="Corbeille (Suppr)"
            >
              <Trash2 size={13} /> Supprimer
            </button>
          </>
        )}
      </div>

      {/* Tools group */}
      <div className="cmd-group">
        <button
          className="btn"
          onClick={() => setModalOpen('export')}
          title="Import/Export (Ctrl+E)"
        >
          <Download size={13} /> Export
        </button>
        <button
          className="btn"
          onClick={() => setModalOpen('columns')}
          title="Colonnes visibles"
        >
          <Columns size={13} /> Colonnes
        </button>
        <button
          className="btn"
          onClick={() => setModalOpen('command-palette')}
          title="Palette de commandes (Ctrl+K)"
        >
          <Search size={13} /> Ctrl+K
        </button>
      </div>

      {/* Multi-select indicator */}
      {selArray.length > 1 && (
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-2)' }}>
          <span style={{ color: 'var(--acc)', fontWeight: 600 }}>{selArray.length}</span> sélectionnés
        </div>
      )}
    </div>
  )
}
