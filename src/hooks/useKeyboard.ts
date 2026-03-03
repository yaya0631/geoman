import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/store/appStore'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useKeyboard() {
  const {
    selectedIds,
    setModalOpen,
    modalOpen,
    resetFilters,
    setEditingDossierId,
    undoAction,
    setUndoAction,
    updateDossier,
  } = useAppStore()

  const performUndo = useCallback(async () => {
    if (!undoAction) return
    const { type, dossiers } = undoAction
    for (const d of dossiers) {
      if (type === 'trash') {
        await supabase.from('dossiers').update({ in_trash: false, updated_at: new Date().toISOString() }).eq('id', d.id)
        updateDossier(d.id, { in_trash: false })
      } else if (type === 'archive') {
        await supabase.from('dossiers').update({ archived: false, date_archive: null, updated_at: new Date().toISOString() }).eq('id', d.id)
        updateDossier(d.id, { archived: false, date_archive: undefined })
      }
    }
    setUndoAction(null)
    toast.success('Action annulée')
  }, [undoAction, setUndoAction, updateDossier])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if (e.key === 'Escape') {
        if (modalOpen) { setModalOpen(null); setEditingDossierId(null) }
        else resetFilters()
        return
      }

      if (inInput) return

      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); setModalOpen('new-dossier'); return }
      if (e.key === 'F2') {
        e.preventDefault()
        const id = [...selectedIds][0]
        if (id) { setEditingDossierId(id); setModalOpen('edit-dossier') }
        return
      }
      if (e.key === 'F5') { e.preventDefault(); setModalOpen('dashboard'); return }
      if (e.ctrlKey && e.key === 'r') { e.preventDefault(); setModalOpen('reminders'); return }
      if (e.ctrlKey && e.key === 'e') { e.preventDefault(); setModalOpen('export'); return }
      if (e.ctrlKey && e.key === 'p') { e.preventDefault(); window.print(); return }
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); performUndo(); return }
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setModalOpen('command-palette'); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedIds, modalOpen, performUndo, resetFilters, setEditingDossierId, setModalOpen])
}
