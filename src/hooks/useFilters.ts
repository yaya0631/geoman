import { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { filterDossiers, sortDossiers, getUniqueLocations } from '@/lib/utils'

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
    const actifs = dossiers.filter(d => !d.in_trash && !d.archived).length
    const archives = dossiers.filter(d => d.archived && !d.in_trash).length
    const corbeille = dossiers.filter(d => d.in_trash).length
    return { actifs, archives, corbeille, total: dossiers.length }
  }, [dossiers])

  return { filtered: sorted, locations, counts }
}
