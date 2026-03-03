import { Dossier, DossierEtat } from '@/types'
import { differenceInDays, parseISO, isValid } from 'date-fns'

export function computeStatus(dossier: Dossier, encaisse: number): DossierEtat {
  if (dossier.archived) return 'Archive'
  if (dossier.etat === 'Bloque') return 'Bloque'
  if (dossier.etat === 'Termine') return 'Termine'

  if (dossier.date_finale) {
    try {
      const deadline = parseISO(dossier.date_finale)
      if (isValid(deadline)) {
        const diff = differenceInDays(deadline, new Date())
        if (diff < 0) return 'En retard'
        if (diff >= 0 && diff <= 7) return 'Echeance proche'
      }
    } catch {}
  }

  if (dossier.montant > 0 && encaisse > 0 && encaisse < dossier.montant) {
    return 'Solde partiel'
  }

  return dossier.etat === 'En attente' ? 'En attente' : 'actif'
}

export function getRowColor(status: DossierEtat): string {
  switch (status) {
    case 'En retard': return 'row-overdue'
    case 'Echeance proche': return 'row-soon'
    case 'Solde partiel': return 'row-partial'
    case 'Termine': return 'row-done'
    case 'En attente': return 'row-waiting'
    case 'Bloque': return 'row-blocked'
    case 'Archive': return 'row-archived'
    default: return ''
  }
}

export function getStatusLabel(status: DossierEtat): string {
  const labels: Record<DossierEtat, string> = {
    'En retard': 'En retard',
    'Echeance proche': 'Échéance proche',
    'Solde partiel': 'Soldé partiel',
    'Termine': 'Terminé',
    'En attente': 'En attente',
    'Bloque': 'Bloqué',
    'Archive': 'Archivé',
    'actif': 'Actif',
  }
  return labels[status] || status
}

export const STATUS_OPTIONS: DossierEtat[] = [
  'actif',
  'En attente',
  'Termine',
  'Bloque',
  'En retard',
  'Echeance proche',
  'Solde partiel',
  'Archive',
]

export const DEPOT_OPTIONS = ['', 'Depose', 'Non depose', 'Depose 2eme fois'] as const
