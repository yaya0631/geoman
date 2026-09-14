import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  Client, Tache, Evenement, CourrierModele, CourrierEnvoye,
  ContactAdmin, Devis, Facture, Reglement, CabinetInfo,
} from '@/types'
import toast from 'react-hot-toast'

const KEYS = {
  clients: ['office', 'clients'] as const,
  taches: ['office', 'taches'] as const,
  evenements: ['office', 'evenements'] as const,
  modeles: ['office', 'courriers_modeles'] as const,
  courriers: ['office', 'courriers_envoyes'] as const,
  contacts: ['office', 'contacts'] as const,
  devis: ['office', 'devis'] as const,
  factures: ['office', 'factures'] as const,
  reglements: ['office', 'reglements'] as const,
  cabinet: ['office', 'cabinet'] as const,
}

async function fetchTable<T>(table: string): Promise<T[]> {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as T[]
}

function useCrud<T extends { id: string }>(table: string, key: readonly string[], label: string) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchTable<T>(table),
    staleTime: 20_000,
    retry: 1,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: key })

  const create = useMutation({
    mutationFn: async (payload: Partial<T>) => {
      const { data, error } = await supabase.from(table).insert(payload).select().single()
      if (error) throw error
      return data as T
    },
    onSuccess: () => { invalidate(); toast.success(`${label} créé`) },
    onError: (err: Error) => toast.error(err.message),
  })

  const update = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<T> }) => {
      const { error } = await supabase.from(table).update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { invalidate(); toast.success(`${label} mis à jour`) },
    onError: (err: Error) => toast.error(err.message),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { invalidate(); toast.success(`${label} supprimé`) },
    onError: (err: Error) => toast.error(err.message),
  })

  return { query, create, update, remove, invalidate }
}

export function useClients() {
  return useCrud<Client>('clients', KEYS.clients, 'Client')
}

export function useTaches() {
  return useCrud<Tache>('taches', KEYS.taches, 'Tâche')
}

export function useEvenements() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: KEYS.evenements,
    queryFn: () => fetchTable<Evenement>('evenements'),
    staleTime: 20_000,
    retry: 1,
  })
  const create = useMutation({
    mutationFn: async (payload: Partial<Evenement>) => {
      const { data, error } = await supabase.from('evenements').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.evenements }); toast.success('Événement créé') },
    onError: (err: Error) => toast.error(err.message),
  })
  const update = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Evenement> }) => {
      const { error } = await supabase.from('evenements').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.evenements }); toast.success('Événement mis à jour') },
    onError: (err: Error) => toast.error(err.message),
  })
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('evenements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.evenements }); toast.success('Événement supprimé') },
    onError: (err: Error) => toast.error(err.message),
  })
  return { query, create, update, remove }
}

export function useCourriers() {
  const modeles = useCrud<CourrierModele>('courriers_modeles', KEYS.modeles, 'Modèle')
  const envoyes = useQuery({
    queryKey: KEYS.courriers,
    queryFn: () => fetchTable<CourrierEnvoye>('courriers_envoyes'),
    staleTime: 20_000,
    retry: 1,
  })
  const qc = useQueryClient()
  const envoyer = useMutation({
    mutationFn: async (payload: Partial<CourrierEnvoye>) => {
      const { data, error } = await supabase.from('courriers_envoyes').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.courriers }); toast.success('Courrier enregistré') },
    onError: (err: Error) => toast.error(err.message),
  })
  const removeEnvoye = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courriers_envoyes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.courriers }); toast.success('Courrier supprimé') },
    onError: (err: Error) => toast.error(err.message),
  })
  return { modeles, envoyes, envoyer, removeEnvoye }
}

export function useContacts() {
  return useCrud<ContactAdmin>('contacts_administrations', KEYS.contacts, 'Contact')
}

export function useFinance() {
  const devis = useCrud<Devis>('devis', KEYS.devis, 'Devis')
  const factures = useCrud<Facture>('factures', KEYS.factures, 'Facture')
  const qc = useQueryClient()
  const reglements = useQuery({
    queryKey: KEYS.reglements,
    queryFn: () => fetchTable<Reglement>('reglements'),
    staleTime: 20_000,
    retry: 1,
  })
  const addReglement = useMutation({
    mutationFn: async (payload: Partial<Reglement>) => {
      const { data, error } = await supabase.from('reglements').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.reglements })
      qc.invalidateQueries({ queryKey: KEYS.factures })
      toast.success('Règlement enregistré')
    },
    onError: (err: Error) => toast.error(err.message),
  })
  const removeReglement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reglements').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.reglements })
      toast.success('Règlement supprimé')
    },
    onError: (err: Error) => toast.error(err.message),
  })
  return { devis, factures, reglements, addReglement, removeReglement }
}

export function useCabinet() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: KEYS.cabinet,
    queryFn: async (): Promise<CabinetInfo> => {
      const { data, error } = await supabase.from('parametres_bureau').select('*').eq('cle', 'cabinet').maybeSingle()
      if (error) throw error
      const v = (data?.valeur || {}) as Partial<CabinetInfo>
      return {
        nom: v.nom || 'Bureau de Géomètre-Expert',
        adresse: v.adresse || '',
        telephone: v.telephone || '',
        email: v.email || '',
        nif: v.nif || '',
        wilaya: v.wilaya || 'Alger',
      }
    },
    staleTime: 60_000,
    retry: 1,
  })
  const save = useMutation({
    mutationFn: async (valeur: CabinetInfo) => {
      const { error } = await supabase.from('parametres_bureau').upsert({
        cle: 'cabinet',
        valeur,
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEYS.cabinet }); toast.success('Identité du cabinet enregistrée') },
    onError: (err: Error) => toast.error(err.message),
  })
  return { query, save }
}

export function nextReference(existing: string[], prefix: string) {
  const year = new Date().getFullYear()
  const head = `${prefix}-${year}-`
  const nums = existing
    .filter(r => r.startsWith(head))
    .map(r => parseInt(r.replace(head, ''), 10))
    .filter(n => !Number.isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `${head}${String(next).padStart(3, '0')}`
}
