import { useState, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { computeStatus } from '@/lib/status'
import { getEncaisse } from '@/lib/utils'
import {
  Sun, Moon, Bell, Clock, LogOut, LayoutDashboard, ChevronDown, Settings,
  Search, ShieldCheck, FolderOpen, MapPin, CheckCircle2, AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const { theme, toggleTheme, recentIds, dossiers, setModalOpen, connectionStatus, addRecent, setEditingDossierId } = useAppStore()
  const [showRecents, setShowRecents] = useState(false)
  const recentRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Calculate urgent / overdue alerts
  const urgentCount = useMemo(() => {
    return dossiers.filter(d => {
      if (d.in_trash || d.archived) return false
      const s = computeStatus(d, getEncaisse(d))
      return s === 'En retard' || s === 'Echeance proche'
    }).length
  }, [dossiers])

  const recentDossiers = recentIds
    .map(id => dossiers.find(d => d.id === id))
    .filter(Boolean)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const isHome = location.pathname === '/'

  return (
    <header className="navbar">
      {/* Brand & Workspace */}
      <div className="navbar-brand-group">
        <div className="navbar-logo-badge" title="GeoMan Enterprise Suite">
          GM
        </div>
        <div className="navbar-title-wrap">
          <div className="navbar-logo-text">
            GEOMAN <span className="navbar-badge-pro">PRO</span>
          </div>
          <div className="navbar-logo-sub">SYSTÈME FONCIER & CADASTRE</div>
        </div>

        <div className="navbar-workspace-chip" title="Espace de travail actif">
          <MapPin size={12} style={{ color: 'var(--acc)' }} />
          <span>Bureau Central — Alger</span>
        </div>
      </div>

      <div className="navbar-sep" />

      {/* Main Navigation Tabs */}
      <div className="navbar-nav-pills">
        <button
          className={`nav-pill-btn ${isHome ? 'active' : ''}`}
          onClick={() => navigate('/')}
          title="Gestion des dossiers"
        >
          <FolderOpen size={14} />
          <span>Dossiers</span>
        </button>

        <button
          className="nav-pill-btn"
          onClick={() => setModalOpen('dashboard')}
          title="Tableau de bord analytique (F5)"
        >
          <LayoutDashboard size={14} />
          <span>Dashboard</span>
        </button>

        <button
          className="nav-pill-btn"
          onClick={() => setModalOpen('reminders')}
          title="Rappels & alertes d'échéance (Ctrl+R)"
          style={{ position: 'relative' }}
        >
          <Bell size={14} />
          <span>Rappels</span>
          {urgentCount > 0 && (
            <span className="nav-badge-count" title={`${urgentCount} alertes actives`}>
              {urgentCount}
            </span>
          )}
        </button>
      </div>

      <div className="navbar-spacer" />

      {/* Quick Search Trigger */}
      <button
        className="btn btn-ghost"
        onClick={() => setModalOpen('command-palette')}
        title="Recherche globale & Commandes (Ctrl+K)"
        style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          height: 32,
          padding: '0 10px',
          gap: 8,
          color: 'var(--text-3)'
        }}
      >
        <Search size={13} />
        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Rechercher...</span>
        <kbd className="kbd-shortcut">Ctrl+K</kbd>
      </button>

      {/* Connection Indicator */}
      <div
        className="status-item"
        style={{
          background: 'var(--bg-2)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          gap: 6,
        }}
        title={connectionStatus === 'connected' ? 'Base de données synchronisée' : 'Connexion en cours'}
      >
        <span className={`conn-dot ${connectionStatus}`} />
        <span style={{ fontSize: 11, fontWeight: 600, color: connectionStatus === 'connected' ? 'var(--green)' : 'var(--text-3)' }}>
          {connectionStatus === 'connected' ? 'En ligne' : connectionStatus === 'error' ? 'Hors-ligne' : 'Connexion...'}
        </span>
      </div>

      <div className="navbar-sep" />

      {/* Recents Dropdown */}
      <div style={{ position: 'relative' }} ref={recentRef}>
        <button
          className="btn btn-ghost"
          onClick={() => setShowRecents(!showRecents)}
          title="Historique des dossiers récemment consultés"
          style={{ gap: 6, height: 32 }}
        >
          <Clock size={13} />
          <span>Récents</span>
          <ChevronDown size={12} style={{ opacity: 0.7 }} />
        </button>
        {showRecents && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowRecents(false)} />
            <div className="dropdown" style={{ zIndex: 50, minWidth: 260 }}>
              <div className="dropdown-header">Dossiers récents</div>
              {recentDossiers.length === 0 ? (
                <div style={{ padding: '12px 14px', color: 'var(--text-3)', fontSize: 12, textAlign: 'center' }}>
                  Aucun dossier récemment consulté
                </div>
              ) : recentDossiers.map(d => d && (
                <div
                  key={d.id}
                  className="dropdown-item"
                  onClick={() => {
                    setShowRecents(false)
                    addRecent(d.id)
                    setEditingDossierId(d.id)
                    setModalOpen('edit-dossier')
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--acc)', fontWeight: 600 }}>{d.id}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nom}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Theme Toggle */}
      <button
        className="btn btn-icon btn-ghost"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
      >
        {theme === 'dark' ? <Sun size={15} style={{ color: 'var(--yellow)' }} /> : <Moon size={15} style={{ color: 'var(--acc)' }} />}
      </button>

      {/* Settings */}
      <button
        className="btn btn-icon btn-ghost"
        onClick={() => setModalOpen('settings')}
        title="Paramètres de l'application"
      >
        <Settings size={15} />
      </button>

      {/* Logout */}
      <button
        className="btn btn-icon btn-ghost btn-danger"
        onClick={handleLogout}
        title="Déconnexion sécurisée"
      >
        <LogOut size={15} />
      </button>
    </header>
  )
}
