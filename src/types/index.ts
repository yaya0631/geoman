export type DepotStatus = 'Depose' | 'Non depose' | 'Depose 2eme fois' | ''

export type DossierEtat =
  | 'En retard'
  | 'Echeance proche'
  | 'Solde partiel'
  | 'Termine'
  | 'En attente'
  | 'Bloque'
  | 'Archive'
  | 'actif'

export interface Paiement {
  id: string
  dossier_id: string
  date: string
  montant: number
  note?: string
  created_at: string
}

export interface Fichier {
  id: string
  dossier_id: string
  nom_fichier: string
  storage_path: string
  taille?: number
  type_mime?: string
  uploaded_at: string
}

export interface HistoriqueEntry {
  id: string
  dossier_id: string
  action: string
  details?: Record<string, unknown>
  created_at: string
}

export interface Dossier {
  id: string
  nom: string
  endroit?: string
  telephone?: string
  date_finale?: string
  montant: number
  acte: boolean
  regul: boolean
  agricole: boolean
  depot_cad: DepotStatus
  depot_domain: DepotStatus
  etat: DossierEtat
  observations?: string
  archived: boolean
  in_trash: boolean
  date_archive?: string
  created_at: string
  updated_at: string
  paiements?: Paiement[]
  fichiers?: Fichier[]
  historique?: HistoriqueEntry[]
}

export type ViewMode = 'actifs' | 'archives' | 'corbeille' | 'retards' | 'impayes'

export type SortField = keyof Dossier | 'encaisse' | 'reste'
export type SortDir = 'asc' | 'desc'

export interface FilterState {
  search: string
  endroit: string
  depotCad: string
  viewMode: ViewMode
  includeArchived: boolean
  showRemaining: boolean
  dateFrom?: string
  dateTo?: string
}

export interface AppSettings {
  showRemindersOnStart: boolean
  confirmBeforeDelete: boolean
  theme: 'dark' | 'light'
  defaultSort: SortField
  defaultSortDir: SortDir
  overdueThresholdDays: number
}

export interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  width?: number
}

export interface UndoAction {
  type: 'trash' | 'archive' | 'unarchive' | 'restore'
  dossiers: Dossier[]
  timestamp: number
}

export interface ToastOptions {
  message: string
  type: 'ok' | 'err' | 'inf'
}

export interface User {
  id: string
  email: string
  role?: 'admin' | 'viewer'
}

export interface DashboardStats {
  total: number
  actifs: number
  archives: number
  corbeille: number
  enRetard: number
  termine: number
  totalMontant: number
  totalEncaisse: number
  totalReste: number
  byLocation: { endroit: string; count: number }[]
  byStatus: { etat: string; count: number }[]
  byMonth: { month: string; count: number }[]
}
