import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { getEncaisse, getReste } from '@/lib/utils'
import { formatDate, formatMontant, formatFileSize, getFileIcon } from '@/lib/formatters'
import { computeStatus, getStatusLabel } from '@/lib/status'
import {
  Pencil, CreditCard, Folder, History, Copy, Check, Phone, MapPin,
  Calendar, FileText, CheckCircle2, AlertTriangle, ChevronRight, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function DetailSidebar() {
  const { selectedIds, dossiers, setModalOpen, setEditingDossierId } = useAppStore()
  const [copied, setCopied] = useState(false)
  
  const selId = [...selectedIds][0]
  const dossier = selId ? dossiers.find(d => d.id === selId) : null

  if (!dossier) {
    return (
      <aside className="right-panel">
        <div className="right-panel-header">
          <span className="right-panel-title">Inspecteur de dossier</span>
        </div>
        <div className="right-panel-body">
          <div className="panel-empty">
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--bg-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-3)',
              marginBottom: 4,
              border: '1px solid var(--border)'
            }}>
              <FileText size={22} strokeWidth={1.5} />
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-2)' }}>Aucune sélection</div>
            <p style={{ fontSize: 11.5, color: 'var(--text-3)', maxWidth: 200, lineHeight: 1.4 }}>
              Cliquez sur une ligne du tableau pour inspecter les données, finances et pièces jointes.
            </p>
          </div>
        </div>
      </aside>
    )
  }

  const enc = getEncaisse(dossier)
  const reste = getReste(dossier)
  const status = computeStatus(dossier, enc)
  const files = dossier.fichiers || []
  const pctPaid = dossier.montant > 0 ? Math.min(100, Math.round((enc / dossier.montant) * 100)) : 0

  const copyId = () => {
    navigator.clipboard.writeText(dossier.id)
    setCopied(true)
    toast.success(`N° ${dossier.id} copié !`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <aside className="right-panel">
      {/* Header */}
      <div className="right-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--acc)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>
            {dossier.id}
          </span>
          <button
            className="btn btn-icon btn-sm btn-ghost"
            onClick={copyId}
            title="Copier le numéro de dossier"
            style={{ width: 22, height: 22 }}
          >
            {copied ? <Check size={12} style={{ color: 'var(--green)' }} /> : <Copy size={12} />}
          </button>
        </div>

        <button
          className="btn btn-sm btn-primary"
          onClick={() => {
            setEditingDossierId(dossier.id)
            setModalOpen('edit-dossier')
          }}
          title="Modifier ce dossier (F2)"
        >
          <Pencil size={11} />
          <span>Éditer</span>
        </button>
      </div>

      <div className="right-panel-body">
        {/* Client & Identification Card */}
        <div className="sidebar-card">
          <div className="sidebar-card-title">
            <span>Client & Localisation</span>
            <span className={`badge ${
              status === 'En retard' ? 'badge-overdue' :
              status === 'Echeance proche' ? 'badge-soon' :
              status === 'Termine' ? 'badge-done' :
              status === 'Solde partiel' ? 'badge-partial' :
              status === 'Bloque' ? 'badge-blocked' :
              status === 'Archive' ? 'badge-archived' : 'badge-actif'
            }`}>
              {getStatusLabel(status)}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="sidebar-info-item">
              <span className="sidebar-info-label">Nom du client</span>
              <span className="sidebar-info-value" style={{ color: 'var(--text)' }}>{dossier.nom}</span>
            </div>

            {dossier.endroit && (
              <div className="sidebar-info-item">
                <span className="sidebar-info-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} style={{ color: 'var(--acc)' }} /> Localité
                </span>
                <span className="sidebar-info-value">{dossier.endroit}</span>
              </div>
            )}

            {dossier.telephone && (
              <div className="sidebar-info-item">
                <span className="sidebar-info-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={12} style={{ color: 'var(--green)' }} /> Téléphone
                </span>
                <span className="sidebar-info-value text-mono">{dossier.telephone}</span>
              </div>
            )}

            <div className="sidebar-info-item">
              <span className="sidebar-info-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} style={{ color: 'var(--text-3)' }} /> Échéance
              </span>
              <span className="sidebar-info-value text-mono" style={{ color: status === 'En retard' ? 'var(--red)' : 'var(--text)' }}>
                {formatDate(dossier.date_finale)}
              </span>
            </div>

            {/* Badges / Cadastre tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
              {dossier.acte && <span className="badge badge-done">Acte établi</span>}
              {dossier.regul && <span className="badge badge-actif">Régularisation</span>}
              {dossier.agricole && <span className="badge badge-soon">Agricole 🌾</span>}
              {dossier.depot_cad && (
                <span className={`depot-badge ${dossier.depot_cad === 'Depose' ? 'depot-depose' : 'depot-non-depose'}`}>
                  CAD: {dossier.depot_cad}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="sidebar-card">
          <div className="sidebar-card-title">
            <span>Règlements & Finances</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: pctPaid === 100 ? 'var(--green)' : 'var(--acc)', fontWeight: 700 }}>
              {pctPaid}% réglé
            </span>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div className="table-progress-bar" style={{ height: 6 }}>
              <div
                className="table-progress-fill"
                style={{
                  width: `${pctPaid}%`,
                  background: pctPaid === 100 ? 'var(--green)' : 'var(--acc-gradient)'
                }}
              />
            </div>
          </div>

          <div className="sidebar-info-item">
            <span className="sidebar-info-label">Montant total prévu</span>
            <span className="sidebar-info-value text-mono">{formatMontant(dossier.montant)}</span>
          </div>
          <div className="sidebar-info-item">
            <span className="sidebar-info-label">Total encaissé</span>
            <span className="sidebar-info-value text-mono" style={{ color: 'var(--green)' }}>{formatMontant(enc)}</span>
          </div>
          <div className="sidebar-info-item">
            <span className="sidebar-info-label">Reste à percevoir</span>
            <span className="sidebar-info-value text-mono" style={{ color: reste > 0 ? 'var(--red)' : 'var(--green)' }}>
              {formatMontant(reste)}
            </span>
          </div>

          <button
            className="btn btn-sm"
            style={{ marginTop: 10, width: '100%', justifyContent: 'center', background: 'var(--bg-3)' }}
            onClick={() => {
              setEditingDossierId(dossier.id)
              setModalOpen('paiements')
            }}
          >
            <CreditCard size={12} style={{ color: 'var(--green)' }} />
            <span>Gérer les versements ({dossier.paiements?.length || 0})</span>
          </button>
        </div>

        {/* Files & Documents Card */}
        <div className="sidebar-card">
          <div className="sidebar-card-title">
            <span>Pièces jointes</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
              {files.length} doc{files.length > 1 ? 's' : ''}
            </span>
          </div>

          {files.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-dim)', fontSize: 12 }}>
              Aucun document joint
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {files.slice(0, 4).map(f => (
                <div key={f.id} className="panel-file-item">
                  <span className="panel-file-icon">{getFileIcon(f.type_mime)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="panel-file-name" title={f.nom_fichier}>{f.nom_fichier}</div>
                    <div className="panel-file-size">{formatFileSize(f.taille)}</div>
                  </div>
                </div>
              ))}
              {files.length > 4 && (
                <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', padding: '2px 0' }}>
                  +{files.length - 4} autres fichiers
                </div>
              )}
            </div>
          )}

          <button
            className="btn btn-sm"
            style={{ marginTop: 8, width: '100%', justifyContent: 'center', background: 'var(--bg-3)' }}
            onClick={() => {
              setEditingDossierId(dossier.id)
              setModalOpen('fichiers')
            }}
          >
            <Folder size={12} style={{ color: 'var(--acc)' }} />
            <span>Gérer les fichiers</span>
          </button>
        </div>

        {/* Observations Preview */}
        {dossier.observations && (
          <div className="sidebar-card">
            <div className="sidebar-card-title">Notes & Observations</div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, background: 'var(--bg-3)', padding: 8, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
              {dossier.observations}
            </p>
          </div>
        )}

        {/* History Preview */}
        {dossier.historique && dossier.historique.length > 0 && (
          <div className="sidebar-card">
            <div className="sidebar-card-title">
              <span>Activité récente</span>
              <History size={12} style={{ color: 'var(--purple)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {dossier.historique.slice(0, 3).map(h => (
                <div key={h.id} style={{ fontSize: 11.5, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                    {formatDate(h.created_at)}
                  </div>
                  <div style={{ color: 'var(--text-2)', marginTop: 1 }}>{h.action}</div>
                </div>
              ))}
            </div>
            <button
              className="btn btn-sm"
              style={{ marginTop: 8, width: '100%', justifyContent: 'center', background: 'var(--bg-3)' }}
              onClick={() => {
                setEditingDossierId(dossier.id)
                setModalOpen('historique')
              }}
            >
              <span>Voir tout l'historique</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
