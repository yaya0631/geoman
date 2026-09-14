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
  enableBrowserNotifications?: boolean
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

export type TachePriorite = 'Basse' | 'Normale' | 'Haute' | 'Urgente'
export type TacheStatut = 'À faire' | 'En cours' | 'Terminée' | 'Annulée'
export type DevisStatut = 'Brouillon' | 'Envoyé' | 'Accepté' | 'Refusé' | 'Expiré'
export type FactureStatut = 'Brouillon' | 'Émise' | 'Partielle' | 'Payée' | 'En retard' | 'Annulée'

export interface Client {
  id: string
  nom: string
  telephone?: string
  email?: string
  adresse?: string
  wilaya?: string
  commune?: string
  nif?: string
  observation?: string
  created_at: string
  updated_at: string
}

export interface Tache {
  id: string
  dossier_id?: string | null
  titre: string
  description?: string
  responsable?: string
  priorite: TachePriorite
  statut: TacheStatut
  echeance?: string | null
  terminee_at?: string | null
  created_at: string
  updated_at: string
}

export interface Evenement {
  id: string
  dossier_id?: string | null
  titre: string
  type: string
  date_debut: string
  date_fin?: string | null
  lieu?: string
  description?: string
  rappel_minutes?: number
  created_at: string
}

export interface CourrierModele {
  id: string
  nom: string
  categorie: string
  objet?: string
  contenu: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface CourrierEnvoye {
  id: string
  dossier_id?: string | null
  client_id?: string | null
  modele_id?: string | null
  destinataire?: string
  objet: string
  contenu: string
  date_envoi: string
  moyen: string
}

export interface ContactAdmin {
  id: string
  organisme: string
  service?: string
  wilaya?: string
  telephone?: string
  email?: string
  adresse?: string
  observation?: string
  created_at: string
}

export interface Devis {
  id: string
  reference: string
  dossier_id?: string | null
  client_id?: string | null
  date_devis: string
  validite_jours: number
  objet?: string
  montant_ht: number
  taxe: number
  montant_ttc: number
  statut: DevisStatut | string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Facture {
  id: string
  reference: string
  dossier_id?: string | null
  client_id?: string | null
  devis_id?: string | null
  date_facture: string
  echeance?: string | null
  objet?: string
  montant_ht: number
  taxe: number
  montant_ttc: number
  statut: FactureStatut | string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Reglement {
  id: string
  facture_id: string
  dossier_id?: string | null
  date_reglement: string
  montant: number
  mode: string
  reference?: string
  note?: string
  created_at: string
}

export interface CabinetInfo {
  nom: string
  adresse: string
  telephone: string
  email: string
  nif: string
  wilaya: string
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
