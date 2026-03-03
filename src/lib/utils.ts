import { Dossier, FilterState, SortField, SortDir, Paiement } from '@/types'
import { computeStatus } from './status'

export function getEncaisse(dossier: Dossier): number {
  if (!dossier.paiements || dossier.paiements.length === 0) return 0
  return dossier.paiements.reduce((sum, p) => sum + (p.montant || 0), 0)
}

export function getReste(dossier: Dossier): number {
  return Math.max(0, dossier.montant - getEncaisse(dossier))
}

export function filterDossiers(dossiers: Dossier[], filters: FilterState): Dossier[] {
  return dossiers.filter(d => {
    // View mode filter
    if (filters.viewMode === 'corbeille') {
      if (!d.in_trash) return false
    } else if (filters.viewMode === 'archives') {
      if (!d.archived || d.in_trash) return false
    } else if (filters.viewMode === 'retards') {
      if (d.in_trash || d.archived) return false
      const enc = getEncaisse(d)
      const status = computeStatus(d, enc)
      if (status !== 'En retard') return false
    } else if (filters.viewMode === 'impayes') {
      if (d.in_trash || d.archived) return false
      const enc = getEncaisse(d)
      if (d.montant <= 0 || enc >= d.montant) return false
    } else {
      // actifs
      if (d.in_trash) return false
      if (d.archived && !filters.includeArchived) return false
    }

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const fields = [d.id, d.nom, d.endroit, d.telephone, d.observations]
      if (!fields.some(f => f?.toLowerCase().includes(q))) return false
    }

    // Location
    if (filters.endroit && d.endroit !== filters.endroit) return false

    // Depot CAD
    if (filters.depotCad && d.depot_cad !== filters.depotCad) return false

    return true
  })
}

export function sortDossiers(
  dossiers: Dossier[],
  sortField: SortField,
  sortDir: SortDir
): Dossier[] {
  return [...dossiers].sort((a, b) => {
    let aVal: unknown
    let bVal: unknown

    if (sortField === 'encaisse') {
      aVal = getEncaisse(a)
      bVal = getEncaisse(b)
    } else if (sortField === 'reste') {
      aVal = getReste(a)
      bVal = getReste(b)
    } else {
      aVal = a[sortField as keyof Dossier]
      bVal = b[sortField as keyof Dossier]
    }

    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc'
        ? aVal.localeCompare(bVal, 'fr')
        : bVal.localeCompare(aVal, 'fr')
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    }

    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      return sortDir === 'asc'
        ? Number(aVal) - Number(bVal)
        : Number(bVal) - Number(aVal)
    }

    return 0
  })
}

export function getUniqueLocations(dossiers: Dossier[]): string[] {
  const locs = dossiers
    .map(d => d.endroit)
    .filter((e): e is string => !!e && e.trim() !== '')
  return [...new Set(locs)].sort((a, b) => a.localeCompare(b, 'fr'))
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function uuid(): string {
  return crypto.randomUUID()
}
