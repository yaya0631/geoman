import { useAppStore } from '@/store/appStore'
import { Settings, Sliders, Moon, Sun, Bell, Trash2, Clock, Keyboard, Shield, BellRing } from 'lucide-react'
import ModalShell from '@/components/ui/ModalShell'

interface Props { onClose: () => void }

export default function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings, theme, toggleTheme } = useAppStore()

  return (
    <ModalShell
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Settings size={18} style={{ color: 'var(--acc)' }} />
          <span>Préférences & Paramètres système</span>
        </div>
      }
      onClose={onClose}
      size="sm"
      footer={<button className="btn btn-primary" onClick={onClose}>Enregistrer & Fermer</button>}
    >
      {/* Appearance */}
      <div className="form-section-title">
        <Moon size={13} />
        <span>Thème & Apparence</span>
      </div>
      <div className="settings-row">
        <div>
          <div className="settings-row-label">Mode Sombre Haute Visibilité</div>
          <div className="settings-row-sub">Basculer entre le thème sombre Obsidian et le thème clair</div>
        </div>
        <label className="toggle">
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
          <span className="toggle-slider" />
        </label>
      </div>

      {/* Behavior */}
      <div className="form-section-title" style={{ marginTop: 18 }}>
        <Sliders size={13} />
        <span>Comportement & Notifications</span>
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Alertes au démarrage</div>
          <div className="settings-row-sub">Ouvrir automatiquement la liste des retards lors de l'ouverture</div>
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
          <div className="settings-row-label">Confirmation de suppression</div>
          <div className="settings-row-sub">Afficher une boîte de confirmation avant mise en corbeille ou purge</div>
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
      <div className="form-section-title" style={{ marginTop: 18 }}>
        <Clock size={13} />
        <span>Seuils d'urgence cadastrale</span>
      </div>

      <div className="form-row">
        <div>
          <div className="settings-row-label">Notifications système navigateur</div>
          <div className="settings-row-sub">Recevoir des alertes desktop pour les dossiers en retard</div>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.enableBrowserNotifications ?? true}
            onChange={e => {
              updateSettings({ enableBrowserNotifications: e.target.checked })
              if (e.target.checked && 'Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission()
              }
            }}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="settings-row">
        <div>
          <div className="settings-row-label">Seuil "Échéance proche" (Jours)</div>
          <div className="settings-row-sub">Nombre de jours restants pour déclencher l'alerte jaune</div>
        </div>
        <input
          type="number"
          className="form-input text-mono"
          style={{ width: 64, textAlign: 'center', height: 32 }}
          min={1}
          max={30}
          value={settings.overdueThresholdDays}
          onChange={e => updateSettings({ overdueThresholdDays: parseInt(e.target.value) || 7 })}
          aria-label="Seuil d'alerte en jours"
        />
      </div>

      {/* Keyboard shortcuts reference */}
      <div className="form-section-title" style={{ marginTop: 18 }}>
        <Keyboard size={13} />
        <span>Raccourcis clavier productivité</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'var(--bg-2)', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        {[
          ['Ctrl+N', 'Nouveau dossier'],
          ['F2', 'Modifier dossier'],
          ['F5', 'Tableau de bord'],
          ['Ctrl+R', 'Rappels & Retards'],
          ['Ctrl+E', 'Import / Export'],
          ['Ctrl+A', 'Archiver sélection'],
          ['Suppr', 'Mettre en corbeille'],
          ['Ctrl+Z', 'Annuler dernière action'],
          ['Ctrl+K', 'Palette de commandes'],
          ['Échap', 'Fermer / Reset filtres'],
        ].map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
            <kbd style={{
              background: 'var(--bg-3)',
              border: '1px solid var(--border-2)',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 10.5,
              fontFamily: 'var(--font-mono)',
              color: 'var(--acc)',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}>{key}</kbd>
            <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{label}</span>
          </div>
        ))}
      </div>
    </ModalShell>
  )
}
