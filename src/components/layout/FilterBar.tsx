import { useAppStore } from '@/store/appStore'
import { useFilters } from '@/hooks/useFilters'
import { ViewMode } from '@/types'
import { DEPOT_OPTIONS } from '@/lib/status'
import { Search, X } from 'lucide-react'

const VIEW_TABS: { key: ViewMode; label: string }[] = [
  { key: 'actifs', label: 'Actifs' },
  { key: 'archives', label: 'Archives' },
  { key: 'corbeille', label: 'Corbeille' },
  { key: 'retards', label: 'En retard' },
  { key: 'impayes', label: 'Impayés' },
]

export default function FilterBar() {
  const { filters, setFilter, resetFilters } = useAppStore()
  const { locations } = useFilters()
  const hasActiveFilters =
    filters.search || filters.endroit || filters.depotCad || filters.includeArchived

  return (
    <div className="filter-bar">
      {/* Search */}
      <div className="filter-search">
        <Search size={13} className="filter-search-icon" />
        <input
          type="text"
          placeholder="Rechercher ID, client, endroit..."
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
        />
      </div>

      {/* Location */}
      <select
        className="filter-select"
        value={filters.endroit}
        onChange={e => setFilter('endroit', e.target.value)}
        style={{ minWidth: 130 }}
      >
        <option value="">Tous les endroits</option>
        {locations.map(loc => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </select>

      {/* Depot CAD */}
      <select
        className="filter-select"
        value={filters.depotCad}
        onChange={e => setFilter('depotCad', e.target.value)}
        style={{ minWidth: 130 }}
      >
        <option value="">Dépôt CAD (tous)</option>
        {DEPOT_OPTIONS.filter(Boolean).map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>

      {/* View tabs */}
      <div className="view-tabs">
        {VIEW_TABS.map(tab => (
          <button
            key={tab.key}
            className={`view-tab ${filters.viewMode === tab.key ? 'active' : ''}`}
            onClick={() => setFilter('viewMode', tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toggles */}
      <label className="filter-toggle">
        <input
          type="checkbox"
          checked={filters.includeArchived}
          onChange={e => setFilter('includeArchived', e.target.checked)}
        />
        Inclure archivés
      </label>

      <label className="filter-toggle">
        <input
          type="checkbox"
          checked={filters.showRemaining}
          onChange={e => setFilter('showRemaining', e.target.checked)}
        />
        Afficher reste
      </label>

      <div className="filter-spacer" />

      {/* Reset */}
      {hasActiveFilters && (
        <button className="btn btn-sm" onClick={resetFilters} title="Réinitialiser les filtres (Échap)">
          <X size={12} /> Reset
        </button>
      )}
    </div>
  )
}
