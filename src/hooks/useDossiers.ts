import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import { Dossier, Paiement, Fichier, HistoriqueEntry } from '@/types'
import { deepClone, uuid } from '@/lib/utils'
import { generateDossierId } from '@/lib/formatters'
import toast from 'react-hot-toast'

const QUERY_KEY = ['dossiers']

async function fetchAllDossiers(): Promise<Dossier[]> {
  const { data: dossiers, error } = await supabase
    .from('dossiers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  const { data: paiements } = await supabase.from('paiements').select('*')
  const { data: fichiers } = await supabase.from('fichiers').select('*')
  const { data: historique } = await supabase
    .from('historique')
    .select('*')
    .order('created_at', { ascending: false })

  return (dossiers || []).map(d => ({
    ...d,
    montant: d.montant || 0,
    acte: d.acte || false,
    regul: d.regul || false,
    agricole: d.agricole || false,
    depot_cad: d.depot_cad || '',
    depot_domain: d.depot_domain || '',
    etat: d.etat || 'actif',
    archived: d.archived || false,
    in_trash: d.in_trash || false,
    paiements: (paiements || []).filter(p => p.dossier_id === d.id) as Paiement[],
    fichiers: (fichiers || []).filter(f => f.dossier_id === d.id) as Fichier[],
    historique: (historique || []).filter(h => h.dossier_id === d.id) as HistoriqueEntry[],
  })) as Dossier[]
}

async function logHistory(dossierId: string, action: string, details?: Record<string, unknown>) {
  await supabase.from('historique').insert({
    id: uuid(),
    dossier_id: dossierId,
    action,
    details: details || {},
  })
}

export function useDossiers() {
  const queryClient = useQueryClient()
  const { setDossiers, dossiers, updateDossier, addDossier, removeDossier } = useAppStore()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await fetchAllDossiers()
      setDossiers(data)
      return data
    },
    staleTime: 30_000,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }, [queryClient])

  const createDossier = useMutation({
    mutationFn: async (data: Omit<Dossier, 'created_at' | 'updated_at' | 'paiements' | 'fichiers' | 'historique'>) => {
      const { paiements: _p, fichiers: _f, historique: _h, ...rest } = data as Dossier
      const { data: created, error } = await supabase
        .from('dossiers')
        .insert({ ...rest, updated_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      await logHistory(created.id, 'created', { nom: created.nom })
      return created
    },
    onSuccess: (created) => {
      invalidate()
      toast.success(`Dossier ${created.id} créé`)
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  })

  const updateDossierMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Dossier> }) => {
      const { paiements: _p, fichiers: _f, historique: _h, ...rest } = updates as Dossier
      const { error } = await supabase
        .from('dossiers')
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await logHistory(id, 'modified', { fields: Object.keys(updates) })
      updateDossier(id, updates)
    },
    onSuccess: () => {
      invalidate()
      toast.success('Dossier mis à jour')
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  })

  const trashDossier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dossiers')
        .update({ in_trash: true, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await logHistory(id, 'trashed')
      updateDossier(id, { in_trash: true })
    },
    onMutate: (id: string) => {
      // Save state for undo
      const prev = useAppStore.getState().dossiers.find(d => d.id === id)
      if (prev) {
        useAppStore.getState().setUndoAction({
          type: 'trash',
          dossiers: [prev],
          timestamp: Date.now(),
        })
      }
    },
    onSuccess: () => {
      invalidate()
      toast.success('Déplacé dans la corbeille')
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  })

  const restoreDossier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dossiers')
        .update({ in_trash: false, archived: false, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await logHistory(id, 'restored')
      updateDossier(id, { in_trash: false, archived: false })
    },
    onSuccess: () => {
      invalidate()
      toast.success('Dossier restauré')
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  })

  const purgeDossier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dossiers').delete().eq('id', id)
      if (error) throw error
      removeDossier(id)
    },
    onSuccess: () => {
      invalidate()
      toast.success('Dossier supprimé définitivement')
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  })

  const archiveDossier = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('dossiers')
        .update({ archived: true, date_archive: now, updated_at: now })
        .eq('id', id)
      if (error) throw error
      await logHistory(id, 'archived')
      updateDossier(id, { archived: true, date_archive: now })
    },
    onMutate: (id: string) => {
      const prev = useAppStore.getState().dossiers.find(d => d.id === id)
      if (prev) {
        useAppStore.getState().setUndoAction({
          type: 'archive',
          dossiers: [prev],
          timestamp: Date.now(),
        })
      }
    },
    onSuccess: () => {
      invalidate()
      toast.success('Dossier archivé')
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  })

  const unarchiveDossier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dossiers')
        .update({ archived: false, date_archive: null, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await logHistory(id, 'unarchived')
      updateDossier(id, { archived: false, date_archive: undefined })
    },
    onSuccess: () => {
      invalidate()
      toast.success('Dossier désarchivé')
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  })

  const duplicateDossier = useMutation({
    mutationFn: async (id: string) => {
      const src = dossiers.find(d => d.id === id)
      if (!src) throw new Error('Dossier introuvable')
      const newId = generateDossierId(dossiers.map(d => d.id))
      const clone = deepClone(src)
      const now = new Date().toISOString()
      const newDossier = {
        ...clone,
        id: newId,
        archived: false,
        in_trash: false,
        date_archive: null,
        created_at: now,
        updated_at: now,
      }
      delete (newDossier as Record<string, unknown>).paiements
      delete (newDossier as Record<string, unknown>).fichiers
      delete (newDossier as Record<string, unknown>).historique
      const { data: created, error } = await supabase
        .from('dossiers')
        .insert(newDossier)
        .select()
        .single()
      if (error) throw error
      await logHistory(created.id, 'duplicated', { source: id })
      return created
    },
    onSuccess: (created) => {
      invalidate()
      toast.success(`Dossier dupliqué → ${created.id}`)
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  })

  // Payments
  const addPaiement = useMutation({
    mutationFn: async ({ dossierId, montant, date, note }: { dossierId: string; montant: number; date: string; note?: string }) => {
      const { data, error } = await supabase
        .from('paiements')
        .insert({ id: uuid(), dossier_id: dossierId, montant, date, note })
        .select()
        .single()
      if (error) throw error
      await logHistory(dossierId, 'payment_added', { montant, date })
      return data
    },
    onSuccess: () => {
      invalidate()
      toast.success('Paiement ajouté')
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  })

  const deletePaiement = useMutation({
    mutationFn: async (paiementId: string) => {
      const { error } = await supabase.from('paiements').delete().eq('id', paiementId)
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      toast.success('Paiement supprimé')
    },
    onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
  })

  return {
    query,
    createDossier,
    updateDossierMutation,
    trashDossier,
    restoreDossier,
    purgeDossier,
    archiveDossier,
    unarchiveDossier,
    duplicateDossier,
    addPaiement,
    deletePaiement,
    invalidate,
  }
}
