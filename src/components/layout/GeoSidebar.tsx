import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { useFilters } from '@/hooks/useFilters'
import { useAuth } from '@/hooks/useAuth'
import { ViewMode } from '@/types'
import '@/styles/geo-skin.css'
import { MapPin, ChevronDown, Bell, ChevronsLeft, ChevronsRight } from 'lucide-react'

// Barre latérale inspirée de la vue « Suivi des dossiers clients ».
// Purement visuelle : elle pilote uniquement les filtres et modales existants du store.
const VUES: { key: ViewMode; label: string }[] = [
  { key: 'actifs', label: 'Suivi des Dossiers - Vue d’Avancement' },
  { key: 'retards', label: 'Dossiers en retard' },
  { key: 'impayes', label: 'Dossiers impayés' },
  { key: 'archives', label: 'Archives' },
  { key: 'corbeille', label: 'Corbeille' },
]

export default function GeoSidebar() {
  const { filters, setFilter, setModalOpen, connectionStatus } = useAppStore()
  const { counts } = useFilters()
  const { session } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('geoman-sidebar') === '1')
  useEffect(() => { localStorage.setItem('geoman-sidebar', collapsed ? '1' : '0') }, [collapsed])

  const initial = (session?.user?.email || 'L').charAt(0).toUpperCase()
  const alertes = counts.retards ?? 0
  const items = useMemo(() => [
    { abbr: 'Ta', label: 'Tableau de bord', onClick: () => setModalOpen('dashboard') },
    { abbr: 'Ra', label: 'Rappels & échéances', onClick: () => setModalOpen('reminders') },
    { abbr: 'Pa', label: 'Paramètres', onClick: () => setModalOpen('settings') },
  ], [setModalOpen])

  if (collapsed) {
    return (
      <aside className="geo-side geo-side-collapsed">
        <MapPin size={18} />
        <button className="geo-side-collapse" onClick={() => setCollapsed(false)} title="Déplier le menu"><ChevronsRight size={15} /></button>
      </aside>
    )
  }

  return (
    <aside className="geo-side">
      <div className="geo-side-brand">
        <MapPin size={19} strokeWidth={1.8} />
        <span>Suivi des dossiers clients <ChevronDown size={14} /></span>
      </div>

      <nav className="geo-side-nav">
        <div className="geo-side-item active"><span className="geo-abbr">Su</span>Suivi des dossiers</div>
        <div className="geo-side-tree">
          {VUES.map(v => (
            <button key={v.key} className={`geo-side-sub ${filters.viewMode === v.key ? 'active' : ''}`} onClick={() => setFilter('viewMode', v.key)} title={v.label}>
              <span>{v.label}</span>
              <em>{counts[v.key] ?? 0}</em>
            </button>
          ))}
        </div>
        {items.map(i => (
          <button key={i.label} className="geo-side-item" onClick={i.onClick}><span className="geo-abbr">{i.abbr}</span>{i.label}</button>
        ))}
      </nav>

      <div className="geo-side-foot">
        <div className="geo-side-conn">
          <span className={`conn-dot ${connectionStatus}`} />
          {connectionStatus === 'connected' ? 'Synchronisé avec Supabase' : connectionStatus === 'error' ? 'Hors ligne' : 'Connexion…'}
        </div>
        <div className="geo-side-bar">
          <span className="geo-avatar">{initial}</span>
          <button className="geo-side-share" onClick={() => setModalOpen('export')}>Partager</button>
          <button className="geo-side-bell" onClick={() => setModalOpen('reminders')} title="Alertes d’échéance">
            <Bell size={15} />
            {alertes > 0 && <span>{alertes > 9 ? '9+' : alertes}</span>}
          </button>
          <button className="geo-side-collapse" onClick={() => setCollapsed(true)} title="Replier le menu"><ChevronsLeft size={15} /></button>
        </div>
      </div>
    </aside>
  )
}
