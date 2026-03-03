import { useState, useRef } from 'react'
import { useAppStore } from '@/store/appStore'
import { supabase } from '@/lib/supabase'
import { formatFileSize, getFileIcon } from '@/lib/formatters'
import { X, Upload, Trash2, Download } from 'lucide-react'
import { uuid } from '@/lib/utils'
import { useDossiers } from '@/hooks/useDossiers'
import toast from 'react-hot-toast'

interface Props { onClose: () => void }

export default function FilesModal({ onClose }: Props) {
  const { editingDossierId, dossiers } = useAppStore()
  const { invalidate } = useDossiers()
  const dossier = dossiers.find(d => d.id === editingDossierId)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!dossier) return null
  const files = dossier.fichiers || []

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const path = `${dossier.id}/${uuid()}_${file.name}`
      const { error: storageError } = await supabase.storage.from('dossiers').upload(path, file)
      if (storageError) throw storageError

      const { error: dbError } = await supabase.from('fichiers').insert({
        id: uuid(),
        dossier_id: dossier.id,
        nom_fichier: file.name,
        storage_path: path,
        taille: file.size,
        type_mime: file.type,
      })
      if (dbError) throw dbError

      await invalidate()
      toast.success(`${file.name} ajouté`)
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(uploadFile)
  }

  const handleDelete = async (id: string, path: string) => {
    await supabase.storage.from('dossiers').remove([path])
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
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-md">
        <div className="modal-header">
          <span className="modal-title">Fichiers — <span style={{ color: 'var(--acc)', fontFamily: 'var(--font-mono)' }}>{dossier.id}</span></span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-body">
          {/* Upload zone */}
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          >
            <Upload size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
            {uploading ? 'Chargement...' : 'Cliquer ou déposer des fichiers ici'}
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
                    >
                      <Download size={13} />
                    </button>
                    <button
                      className="btn btn-icon btn-sm btn-danger"
                      onClick={() => handleDelete(f.id, f.storage_path)}
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
