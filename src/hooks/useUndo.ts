import { useCallback } from 'react'
import { useAppStore } from '@/store/appStore'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useUndo() {
  const { undoAction, setUndoAction, updateDossier } = useAppStore()

  const canUndo = !!undoAction

  const undo = useCallback(async () => {
    if (!undoAction) return
    const { type, dossiers } = undoAction

    try {
      for (const d of dossiers) {
        if (type === 'trash') {
          await supabase.from('dossiers').update({ in_trash: false, updated_at: new Date().toISOString() }).eq('id', d.id)
          updateDossier(d.id, { in_trash: false })
        } else if (type === 'archive') {
          await supabase.from('dossiers').update({ archived: false, date_archive: null, updated_at: new Date().toISOString() }).eq('id', d.id)
          updateDossier(d.id, { archived: false, date_archive: undefined })
        } else if (type === 'restore') {
          await supabase.from('dossiers').update({ in_trash: true, updated_at: new Date().toISOString() }).eq('id', d.id)
          updateDossier(d.id, { in_trash: true })
        }
      }
      setUndoAction(null)
      toast.success('Action annulée (Ctrl+Z)')
    } catch (err: any) {
      toast.error(`Erreur d'annulation: ${err.message}`)
    }
  }, [undoAction, setUndoAction, updateDossier])

  return { canUndo, undo, undoAction }
}
