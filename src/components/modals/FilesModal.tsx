import { useState, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { supabase } from '@/lib/supabase'
import { formatFileSize, getFileIcon } from '@/lib/formatters'
import { X, Upload, Trash2, Download, Loader2 } from 'lucide-react'
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

      // Upload with progress via Supabase storage (using upload with contentLength for proxy)
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
      toast.success(`${file.name} ajouté`)
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
    toast.success('Fichier supprimé')
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
      title={<><span>Fichiers — </span><span style={{ color: 'var(--acc)', fontFamily: 'var(--font-mono)' }}>{dossier.id}</span></>}
      onClose={onClose}
      size="md"
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Loader2 size={20} className="spinner" style={{ margin: '0 auto', width: 20, height: 20 }} />
            <div style={{ fontSize: 12 }}>Chargement...</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {Object.entries(progress).map(([name, p]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--bg-1)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${p}%`, height: '100%', background: 'var(--acc)', transition: 'width 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 10 }}>{Math.round(p)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <Upload size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
            Cliquer ou déposer des fichiers ici
          </>
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
      <div style={{ marginTop: 14 }}>
        {files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)', fontSize: 13 }}>
            Aucun fichier attaché
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {files.map(f => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  background: 'var(--bg-3)',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: 20 }}>{getFileIcon(f.type_mime)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{f.nom_fichier}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {formatFileSize(f.taille)} — {f.type_mime || 'unknown'}
                  </div>
                </div>
                <button
                  className="btn btn-icon btn-sm"
                  onClick={() => handleDownload(f.storage_path, f.nom_fichier)}
                  title="Télécharger"
                  aria-label="Télécharger"
                >
                  <Download size={13} />
                </button>
                <button
                  className="btn btn-icon btn-sm btn-danger"
                  onClick={() => handleDelete(f.id, f.storage_path)}
                  title="Supprimer"
                  aria-label="Supprimer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  )
}
