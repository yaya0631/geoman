import { useState, useMemo, useEffect, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { X } from 'lucide-react'

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
    { id: 'new', label: 'Nouveau dossier', shortcut: 'Ctrl+N', icon: '➕', action: () => { setEditingDossierId(null); setModalOpen('new-dossier') } },
    { id: 'dashboard', label: 'Ouvrir le dashboard', shortcut: 'F5', icon: '📊', action: () => setModalOpen('dashboard') },
    { id: 'reminders', label: 'Voir les rappels', shortcut: 'Ctrl+R', icon: '🔔', action: () => setModalOpen('reminders') },
    { id: 'export', label: 'Import / Export', shortcut: 'Ctrl+E', icon: '💾', action: () => setModalOpen('export') },
    { id: 'columns', label: 'Gérer les colonnes', icon: '📋', action: () => setModalOpen('columns') },
    { id: 'settings', label: 'Paramètres', icon: '⚙️', action: () => setModalOpen('settings') },
    { id: 'view-actifs', label: 'Vue: Dossiers actifs', icon: '📂', action: () => setFilter('viewMode', 'actifs') },
    { id: 'view-archives', label: 'Vue: Archives', icon: '📦', action: () => setFilter('viewMode', 'archives') },
    { id: 'view-retards', label: 'Vue: En retard', icon: '🔴', action: () => setFilter('viewMode', 'retards') },
    { id: 'view-impayes', label: 'Vue: Impayés', icon: '💰', action: () => setFilter('viewMode', 'impayes') },
    { id: 'view-corbeille', label: 'Vue: Corbeille', icon: '🗑️', action: () => setFilter('viewMode', 'corbeille') },
    // Recent dossiers
    ...dossiers.slice(0, 5).map(d => ({
      id: `dossier-${d.id}`,
      label: `${d.id} — ${d.nom}`,
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
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-md" style={{ overflow: 'hidden' }}>
        <input
          ref={inputRef}
          className="cmd-palette-input"
          placeholder="Rechercher une commande..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
        />
        <div className="cmd-palette-list">
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)' }}>Aucune commande trouvée</div>
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
                <kbd style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'var(--bg-3)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border)' }}>
                  {cmd.shortcut}
                </kbd>
              )}
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-dim)', display: 'flex', gap: 16 }}>
          <span>↑↓ Naviguer</span>
          <span>↵ Exécuter</span>
          <span>Échap Fermer</span>
        </div>
      </div>
    </div>
  )
}
