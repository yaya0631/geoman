import { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { filterDossiers, sortDossiers, getUniqueLocations, getEncaisse, getReste } from '@/lib/utils'
import { computeStatus } from '@/lib/status'

export function useFilters() {
  const dossiers = useAppStore(s => s.dossiers)
  const filters = useAppStore(s => s.filters)
  const sortField = useAppStore(s => s.sortField)
  const sortDir = useAppStore(s => s.sortDir)

  const filtered = useMemo(
    () => filterDossiers(dossiers, filters),
    [dossiers, filters]
  )

  const sorted = useMemo(
    () => sortDossiers(filtered, sortField, sortDir),
    [filtered, sortField, sortDir]
  )

  const locations = useMemo(() => getUniqueLocations(dossiers), [dossiers])

  const counts = useMemo(() => {
    const active = dossiers.filter(d => !d.in_trash && !d.archived)
    const actifs = active.length
    const archives = dossiers.filter(d => d.archived && !d.in_trash).length
    const corbeille = dossiers.filter(d => d.in_trash).length
    const retards = active.filter(d => computeStatus(d, getEncaisse(d)) === 'En retard').length
    const impayes = active.filter(d => getReste(d) > 0).length
    return { actifs, archives, corbeille, retards, impayes, total: dossiers.length }
  }, [dossiers])

  return { filtered: sorted, locations, counts }
}
