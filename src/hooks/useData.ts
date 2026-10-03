import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, CLIENT_COLS, type Client, type Dossier, type Mouvement } from '@/lib/supabase'

const CLIENTS = ['clients']
const DOSSIERS = ['dossiers']
const MOUVEMENTS = ['mouvements']

export function useClients() {
  return useQuery({
    queryKey: CLIENTS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(CLIENT_COLS)
        .order('nom')
        .limit(5000)
      if (error) throw error
      return data as Client[]
    },
  })
}

export function useDossiers() {
  return useQuery({
    queryKey: DOSSIERS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .select('id, nom, endroit, etat, observations, archived, created_at')
        .eq('in_trash', false)
        .limit(10000)
      if (error) throw error
      return data as Dossier[]
    },
  })
}

// Historique des sorties / retours d'archive d'un client (plus récent d'abord)
export function useMouvements(clientId: string) {
  return useQuery({
    queryKey: [...MOUVEMENTS, clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_mouvements')
        .select('id, client_id, type, motif, par, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Mouvement[]
    },
  })
}

export type ClientInput = Pick<Client, 'nom' | 'telephone' | 'adresse' | 'observation' | 'code' | 'numero' | 'boite'>

export function useClientMutations() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: CLIENTS })

  const create = useMutation({
    mutationFn: async (input: ClientInput) => {
      const { data, error } = await supabase.from('clients')
        .insert({ ...input, date_archivage: new Date().toISOString().slice(0, 10) })
        .select(CLIENT_COLS).single()
      if (error) throw friendly(error)
      return data as Client
    },
    onSuccess: refresh,
  })

  const update = useMutation({
    mutationFn: async ({ id, oldNom, ...patch }: Partial<ClientInput> & { id: string; oldNom?: string }) => {
      const { error } = await supabase.from('clients').update(patch).eq('id', id)
      if (error) throw friendly(error)
      // Les dossiers sont rattachés par nom : on les renomme aussi
      if (patch.nom && oldNom && patch.nom !== oldNom) {
        const r = await supabase.from('dossiers').update({ nom: patch.nom }).eq('nom', oldNom)
        if (r.error) throw r.error
      }
    },
    onSuccess: () => { refresh(); qc.invalidateQueries({ queryKey: DOSSIERS }) },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: refresh,
  })

  // Sortie ou retour du dossier physique, avec trace dans l'historique
  const move = useMutation({
    mutationFn: async ({ id, type, motif }: { id: string; type: Mouvement['type']; motif: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser()
      const m = await supabase.from('client_mouvements').insert({ client_id: id, type, motif, par: user?.email ?? null })
      if (m.error) throw m.error
      const { error } = await supabase.from('clients').update({ en_archive: type === 'retour' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, v) => { refresh(); qc.invalidateQueries({ queryKey: [...MOUVEMENTS, v.id] }) },
  })

  return { create, update, remove, move }
}

function friendly(error: { code?: string; message: string }) {
  if (error.code === '23505') {
    if (error.message.includes('numero')) return new Error('Ce n° de classement est déjà attribué à un autre client.')
    if (error.message.includes('code')) return new Error('Ce code client est déjà utilisé.')
  }
  return new Error(error.message)
}

type DossierInput = Pick<Dossier, 'id' | 'nom' | 'endroit' | 'etat' | 'observations' | 'archived'>

export function useDossierMutations() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: DOSSIERS })

  const create = useMutation({
    mutationFn: async (input: DossierInput) => {
      const { error } = await supabase.from('dossiers').insert({
        ...input,
        date_archive: input.archived ? new Date().toISOString().slice(0, 10) : null,
      })
      if (error) throw error
    },
    onSuccess: refresh,
  })

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DossierInput> & { id: string }) => {
      const { error } = await supabase.from('dossiers').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: refresh,
  })

  return { create, update }
}
