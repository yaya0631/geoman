import { ReactNode, useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useAuth } from '@/hooks/useAuth'
import { useFilters } from '@/hooks/useFilters'
import { useCabinet } from '@/hooks/useOffice'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, FolderOpen, Users, CheckSquare, CalendarDays,
  Receipt, Mail, Landmark, Settings, Search, Sun, Moon, LogOut,
  Bell, ChevronLeft, ChevronRight, Command, ShieldCheck,
} from 'lucide-react'

const NAV = [
  { to: '/', label: 'Accueil', icon: LayoutDashboard, end: true },
  { to: '/dossiers', label: 'Dossiers', icon: FolderOpen },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/taches', label: 'Tâches', icon: CheckSquare },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/finance', label: 'Finance', icon: Receipt },
  { to: '/courriers', label: 'Courriers', icon: Mail },
  { to: '/contacts', label: 'Administrations', icon: Landmark },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme, setModalOpen, connectionStatus, dossiers } = useAppStore()
  const { counts } = useFilters()
  const { session } = useAuth()
  const { query: cabinet } = useCabinet()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('geoman-sidebar') === '1')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    localStorage.setItem('geoman-sidebar', collapsed ? '1' : '0')
  }, [collapsed])

  const cabinetName = cabinet.data?.nom || 'Bureau de Géomètre-Expert'
  const email = session?.user?.email || 'opérateur'
  const initials = email.slice(0, 2).toUpperCase()

  const badges = useMemo(() => ({
    dossiers: counts.actifs,
    retards: counts.retards,
  }), [counts])

  const pageTitle = useMemo(() => {
    const found = NAV.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))
    if (location.pathname.startsWith('/parametres')) return 'Paramètres'
    return found?.label || 'GeoMan'
  }, [location.pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const clock = now.toLocaleTimeString('fr-DZ', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('fr-DZ', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className={`shell ${collapsed ? 'shell-collapsed' : ''}`}>
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <div className="shell-logo">GM</div>
          {!collapsed && (
            <div className="shell-brand-text">
              <div className="shell-brand-name">GEOMAN</div>
              <div className="shell-brand-sub">Cabinet foncier</div>
            </div>
          )}
        </div>

        <nav className="shell-nav">
          {NAV.map(item => {
            const Icon = item.icon
            const badge = item.to === '/dossiers' && badges.retards > 0 ? badges.retards : undefined
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `shell-nav-item ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <Icon size={18} strokeWidth={1.8} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && badge ? <span className="shell-nav-badge">{badge}</span> : null}
              </NavLink>
            )
          })}
        </nav>

        <div className="shell-sidebar-foot">
          <NavLink to="/parametres" className={({ isActive }) => `shell-nav-item ${isActive ? 'active' : ''}`} title="Paramètres">
            <Settings size={18} strokeWidth={1.8} />
            {!collapsed && <span>Paramètres</span>}
          </NavLink>
          <button className="shell-collapse" onClick={() => setCollapsed(v => !v)} title={collapsed ? 'Déplier' : 'Replier'}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Replier le menu</span>}
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <div className="shell-topbar-left">
            <div className="shell-page-meta">
              <div className="shell-page-title">{pageTitle}</div>
              <div className="shell-page-sub">{cabinetName}</div>
            </div>
          </div>

          <button className="shell-search" onClick={() => setModalOpen('command-palette')} title="Recherche globale (Ctrl+K)">
            <Search size={14} />
            <span>Rechercher un dossier, client, commande…</span>
            <kbd>Ctrl K</kbd>
          </button>

          <div className="shell-topbar-right">
            <div className={`shell-conn ${connectionStatus}`}>
              <span className={`conn-dot ${connectionStatus}`} />
              <span>{connectionStatus === 'connected' ? 'Synchronisé' : connectionStatus === 'error' ? 'Hors ligne' : 'Connexion…'}</span>
            </div>

            <button className="btn btn-icon btn-ghost" onClick={() => navigate('/dossiers')} title="Alertes d'échéance">
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Bell size={16} />
                {badges.retards > 0 && <span className="shell-bell-dot" />}
              </span>
            </button>

            <button className="btn btn-icon btn-ghost" onClick={() => setModalOpen('command-palette')} title="Palette de commandes">
              <Command size={16} />
            </button>

            <button className="btn btn-icon btn-ghost" onClick={toggleTheme} title="Thème">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="shell-user">
              <div className="shell-avatar">{initials}</div>
              <div className="shell-user-meta">
                <div className="shell-user-name">{email.split('@')[0]}</div>
                <div className="shell-user-role">Opérateur</div>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={handleLogout} title="Déconnexion">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        <div className="shell-content">{children}</div>

        <footer className="shell-statusbar">
          <div className="status-item">
            <ShieldCheck size={12} />
            <span>Session sécurisée</span>
          </div>
          <span className="status-sep">|</span>
          <div className="status-item">
            <span>{dossiers.length} dossiers en base</span>
          </div>
          <span className="status-sep">|</span>
          <div className="status-item" style={{ textTransform: 'capitalize' }}>{dateStr}</div>
          <span className="version-badge">{clock} · GeoMan Cabinet</span>
        </footer>
      </div>
    </div>
  )
}
