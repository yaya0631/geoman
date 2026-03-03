import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  Dossier,
  FilterState,
  SortField,
  SortDir,
  ColumnConfig,
  AppSettings,
  UndoAction,
  ViewMode,
} from '@/types'

interface AppState {
  // Data
  dossiers: Dossier[]
  setDossiers: (dossiers: Dossier[]) => void
  updateDossier: (id: string, updates: Partial<Dossier>) => void
  addDossier: (dossier: Dossier) => void
  removeDossier: (id: string) => void

  // Selection
  selectedIds: Set<string>
  setSelectedIds: (ids: Set<string>) => void
  toggleSelected: (id: string) => void
  clearSelection: () => void
  lastSelectedId: string | null
  setLastSelectedId: (id: string | null) => void

  // Filters
  filters: FilterState
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void

  // Sort
  sortField: SortField
  sortDir: SortDir
  setSortField: (field: SortField) => void
  toggleSortDir: () => void

  // Columns
  columns: ColumnConfig[]
  setColumns: (columns: ColumnConfig[]) => void
  toggleColumn: (key: string) => void

  // Settings
  settings: AppSettings
  updateSettings: (updates: Partial<AppSettings>) => void

  // Undo
  undoAction: UndoAction | null
  setUndoAction: (action: UndoAction | null) => void

  // UI state
  isLoading: boolean
  setLoading: (loading: boolean) => void
  connectionStatus: 'connected' | 'error' | 'connecting'
  setConnectionStatus: (s: 'connected' | 'error' | 'connecting') => void

  // Modals
  modalOpen: string | null
  setModalOpen: (modal: string | null) => void
  editingDossierId: string | null
  setEditingDossierId: (id: string | null) => void

  // Recents
  recentIds: string[]
  addRecent: (id: string) => void

  // Theme
  theme: 'dark' | 'light'
  toggleTheme: () => void
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  endroit: '',
  depotCad: '',
  viewMode: 'actifs',
  includeArchived: false,
  showRemaining: false,
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'row', label: '#', visible: true, width: 50 },
  { key: 'id', label: 'Dossier', visible: true, width: 120 },
  { key: 'nom', label: 'Client', visible: true, width: 180 },
  { key: 'endroit', label: 'Endroit', visible: true, width: 140 },
  { key: 'date_finale', label: 'Échéance', visible: true, width: 110 },
  { key: 'telephone', label: 'Téléphone', visible: true, width: 120 },
  { key: 'montant', label: 'Montant', visible: true, width: 130 },
  { key: 'acte', label: 'Acte', visible: true, width: 60 },
  { key: 'regul', label: 'Régul.', visible: true, width: 60 },
  { key: 'agricole', label: 'Agric.', visible: false, width: 60 },
  { key: 'depot_cad', label: 'Dép. CAD', visible: true, width: 120 },
  { key: 'depot_domain', label: 'Dép. Domain', visible: false, width: 120 },
  { key: 'date_archive', label: 'Archivé le', visible: false, width: 110 },
  { key: 'etat', label: 'État', visible: true, width: 130 },
  { key: 'observations', label: 'Observations', visible: true, width: 200 },
]

const DEFAULT_SETTINGS: AppSettings = {
  showRemindersOnStart: true,
  confirmBeforeDelete: true,
  theme: 'dark',
  defaultSort: 'id',
  defaultSortDir: 'desc',
  overdueThresholdDays: 7,
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      dossiers: [],
      setDossiers: (dossiers) => set({ dossiers }),
      updateDossier: (id, updates) =>
        set(s => ({
          dossiers: s.dossiers.map(d => (d.id === id ? { ...d, ...updates } : d)),
        })),
      addDossier: (dossier) =>
        set(s => ({ dossiers: [dossier, ...s.dossiers] })),
      removeDossier: (id) =>
        set(s => ({ dossiers: s.dossiers.filter(d => d.id !== id) })),

      selectedIds: new Set(),
      setSelectedIds: (ids) => set({ selectedIds: ids }),
      toggleSelected: (id) =>
        set(s => {
          const ids = new Set(s.selectedIds)
          ids.has(id) ? ids.delete(id) : ids.add(id)
          return { selectedIds: ids }
        }),
      clearSelection: () => set({ selectedIds: new Set() }),
      lastSelectedId: null,
      setLastSelectedId: (id) => set({ lastSelectedId: id }),

      filters: DEFAULT_FILTERS,
      setFilter: (key, value) =>
        set(s => ({ filters: { ...s.filters, [key]: value } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      sortField: 'id',
      sortDir: 'desc',
      setSortField: (field) =>
        set(s => ({
          sortField: field,
          sortDir: s.sortField === field
            ? s.sortDir === 'asc' ? 'desc' : 'asc'
            : 'asc',
        })),
      toggleSortDir: () =>
        set(s => ({ sortDir: s.sortDir === 'asc' ? 'desc' : 'asc' })),

      columns: DEFAULT_COLUMNS,
      setColumns: (columns) => set({ columns }),
      toggleColumn: (key) =>
        set(s => ({
          columns: s.columns.map(c =>
            c.key === key ? { ...c, visible: !c.visible } : c
          ),
        })),

      settings: DEFAULT_SETTINGS,
      updateSettings: (updates) =>
        set(s => ({ settings: { ...s.settings, ...updates } })),

      undoAction: null,
      setUndoAction: (action) => set({ undoAction: action }),

      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),
      connectionStatus: 'connecting',
      setConnectionStatus: (s) => set({ connectionStatus: s }),

      modalOpen: null,
      setModalOpen: (modal) => set({ modalOpen: modal }),
      editingDossierId: null,
      setEditingDossierId: (id) => set({ editingDossierId: id }),

      recentIds: [],
      addRecent: (id) =>
        set(s => {
          const filtered = s.recentIds.filter(r => r !== id)
          return { recentIds: [id, ...filtered].slice(0, 10) }
        }),

      theme: 'dark',
      toggleTheme: () =>
        set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'geoman-storage',
      partialize: (s) => ({
        columns: s.columns,
        settings: s.settings,
        recentIds: s.recentIds,
        theme: s.theme,
        sortField: s.sortField,
        sortDir: s.sortDir,
      }),
    }
  )
)
