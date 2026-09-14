import { useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { useFilters } from '@/hooks/useFilters'
import { getEncaisse, getReste } from '@/lib/utils'
import { formatMontant } from '@/lib/formatters'
import { Database, AlertTriangle, Layers, CheckCircle2, TrendingUp } from 'lucide-react'

export default function StatusBar() {
  const { connectionStatus, dossiers } = useAppStore()
  const { filtered, counts } = useFilters()

  const financials = useMemo(() => {
    const visible = filtered
    const totalMontant = visible.reduce((s, d) => s + (d.montant || 0), 0)
    const totalEncaisse = visible.reduce((s, d) => s + getEncaisse(d), 0)
    const totalReste = visible.reduce((s, d) => s + getReste(d), 0)
    const rate = totalMontant > 0 ? Math.round((totalEncaisse / totalMontant) * 100) : 0
    return { totalMontant, totalEncaisse, totalReste, rate }
  }, [filtered])

  return (
    <footer className="status-bar">
      {/* Database Connection */}
      <div className="status-item" title="État de la connexion Supabase PostgreSQL">
        <span className={`conn-dot ${connectionStatus}`} />
        <span className="status-label">
          {connectionStatus === 'connected' ? 'PostgreSQL Connecté' : connectionStatus === 'error' ? 'Erreur DB' : 'Synchronisation...'}
        </span>
      </div>

      <span className="status-sep">|</span>

      {/* Visible / Total counts */}
      <div className="status-item" title="Dossiers affichés par les filtres actuels">
        <Layers size={11} style={{ color: 'var(--acc)' }} />
        <span className="status-label">Affichés :</span>
        <span className="status-value text-mono">{filtered.length}</span>
        <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>/ {dossiers.length}</span>
      </div>

      <span className="status-sep">|</span>

      {/* Breakdowns */}
      <div className="status-item">
        <span className="status-label">Actifs :</span>
        <span className="status-value text-mono">{counts.actifs}</span>
      </div>

      {counts.retards > 0 && (
        <div className="status-item" style={{ color: 'var(--red)' }} title="Dossiers ayant dépassé la date d'échéance">
          <AlertTriangle size={11} />
          <span className="status-label" style={{ color: 'var(--red)' }}>Retards :</span>
          <span className="status-value text-mono" style={{ color: 'var(--red)' }}>{counts.retards}</span>
        </div>
      )}

      {counts.corbeille > 0 && (
        <div className="status-item" style={{ color: 'var(--yellow)' }}>
          <span className="status-label" style={{ color: 'var(--yellow)' }}>Corbeille :</span>
          <span className="status-value text-mono" style={{ color: 'var(--yellow)' }}>{counts.corbeille}</span>
        </div>
      )}

      <span className="status-sep">|</span>

      {/* Financial Summary */}
      <div className="status-item" title="Total montant prévu sur la vue active">
        <span className="status-label">Total :</span>
        <span className="status-value status-amount">{formatMontant(financials.totalMontant)}</span>
      </div>

      <div className="status-item" title="Total encaissé">
        <span className="status-label">Encaissé :</span>
        <span className="status-value" style={{ color: 'var(--green)' }}>{formatMontant(financials.totalEncaisse)}</span>
      </div>

      <div className="status-item" title="Reste à recouvrer">
        <span className="status-label">Reste :</span>
        <span className="status-value" style={{ color: financials.totalReste > 0 ? 'var(--red)' : 'var(--green)' }}>
          {formatMontant(financials.totalReste)}
        </span>
      </div>

      {financials.totalMontant > 0 && (
        <div
          className="status-item"
          style={{
            background: 'var(--bg-3)',
            padding: '1px 7px',
            borderRadius: 10,
            fontSize: 10.5,
            fontWeight: 700,
            color: financials.rate >= 80 ? 'var(--green)' : financials.rate >= 50 ? 'var(--yellow)' : 'var(--red)',
          }}
          title="Taux de recouvrement sur la sélection active"
        >
          <TrendingUp size={10} />
          <span>{financials.rate}% recouvré</span>
        </div>
      )}

      <span className="status-sep" style={{ marginLeft: 'auto' }}>|</span>
      <span className="version-badge">GeoMan v2.5 Enterprise — DZ Topo</span>
    </footer>
  )
}
