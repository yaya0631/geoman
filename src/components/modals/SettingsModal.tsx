import { useAppStore } from '@/store/appStore'
import { Settings } from 'lucide-react'
import ModalShell from '@/components/ui/ModalShell'

interface Props { onClose: () => void }

export default function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings, theme, toggleTheme } = useAppStore()

  return (
    <ModalShell
      title="Paramètres"
      onClose={onClose}
      size="sm"
      icon={<Settings size={15} style={{ color: 'var(--acc)' }} />}
      footer={<button className="btn btn-primary" onClick={onClose}>Fermer</button>}
    >
      {/* Appearance */}
      <div className="section-title">Apparence</div>
      <div className="settings-row">
        <div>
          <div className="settings-row-label">Thème sombre</div>
          <div className="settings-row-sub">Mode sombre / clair</div>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Behavior */}
      <div className="section-title" style={{ marginTop: 16 }}>Comportement</div>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Rappels au démarrage</div>
          <div className="settings-row-sub">Afficher les rappels si dossiers en retard</div>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.showRemindersOnStart}
            onChange={e => updateSettings({ showRemindersOnStart: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Confirmer avant suppression</div>
          <div className="settings-row-sub">Demander confirmation avant de supprimer</div>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.confirmBeforeDelete}
            onChange={e => updateSettings({ confirmBeforeDelete: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Thresholds */}
      <div className="section-title" style={{ marginTop: 16 }}>Seuils</div>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Seuil d'alerte (jours)</div>
          <div className="settings-row-sub">Jours avant échéance pour alerte "proche"</div>
        </div>
        <input
          type="number"
          className="form-input"
          style={{ width: 60, textAlign: 'center' }}
          min={1}
          max={30}
          value={settings.overdueThresholdDays}
          onChange={e => updateSettings({ overdueThresholdDays: parseInt(e.target.value) || 7 })}
          aria-label="Seuil d'alerte en jours"
        />
      </div>

      {/* Keyboard shortcuts reference */}
      <div className="section-title" style={{ marginTop: 16 }}>Raccourcis clavier</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {[
          ['Ctrl+N', 'Nouveau dossier'],
          ['F2', 'Modifier'],
          ['F5', 'Dashboard'],
          ['Ctrl+R', 'Rappels'],
          ['Ctrl+E', 'Export'],
          ['Ctrl+A', 'Archiver'],
          ['Suppr', 'Corbeille'],
          ['Ctrl+Z', 'Annuler'],
          ['Ctrl+K', 'Commandes'],
          ['Échap', 'Fermer / Reset'],
        ].map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
            <kbd style={{
              background: 'var(--bg-3)',
              border: '1px solid var(--border-2)',
              borderRadius: 3,
              padding: '1px 6px',
              fontSize: 10.5,
              fontFamily: 'var(--font-mono)',
              color: 'var(--acc)',
              whiteSpace: 'nowrap',
            }}>{key}</kbd>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</span>
          </div>
        ))}
      </div>
    </ModalShell>
  )
}
