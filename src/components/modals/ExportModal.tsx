import { useState, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { useDossiers } from '@/hooks/useDossiers'
import { Download, Upload, FileJson, FileSpreadsheet, Database, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import ModalShell from '@/components/ui/ModalShell'

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
    toast.success(`${dossiers.length} dossiers exportés en CSV Excel`)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const isCsv = file.name.toLowerCase().endsWith('.csv')
      let arr: any[] = []
      if (isCsv) {
        const parsed = Papa.parse(text, { delimiter: ';', header: true })
        arr = parsed.data.filter((r: any) => r && r.id && r.nom)
        // Normalize booleans
        arr = arr.map((r: any) => ({
          ...r,
          montant: Number(r.montant) || 0,
          acte: r.acte === 'Oui' || r.acte === 'true' || r.acte === true,
          regul: r.regul === 'Oui' || r.regul === 'true' || r.regul === true,
          agricole: r.agricole === 'Oui' || r.agricole === 'true' || r.agricole === true,
          archived: r.archived === 'Oui' || r.archived === 'true' || r.archived === true,
        }))
      } else {
        const data = JSON.parse(text)
        arr = Array.isArray(data) ? data : [data]
      }

      let imported = 0
      for (const d of arr) {
        try {
          const { paiements: _p, fichiers: _f, historique: _h, ...rest } = d
          await createDossier.mutateAsync(rest)
          imported++
        } catch {}
      }
      toast.success(`${imported}/${arr.length} dossiers importés${isCsv ? ' (CSV Excel)' : ' (JSON)'}`)
    } catch (err: any) {
      toast.error(`Erreur d'import: ${err.message}`)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <ModalShell
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={18} style={{ color: 'var(--acc)' }} />
          <span>Centre d'import & export de données</span>
        </div>
      }
      onClose={onClose}
      size="sm"
      footer={<button className="btn btn-primary" onClick={onClose}>Fermer</button>}
    >
      {/* Export Section */}
      <div className="form-section-title">
        <Download size={13} />
        <span>Exportation de la base de données</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        <button
          className="btn"
          style={{ justifyContent: 'flex-start', height: 48, padding: '8px 12px', background: 'var(--bg-2)' }}
          onClick={exportCSV}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
            <FileSpreadsheet size={18} />
          </div>
          <div style={{ textAlign: 'left', marginLeft: 6 }}>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Export CSV (Microsoft Excel / Calc)</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Tableau formaté avec séparateur point-virgule et encodage UTF-8</div>
          </div>
        </button>

        <button
          className="btn"
          style={{ justifyContent: 'flex-start', height: 48, padding: '8px 12px', background: 'var(--bg-2)' }}
          onClick={exportJSON}
        >
          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--acc-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--acc)' }}>
            <FileJson size={18} />
          </div>
          <div style={{ textAlign: 'left', marginLeft: 6 }}>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Sauvegarde intégrale JSON</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Tous les dossiers, versements financiers et métadonnées</div>
          </div>
        </button>
      </div>

      {/* Import Section */}
      <div className="form-section-title">
        <Upload size={13} />
        <span>Restauration / Importation</span>
      </div>
      <div
        className="upload-zone"
        onClick={() => fileRef.current?.click()}
        style={{ padding: '18px 14px', fontSize: 12.5 }}
      >
        <Upload size={20} style={{ margin: '0 auto 6px', display: 'block', color: 'var(--acc)' }} />
        <div style={{ fontWeight: 600, color: 'var(--text)' }}>
          {importing ? 'Importation en cours...' : 'Cliquer pour importer un fichier JSON ou CSV'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
          Formats acceptés : .json (sauvegarde) et .csv (Excel point-virgule)
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.csv"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
        <AlertCircle size={13} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
        <span>Les dossiers avec des identifiants déjà existants ne seront pas écrasés.</span>
      </div>
    </ModalShell>
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
