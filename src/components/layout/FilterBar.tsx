import { useAppStore } from '@/store/appStore'
import { useFilters } from '@/hooks/useFilters'
import { ViewMode } from '@/types'
import { DEPOT_OPTIONS } from '@/lib/status'
import { Search, X, Filter, SlidersHorizontal, CheckCircle, Clock, AlertTriangle, DollarSign, Trash2, Archive, Layers } from 'lucide-react'

const VIEW_TABS: { key: ViewMode; label: string; icon: any }[] = [
  { key: 'actifs', label: 'Actifs', icon: Layers },
  { key: 'retards', label: 'En retard', icon: AlertTriangle },
  { key: 'impayes', label: 'Impayés', icon: DollarSign },
  { key: 'archives', label: 'Archives', icon: Archive },
  { key: 'corbeille', label: 'Corbeille', icon: Trash2 },
]

export default function FilterBar() {
  const { filters, setFilter, resetFilters } = useAppStore()
  const { locations, counts } = useFilters()
  
  const hasActiveFilters = Boolean(
    filters.search || filters.endroit || filters.depotCad || filters.includeArchived
  )

  const activeFilterCount = [
    Boolean(filters.search),
    Boolean(filters.endroit),
    Boolean(filters.depotCad),
    Boolean(filters.includeArchived),
  ].filter(Boolean).length

  return (
    <div className="filter-bar">
      {/* Search Input with Clear Button */}
      <div className="filter-search">
        <Search size={14} className="filter-search-icon" />
        <input
          type="text"
          placeholder="Rechercher par N° dossier, nom, endroit, tél..."
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
        />
        {filters.search && (
          <X
            size={14}
            className="filter-clear-icon"
            onClick={() => setFilter('search', '')}
            aria-label="Effacer la recherche"
          />
        )}
      </div>

      {/* Location Filter */}
      <select
        className="filter-select"
        value={filters.endroit}
        onChange={e => setFilter('endroit', e.target.value)}
        style={{ minWidth: 140 }}
      >
        <option value="">📍 Toutes localités</option>
        {locations.map(loc => (
          <option key={loc} value={loc}>{loc}</option>
        ))}
      </select>

      {/* Depot CAD Filter */}
      <select
        className="filter-select"
        value={filters.depotCad}
        onChange={e => setFilter('depotCad', e.target.value)}
        style={{ minWidth: 140 }}
      >
        <option value="">📑 Dépôt CAD (Tous)</option>
        {DEPOT_OPTIONS.filter(Boolean).map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>

      {/* View Mode Segmented Control */}
      <div className="view-tabs">
        {VIEW_TABS.map(tab => {
          const Icon = tab.icon
          const count = counts[tab.key] ?? 0
          const isActive = filters.viewMode === tab.key
          return (
            <button
              key={tab.key}
              className={`view-tab ${isActive ? 'active' : ''}`}
              onClick={() => setFilter('viewMode', tab.key)}
              title={`Afficher la vue ${tab.label}`}
            >
              <Icon size={12} style={{ opacity: isActive ? 1 : 0.7 }} />
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 5px',
                  borderRadius: 10,
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-3)',
                  color: isActive ? '#fff' : 'var(--text-3)',
                  fontWeight: 700,
                  marginLeft: 2,
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Quick Toggles */}
      <label className="filter-toggle" title="Inclure également les dossiers archivés dans la vue active">
        <input
          type="checkbox"
          checked={filters.includeArchived}
          onChange={e => setFilter('includeArchived', e.target.checked)}
        />
        <span>Inclure archivés</span>
      </label>

      <label className="filter-toggle" title="Basculer l'affichage du montant vers le reste à payer">
        <input
          type="checkbox"
          checked={filters.showRemaining}
          onChange={e => setFilter('showRemaining', e.target.checked)}
        />
        <span>Afficher reste</span>
      </label>

      <div className="filter-spacer" />

      {/* Reset Filters CTA */}
      {hasActiveFilters && (
        <button
          className="btn btn-sm"
          onClick={resetFilters}
          title="Réinitialiser tous les filtres (Échap)"
          style={{
            background: 'var(--red-dim)',
            color: 'var(--red)',
            borderColor: 'rgba(244, 63, 94, 0.25)'
          }}
        >
          <X size={12} />
          <span>Effacer filtres</span>
          <span style={{
            background: 'var(--red)',
            color: '#fff',
            borderRadius: '50%',
            width: 15,
            height: 15,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9.5,
            fontWeight: 700
          }}>
            {activeFilterCount}
          </span>
        </button>
      )}
    </div>
  )
}
