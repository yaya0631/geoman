import { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { useFilters } from '@/hooks/useFilters'
import { getEncaisse, getReste } from '@/lib/utils'
import { formatMontant } from '@/lib/formatters'

export default function StatusBar() {
  const { connectionStatus, dossiers } = useAppStore()
  const { filtered, counts } = useFilters()

  const financials = useMemo(() => {
    const visible = filtered
    const totalMontant = visible.reduce((s, d) => s + (d.montant || 0), 0)
    const totalEncaisse = visible.reduce((s, d) => s + getEncaisse(d), 0)
    const totalReste = visible.reduce((s, d) => s + getReste(d), 0)
    return { totalMontant, totalEncaisse, totalReste }
  }, [filtered])

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className={`conn-dot ${connectionStatus}`} />
        <span className="status-label">
          {connectionStatus === 'connected' ? 'Connecté' : connectionStatus === 'error' ? 'Erreur DB' : '...'}
        </span>
      </div>

      <span className="status-sep">│</span>

      <div className="status-item">
        <span className="status-label">Visible:</span>
        <span className="status-value text-mono">{filtered.length}</span>
      </div>

      <span className="status-sep">│</span>

      <div className="status-item">
        <span className="status-label">Actifs:</span>
        <span className="status-value text-mono">{counts.actifs}</span>
      </div>

      <div className="status-item">
        <span className="status-label">Archives:</span>
        <span className="status-value text-mono">{counts.archives}</span>
      </div>

      <div className="status-item">
        <span className="status-label">Corbeille:</span>
        <span className="status-value text-mono">{counts.corbeille}</span>
      </div>

      <span className="status-sep">│</span>

      <div className="status-item">
        <span className="status-label">Attendu:</span>
        <span className="status-value status-amount">{formatMontant(financials.totalMontant)}</span>
      </div>

      <div className="status-item">
        <span className="status-label">Encaissé:</span>
        <span className="status-value" style={{ color: 'var(--green)' }}>{formatMontant(financials.totalEncaisse)}</span>
      </div>

      <div className="status-item">
        <span className="status-label">Reste:</span>
        <span className="status-value" style={{ color: 'var(--red)' }}>{formatMontant(financials.totalReste)}</span>
      </div>

      <span className="status-sep" style={{ marginLeft: 'auto' }}>│</span>
      <span className="version-badge">GeoMan v2.0</span>
    </div>
  )
}
