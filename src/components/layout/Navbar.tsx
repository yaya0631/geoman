import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import {
  Sun, Moon, Bell, Clock, LogOut, LayoutDashboard, ChevronDown, Settings
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const { theme, toggleTheme, recentIds, dossiers, setModalOpen, connectionStatus, addRecent } = useAppStore()
  const [showRecents, setShowRecents] = useState(false)
  const recentRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const recentDossiers = recentIds
    .map(id => dossiers.find(d => d.id === id))
    .filter(Boolean)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <div>
          <div className="navbar-logo-text">GEOMAN</div>
          <div className="navbar-logo-sub">v2.0 — DZ FONCIER</div>
        </div>
      </div>

      <div className="navbar-sep" />

      {/* Nav actions */}
      <button className="btn" onClick={() => navigate('/')} title="Dossiers">
        <span style={{ fontSize: 12 }}>📋</span> Dossiers
      </button>
      <button className="btn" onClick={() => setModalOpen('dashboard')} title="Tableau de bord (F5)">
        <LayoutDashboard size={13} /> Dashboard
      </button>
      <button className="btn" onClick={() => setModalOpen('reminders')} title="Rappels (Ctrl+R)">
        <Bell size={13} /> Rappels
      </button>

      <div className="navbar-spacer" />

      {/* Connection indicator */}
      <div className="status-item" style={{ gap: 5 }}>
        <span className={`conn-dot ${connectionStatus}`} />
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {connectionStatus === 'connected' ? 'Connecté' : connectionStatus === 'error' ? 'Erreur' : 'Connexion...'}
        </span>
      </div>

      <div className="navbar-sep" />

      {/* Recents */}
      <div style={{ position: 'relative' }} ref={recentRef}>
        <button className="btn" onClick={() => setShowRecents(!showRecents)}>
          <Clock size={13} />
          Récents
          <ChevronDown size={11} />
        </button>
        {showRecents && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowRecents(false)} />
            <div className="dropdown" style={{ zIndex: 50 }}>
              <div className="dropdown-header">Derniers consultés</div>
              {recentDossiers.length === 0 ? (
                <div style={{ padding: '10px 12px', color: 'var(--text-3)', fontSize: 12 }}>Aucun récent</div>
              ) : recentDossiers.map(d => d && (
                <div
                  key={d.id}
                  className="dropdown-item"
                  onClick={() => {
                    setShowRecents(false)
                    addRecent(d.id)
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--acc)' }}>{d.id}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{d.nom}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Theme toggle */}
      <button className="btn btn-icon" onClick={toggleTheme} title="Changer le thème">
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* Settings */}
      <button className="btn btn-icon" onClick={() => setModalOpen('settings')} title="Paramètres">
        <Settings size={14} />
      </button>

      {/* Logout */}
      <button className="btn btn-icon" onClick={handleLogout} title="Déconnexion">
        <LogOut size={14} />
      </button>
    </header>
  )
}
