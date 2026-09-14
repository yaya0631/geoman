import { useState, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { supabase } from '@/lib/supabase'
import { formatFileSize, getFileIcon } from '@/lib/formatters'
import { X, Upload, Trash2, Download, Loader2, Folder, FileText, CheckCircle2 } from 'lucide-react'
import { uuid } from '@/lib/utils'
import { useDossiers } from '@/hooks/useDossiers'
import toast from 'react-hot-toast'
import ModalShell from '@/components/ui/ModalShell'

interface Props { onClose: () => void }

export default function FilesModal({ onClose }: Props) {
  const { editingDossierId, dossiers } = useAppStore()
  const { invalidate } = useDossiers()
  const dossier = dossiers.find(d => d.id === editingDossierId)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  if (!dossier) return null
  const files = dossier.fichiers || []

  const uploadFile = async (file: File) => {
    const fileId = uuid()
    setUploading(true)
    setProgress(p => ({ ...p, [file.name]: 0 }))
    try {
      const path = `${dossier.id}/${fileId}_${file.name}`

      // Upload with progress via Supabase storage
      const { error: storageError } = await supabase.storage.from('dossiers').upload(path, file)
      if (storageError) throw storageError

      const { error: dbError } = await supabase.from('fichiers').insert({
        id: fileId,
        dossier_id: dossier.id,
        nom_fichier: file.name,
        storage_path: path,
        taille: file.size,
        type_mime: file.type,
      })
      if (dbError) throw dbError

      setProgress(p => ({ ...p, [file.name]: 100 }))
      await invalidate()
      toast.success(`${file.name} téléversé avec succès`)
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`)
    } finally {
      setUploading(false)
      setProgress(p => {
        const np = { ...p }
        delete np[file.name]
        return np
      })
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(uploadFile)
  }

  const handleDelete = async (id: string, path: string) => {
    const { error } = await supabase.storage.from('dossiers').remove([path])
    if (error) toast.error(`Échec suppression stockage: ${error.message}`)
    await supabase.from('fichiers').delete().eq('id', id)
    await invalidate()
    toast.success('Document supprimé')
  }

  const handleDownload = async (path: string, name: string) => {
    const { data } = await supabase.storage.from('dossiers').download(path)
    if (data) {
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <ModalShell
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Folder size={18} style={{ color: 'var(--acc)' }} />
          <span>Gestion des pièces jointes — </span>
          <span style={{ color: 'var(--acc)', fontFamily: 'var(--font-mono)' }}>{dossier.id}</span>
        </div>
      }
      onClose={onClose}
      size="md"
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Fermer
        </button>
      }
    >
      {/* Upload zone */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
      >
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <Loader2 size={24} className="spinner" />
            <div style={{ fontSize: 13, fontWeight: 600 }}>Téléversement en cours...</div>
            <div style={{ width: '100%', maxWidth: 280, fontSize: 11, color: 'var(--text-3)' }}>
              {Object.entries(progress).map(([name, p]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <div style={{ flex: 1, height: 5, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${p}%`, height: '100%', background: 'var(--acc)', transition: 'width 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)' }}>{Math.round(p)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--acc)' }}>
              <Upload size={20} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              Glissez-déposez vos fichiers ici ou cliquez pour parcourir
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              PDF, plans DWG/DXF, photos de terrain, actes notariés (jusqu'à 50 Mo)
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Files list */}
      <div style={{ marginTop: 16 }}>
        <div className="form-section-title" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span>Fichiers attachés au dossier ({files.length})</span>
        </div>

        {files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-dim)', fontSize: 12.5, background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            Aucun document attaché pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {files.map(f => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  background: 'var(--bg-2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: 22 }}>{getFileIcon(f.type_mime)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.nom_fichier}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                    {formatFileSize(f.taille)} • {f.type_mime || 'Document'}
                  </div>
                </div>
                <button
                  className="btn btn-icon btn-sm btn-ghost"
                  onClick={() => handleDownload(f.storage_path, f.nom_fichier)}
                  title="Télécharger"
                  aria-label="Télécharger"
                >
                  <Download size={14} />
                </button>
                <button
                  className="btn btn-icon btn-sm btn-danger"
                  onClick={() => handleDelete(f.id, f.storage_path)}
                  title="Supprimer"
                  aria-label="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  )
}
