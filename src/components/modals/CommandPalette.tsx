import { useState, useMemo, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { Command as CommandIcon, Search, ArrowRight, CornerDownLeft } from 'lucide-react'
import ModalShell from '@/components/ui/ModalShell'

interface Props { onClose: () => void }

interface Command {
  id: string
  label: string
  shortcut?: string
  action: () => void
  icon?: string
}

export default function CommandPalette({ onClose }: Props) {
  const { setModalOpen, setEditingDossierId, dossiers, filters, setFilter } = useAppStore()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const commands: Command[] = useMemo(() => [
    { id: 'new', label: 'Nouveau dossier foncier', shortcut: 'Ctrl+N', icon: '➕', action: () => { setEditingDossierId(null); setModalOpen('new-dossier') } },
    { id: 'dashboard', label: 'Tableau de bord de pilotage', shortcut: 'F5', icon: '📊', action: () => setModalOpen('dashboard') },
    { id: 'reminders', label: 'Centre des rappels & urgences', shortcut: 'Ctrl+R', icon: '🔔', action: () => setModalOpen('reminders') },
    { id: 'export', label: 'Exportation / Importation de données', shortcut: 'Ctrl+E', icon: '💾', action: () => setModalOpen('export') },
    { id: 'columns', label: 'Personnaliser les colonnes du tableau', icon: '📋', action: () => setModalOpen('columns') },
    { id: 'settings', label: 'Paramètres & Préférences', icon: '⚙️', action: () => setModalOpen('settings') },
    { id: 'view-actifs', label: 'Filtrer: Dossiers actifs', icon: '📂', action: () => setFilter('viewMode', 'actifs') },
    { id: 'view-archives', label: 'Filtrer: Archives', icon: '📦', action: () => setFilter('viewMode', 'archives') },
    { id: 'view-retards', label: 'Filtrer: Dossiers en retard', icon: '🔴', action: () => setFilter('viewMode', 'retards') },
    { id: 'view-impayes', label: 'Filtrer: Dossiers impayés', icon: '💰', action: () => setFilter('viewMode', 'impayes') },
    { id: 'view-corbeille', label: 'Filtrer: Corbeille', icon: '🗑️', action: () => setFilter('viewMode', 'corbeille') },
    // Recent dossiers
    ...dossiers.slice(0, 6).map(d => ({
      id: `dossier-${d.id}`,
      label: `Ouvrir : ${d.id} — ${d.nom}`,
      icon: '📄',
      action: () => { setEditingDossierId(d.id); setModalOpen('edit-dossier') }
    })),
  ], [dossiers])

  const filtered = useMemo(() => {
    if (!query) return commands
    const q = query.toLowerCase()
    return commands.filter(c => c.label.toLowerCase().includes(q))
  }, [query, commands])

  useEffect(() => { setActiveIdx(0) }, [query])

  const runCommand = (cmd: Command) => {
    cmd.action()
    onClose()
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[activeIdx]) runCommand(filtered[activeIdx])
    if (e.key === 'Escape') onClose()
  }

  return (
    <ModalShell
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CommandIcon size={18} style={{ color: 'var(--acc)' }} />
          <span>Palette de commandes rapides</span>
        </div>
      }
      onClose={onClose}
      size="md"
      footer={
        <div style={{ display: 'flex', gap: 16, width: '100%', fontSize: 11, color: 'var(--text-3)', alignItems: 'center' }}>
          <span><kbd className="kbd-shortcut">↑</kbd> <kbd className="kbd-shortcut">↓</kbd> Naviguer</span>
          <span><kbd className="kbd-shortcut">↵</kbd> Exécuter</span>
          <span><kbd className="kbd-shortcut">Échap</kbd> Fermer</span>
        </div>
      }
    >
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          className="cmd-palette-input"
          placeholder="Taper pour chercher une commande, un écran ou un dossier..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          aria-label="Rechercher une commande"
        />
      </div>

      <div className="cmd-palette-list">
        {filtered.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
            Aucune commande correspondante
          </div>
        ) : filtered.map((cmd, i) => (
          <div
            key={cmd.id}
            className={`cmd-palette-item ${i === activeIdx ? 'active' : ''}`}
            onClick={() => runCommand(cmd)}
            onMouseEnter={() => setActiveIdx(i)}
          >
            <span style={{ fontSize: 15 }}>{cmd.icon}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{cmd.label}</span>
            {cmd.shortcut && (
              <kbd className="kbd-shortcut">
                {cmd.shortcut}
              </kbd>
            )}
            <CornerDownLeft size={12} style={{ opacity: i === activeIdx ? 0.8 : 0, color: 'var(--acc)' }} />
          </div>
        ))}
      </div>
    </ModalShell>
  )
}
