import { useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import { useClientMutations } from '@/hooks/useData'
import { useDialog } from '@/hooks/useDialog'
import type { ClientRow } from '@/pages/ClientsPage'

type Props = { type: 'sortie' | 'retour'; clients: ClientRow[]; motifs: string[]; onClose: () => void; onDone: () => void }

// Sortie ou retour groupé : seuls les dossiers dans l'état inverse sont concernés
export default function BulkMoveDialog({ type, clients, motifs, onClose, onDone }: Props) {
  const { move } = useClientMutations()
  const ref = useDialog<HTMLFormElement>(onClose)
  const [motif, setMotif] = useState('')
  const sortie = type === 'sortie'
  const concerned = clients.filter(c => c.en_archive === sortie)
  const skipped = clients.length - concerned.length
  const n = concerned.length
  const label = sortie ? `Sortir ${n} dossier${n > 1 ? 's' : ''}` : `Remettre ${n} dossier${n > 1 ? 's' : ''} en archive`

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!n) return
    move.mutate({ ids: concerned.map(c => c.id), type, motif: motif.trim() || null }, {
      onSuccess: () => {
        toast.success(sortie ? `${n} dossier${n > 1 ? 's' : ''} sorti${n > 1 ? 's' : ''} de l'archive` : `${n} dossier${n > 1 ? 's' : ''} remis en archive`)
        onDone()
      },
      onError: err => toast.error(`Enregistrement impossible. ${(err as Error).message}`),
    })
  }

  return createPortal(
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form ref={ref} className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="bulk-title">
        <div className="modal-head">
          <h2 id="bulk-title">{sortie ? 'Sortir de l\'archive' : 'Remettre en archive'}</h2>
          <button type="button" className="btn-ghost icon" onClick={onClose} aria-label="Fermer"><X size={18} aria-hidden /></button>
        </div>
        {n > 0 ? (
          <ul className="bulk-list">
            {concerned.slice(0, 8).map(c => (
              <li key={c.id}><span className="num">{c.numero ?? '—'}</span> {c.nom}</li>
            ))}
            {n > 8 && <li className="muted">et {n - 8} autre{n - 8 > 1 ? 's' : ''}…</li>}
          </ul>
        ) : (
          <p className="muted">{sortie ? 'Tous les dossiers sélectionnés sont déjà sortis.' : 'Tous les dossiers sélectionnés sont déjà dans l\'archive.'}</p>
        )}
        {skipped > 0 && n > 0 && (
          <p className="muted small-text">{skipped} dossier{skipped > 1 ? 's' : ''} ignoré{skipped > 1 ? 's' : ''} : déjà {sortie ? 'sorti' : 'en archive'}{skipped > 1 ? 's' : ''}.</p>
        )}
        {n > 0 && (
          <label className="field">
            <span>{sortie ? 'Motif de sortie' : 'Remarque au retour'} <span className="optional">facultatif</span></span>
            <input autoFocus value={motif} onChange={e => setMotif(e.target.value)} list="bulk-motifs"
              placeholder={sortie ? 'Ex. Remis au client, dépôt cadastre…' : 'Ex. Complet, pièces ajoutées…'} />
            <datalist id="bulk-motifs">{motifs.map(m => <option key={m} value={m} />)}</datalist>
          </label>
        )}
        <div className="modal-foot">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          {n > 0 && <button type="submit" className="btn-primary" disabled={move.isPending}>{move.isPending ? 'Enregistrement…' : label}</button>}
        </div>
      </form>
    </div>,
    document.body,
  )
}
