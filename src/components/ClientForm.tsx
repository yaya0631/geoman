import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import { norm } from '@/lib/search'
import { useClientMutations } from '@/hooks/useData'
import type { ClientRow } from '@/pages/ClientsPage'

type Props = {
  initialName?: string
  existing: ClientRow[]
  onClose: () => void
  onCreated: (id: string) => void
  onOpenExisting: (id: string) => void
}

export default function ClientForm({ initialName = '', existing, onClose, onCreated, onOpenExisting }: Props) {
  const { create } = useClientMutations()
  const [nom, setNom] = useState(initialName)
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [observation, setObservation] = useState('')

  // Clients au nom proche (tous les mots saisis présents) pour éviter les doublons
  const similar = useMemo(() => {
    const terms = norm(nom).split(' ').filter(t => t.length > 2)
    if (!terms.length) return []
    return existing.filter(c => terms.every(t => norm(c.nom).includes(t))).slice(0, 3)
  }, [nom, existing])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim()) return
    try {
      const c = await create.mutateAsync({
        nom: nom.trim(),
        telephone: telephone.trim() || null,
        adresse: adresse.trim() || null,
        observation: observation.trim() || null,
      })
      toast.success('Client ajouté')
      onCreated(c.id)
    } catch (err) {
      toast.error(`Échec : ${(err as Error).message}`)
    }
  }

  return (
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <h2>Nouveau client</h2>
          <button type="button" className="btn-ghost icon" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </div>

        <label className="field">
          <span>Nom complet *</span>
          <input autoFocus required value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex. BENALI Mohamed" />
        </label>

        {similar.length > 0 && (
          <div className="warn">
            <strong>Client similaire déjà enregistré :</strong>
            {similar.map(c => (
              <button type="button" key={c.id} className="link" onClick={() => onOpenExisting(c.id)}>
                {c.nom}{c.adresse ? ` — ${c.adresse}` : ''}
              </button>
            ))}
          </div>
        )}

        <div className="field-row">
          <label className="field">
            <span>Téléphone</span>
            <input type="tel" inputMode="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="0550 12 34 56" />
          </label>
          <label className="field">
            <span>Adresse / lieu</span>
            <input value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Ex. Aïn El Turck" />
          </label>
        </div>

        <label className="field">
          <span>Note</span>
          <textarea rows={3} value={observation} onChange={e => setObservation(e.target.value)} placeholder="Informations utiles…" />
        </label>

        <div className="modal-foot">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={create.isPending || !nom.trim()}>
            {create.isPending ? 'Enregistrement…' : 'Ajouter le client'}
          </button>
        </div>
      </form>
    </div>
  )
}
