import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Client, type Dossier } from '@/lib/supabase'

const CLIENTS = ['clients']
const DOSSIERS = ['dossiers']

export function useClients() {
  return useQuery({
    queryKey: CLIENTS,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom, telephone, adresse, observation, created_at')
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

type ClientInput = Pick<Client, 'nom' | 'telephone' | 'adresse' | 'observation'>

export function useClientMutations() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: CLIENTS })

  const create = useMutation({
    mutationFn: async (input: ClientInput) => {
      const { data, error } = await supabase.from('clients').insert(input).select().single()
      if (error) throw error
      return data as Client
    },
    onSuccess: refresh,
  })

  const update = useMutation({
    mutationFn: async ({ id, oldNom, ...patch }: Partial<ClientInput> & { id: string; oldNom?: string }) => {
      const { error } = await supabase.from('clients').update(patch).eq('id', id)
      if (error) throw error
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

  return { create, update, remove }
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
