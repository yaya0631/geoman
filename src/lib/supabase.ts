import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Client = {
  id: string
  nom: string
  telephone: string | null
  adresse: string | null
  observation: string | null
  code: string | null
  numero: number | null
  boite: number | null
  date_archivage: string | null
  en_archive: boolean
  created_at: string
}

export type Mouvement = {
  id: string
  client_id: string
  type: 'sortie' | 'retour'
  motif: string | null
  par: string | null
  created_at: string
}

export const CLIENT_COLS = 'id, nom, telephone, adresse, observation, code, numero, boite, date_archivage, en_archive, created_at'

export type Dossier = {
  id: string
  nom: string
  endroit: string | null
  etat: string
  observations: string | null
  archived: boolean
  created_at: string
}

export type Statut = 'actif' | 'instance' | 'archive'

export function statutOf(d: Pick<Dossier, 'etat' | 'archived'>): Statut {
  if (d.archived || d.etat === 'Termine') return 'archive'
  if (d.etat === 'En attente') return 'instance'
  return 'actif'
}

// Au-delà de ce délai, un dossier sorti est signalé en retard
export const RETARD_JOURS = 30
export const joursDepuis = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)

// Types d'objet repris de l'ancienne base Access
export const OBJETS = [
  'ED — État descriptif', 'EDD — État descriptif de division', 'M — Morcellement', 'ID — Identification',
  'R — Rétablissement de limites', 'DA — Délimitation', 'Bornage', 'Lotissement', 'Levé topographique',
  'Implantation', 'Certificat de possession', 'Plan de situation', 'Division', 'Régularisation', 'Expertise', 'Cadastre',
]

export const STATUT_LABEL: Record<Statut, string> = {
  actif: 'En cours',
  instance: 'En instance',
  archive: 'Archivé',
}
