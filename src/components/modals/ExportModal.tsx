import { useState, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import { X, Download, Upload, FileJson, FileText } from 'lucide-react'
import Papa from 'papaparse'
import toast from 'react-hot-toast'

interface Props { onClose: () => void }

export default function ExportModal({ onClose }: Props) {
  const { dossiers } = useAppStore()
  const { createDossier } = useDossiers()
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportJSON = () => {
    const data = JSON.stringify(dossiers.map(d => ({
      ...d,
      paiements: d.paiements,
      fichiers: d.fichiers,
    })), null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    download(blob, `geoman-export-${today()}.json`)
    toast.success(`${dossiers.length} dossiers exportés en JSON`)
  }

  const exportCSV = () => {
    const rows = dossiers.map(d => ({
      id: d.id,
      nom: d.nom,
      endroit: d.endroit || '',
      telephone: d.telephone || '',
      date_finale: d.date_finale || '',
      montant: d.montant,
      acte: d.acte ? 'Oui' : 'Non',
      regul: d.regul ? 'Oui' : 'Non',
      agricole: d.agricole ? 'Oui' : 'Non',
      depot_cad: d.depot_cad || '',
      depot_domain: d.depot_domain || '',
      etat: d.etat,
      archived: d.archived ? 'Oui' : 'Non',
      observations: d.observations || '',
    }))
    const csv = Papa.unparse(rows, { delimiter: ';' })
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    download(blob, `geoman-export-${today()}.csv`)
    toast.success(`${dossiers.length} dossiers exportés en CSV`)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const arr = Array.isArray(data) ? data : [data]
      let imported = 0
      for (const d of arr) {
        try {
          const { paiements: _p, fichiers: _f, historique: _h, ...rest } = d
          await createDossier.mutateAsync(rest)
          imported++
        } catch {}
      }
      toast.success(`${imported}/${arr.length} dossiers importés`)
    } catch (err: any) {
      toast.error(`Erreur d'import: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-header">
          <span className="modal-title">Import / Export</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          <div className="section-title">Exporter</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <button className="btn" style={{ justifyContent: 'flex-start', height: 40 }} onClick={exportJSON}>
              <FileJson size={16} style={{ color: 'var(--acc)' }} />
              <div>
                <div>Export JSON</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Tous les dossiers avec paiements</div>
              </div>
            </button>
            <button className="btn" style={{ justifyContent: 'flex-start', height: 40 }} onClick={exportCSV}>
              <FileText size={16} style={{ color: 'var(--green)' }} />
              <div>
                <div>Export CSV</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Tableau compatible Excel</div>
              </div>
            </button>
          </div>

          <div className="section-title">Importer</div>
          <div
            className="upload-zone"
            onClick={() => fileRef.current?.click()}
            style={{ padding: '14px', fontSize: 12.5 }}
          >
            <Upload size={18} style={{ margin: '0 auto 6px', display: 'block' }} />
            {importing ? 'Import en cours...' : 'Cliquer pour importer un fichier JSON'}
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>
            ⚠️ Les dossiers avec des IDs existants seront ignorés pour éviter les doublons.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
