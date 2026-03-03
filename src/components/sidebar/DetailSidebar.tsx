import { useAppStore } from '@/store/appStore'
import { getEncaisse, getReste } from '@/lib/utils'
import { formatDate, formatMontant, formatFileSize, getFileIcon } from '@/lib/formatters'
import { computeStatus, getStatusLabel } from '@/lib/status'

export default function DetailSidebar() {
  const { selectedIds, dossiers, setModalOpen, setEditingDossierId } = useAppStore()
  const selId = [...selectedIds][0]
  const dossier = selId ? dossiers.find(d => d.id === selId) : null

  if (!dossier) {
    return (
      <div className="right-panel">
        <div className="right-panel-header">Détails</div>
        <div className="right-panel-body">
          <div className="panel-empty">
            <div style={{ fontSize: 24, marginBottom: 8 }}>📂</div>
            Sélectionnez un dossier pour voir les détails
          </div>
        </div>
      </div>
    )
  }

  const enc = getEncaisse(dossier)
  const reste = getReste(dossier)
  const status = computeStatus(dossier, enc)
  const files = dossier.fichiers || []

  return (
    <div className="right-panel">
      <div className="right-panel-header">
        <span style={{ color: 'var(--acc)', fontFamily: 'var(--font-mono)' }}>{dossier.id}</span>
      </div>

      <div className="right-panel-body">
        {/* Client info */}
        <div className="panel-section">
          <div className="sidebar-info-item">
            <span className="sidebar-info-label">Client</span>
            <span className="sidebar-info-value" style={{ fontWeight: 600 }}>{dossier.nom}</span>
          </div>
          {dossier.endroit && (
            <div className="sidebar-info-item">
              <span className="sidebar-info-label">Endroit</span>
              <span className="sidebar-info-value">{dossier.endroit}</span>
            </div>
          )}
          {dossier.telephone && (
            <div className="sidebar-info-item">
              <span className="sidebar-info-label">Téléphone</span>
              <span className="sidebar-info-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{dossier.telephone}</span>
            </div>
          )}
          <div className="sidebar-info-item">
            <span className="sidebar-info-label">Échéance</span>
            <span className="sidebar-info-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatDate(dossier.date_finale)}</span>
          </div>
          <div className="sidebar-info-item">
            <span className="sidebar-info-label">État</span>
            <span className="sidebar-info-value">{getStatusLabel(status)}</span>
          </div>
        </div>

        {/* Financials */}
        <div className="panel-section">
          <div className="section-title">Paiements</div>
          <div className="sidebar-info-item">
            <span className="sidebar-info-label">Montant total</span>
            <span className="sidebar-info-value text-mono">{formatMontant(dossier.montant)}</span>
          </div>
          <div className="sidebar-info-item">
            <span className="sidebar-info-label">Encaissé</span>
            <span className="sidebar-info-value text-mono" style={{ color: 'var(--green)' }}>{formatMontant(enc)}</span>
          </div>
          <div className="sidebar-info-item">
            <span className="sidebar-info-label">Reste à payer</span>
            <span className="sidebar-info-value text-mono" style={{ color: reste > 0 ? 'var(--red)' : 'var(--green)' }}>
              {formatMontant(reste)}
            </span>
          </div>
          <button
            className="btn btn-sm"
            style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}
            onClick={() => { setEditingDossierId(dossier.id); setModalOpen('paiements') }}
          >
            Gérer les paiements
          </button>
        </div>

        {/* Files */}
        <div className="panel-section">
          <div className="section-title">
            Fichiers ({files.length})
          </div>
          {files.length === 0 ? (
            <div className="panel-empty" style={{ padding: '8px 0' }}>Aucun fichier</div>
          ) : (
            files.slice(0, 5).map(f => (
              <div key={f.id} className="panel-file-item">
                <span className="panel-file-icon">{getFileIcon(f.type_mime)}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div className="panel-file-name">{f.nom_fichier}</div>
                  <div className="panel-file-size">{formatFileSize(f.taille)}</div>
                </div>
              </div>
            ))
          )}
          {files.length > 5 && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '4px 8px' }}>
              +{files.length - 5} autres fichiers
            </div>
          )}
          <button
            className="btn btn-sm"
            style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}
            onClick={() => { setEditingDossierId(dossier.id); setModalOpen('fichiers') }}
          >
            Gérer les fichiers
          </button>
        </div>

        {/* Observations */}
        {dossier.observations && (
          <div className="panel-section">
            <div className="section-title">Observations</div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
              {dossier.observations}
            </p>
          </div>
        )}

        {/* History */}
        {dossier.historique && dossier.historique.length > 0 && (
          <div className="panel-section">
            <div className="section-title">Historique récent</div>
            {dossier.historique.slice(0, 3).map(h => (
              <div key={h.id} style={{ fontSize: 11.5, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                  {formatDate(h.created_at)}
                </span>
                <span style={{ marginLeft: 6, color: 'var(--text-2)' }}>{h.action}</span>
              </div>
            ))}
            <button
              className="btn btn-sm"
              style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}
              onClick={() => { setEditingDossierId(dossier.id); setModalOpen('historique') }}
            >
              Voir l'historique
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
