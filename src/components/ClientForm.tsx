import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import { norm } from '@/lib/search'
import { useClientMutations } from '@/hooks/useData'
import { useDialog } from '@/hooks/useDialog'
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
  const ref = useDialog<HTMLFormElement>(onClose)
  const [nom, setNom] = useState(initialName)
  const [telephone, setTelephone] = useState('')
  const [adresse, setAdresse] = useState('')
  const [observation, setObservation] = useState('')
  // Suggestion : n° suivant le plus grand déjà attribué
  const [numero, setNumero] = useState(() => String(Math.max(0, ...existing.map(c => c.numero ?? 0)) + 1))
  const [boite, setBoite] = useState('')
  const [code, setCode] = useState('')

  // Boîte du client classé juste avant ce numéro, proposée par défaut
  const boiteSuggeree = useMemo(() => {
    const n = Number(numero)
    if (!n) return null
    const before = existing.filter(c => c.numero != null && c.numero < n && c.boite)
      .sort((a, b) => b.numero! - a.numero!)[0]
    return before?.boite ?? null
  }, [numero, existing])
  const numeroPris = existing.find(c => numero && c.numero === Number(numero))
  const codePris = existing.find(c => code.trim() && norm(c.code) === norm(code))

  // Clients au nom proche (tous les mots saisis présents) pour éviter les doublons
  const similar = useMemo(() => {
    const terms = norm(nom).split(' ').filter(t => t.length > 2)
    if (!terms.length) return []
    return existing.filter(c => terms.every(t => norm(c.nom).includes(t))).slice(0, 3)
  }, [nom, existing])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nom.trim() || numeroPris || codePris) return
    const b = boite.trim() ? Number(boite) : boiteSuggeree
    try {
      const c = await create.mutateAsync({
        nom: nom.trim(),
        telephone: telephone.trim() || null,
        adresse: adresse.trim() || null,
        observation: observation.trim() || null,
        code: code.trim() || null,
        numero: numero ? Number(numero) : null,
        boite: b || null,
      })
      toast.success('Client ajouté')
      onCreated(c.id)
    } catch (err) {
      toast.error(`Enregistrement impossible. ${(err as Error).message}`)
    }
  }

  return createPortal(
    <div className="overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form ref={ref} className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="modal-head">
          <h2 id="form-title">Nouveau client</h2>
          <button type="button" className="btn-ghost icon" onClick={onClose} aria-label="Fermer"><X size={18} aria-hidden /></button>
        </div>

        <label className="field">
          <span>Nom complet <span className="required" aria-hidden>*</span></span>
          <input autoFocus required name="nom" autoComplete="off" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex. BENALI Mohamed" />
        </label>

        {similar.length > 0 && (
          <div className="warn" role="status">
            <strong>Un client au nom proche existe déjà. Ouvrir sa fiche :</strong>
            {similar.map(c => (
              <button type="button" key={c.id} className="link" onClick={() => onOpenExisting(c.id)}>
                {c.nom}{c.adresse ? ` — ${c.adresse}` : ''}
              </button>
            ))}
          </div>
        )}

        <div className="field-row">
          <label className="field">
            <span>N° de classement</span>
            <input type="number" inputMode="numeric" min={1} value={numero} onChange={e => setNumero(e.target.value)}
              aria-invalid={!!numeroPris} aria-describedby={numeroPris ? 'form-error' : undefined} className="mono" />
          </label>
          <label className="field">
            <span>Boîte</span>
            <input type="number" inputMode="numeric" min={0} value={boite} onChange={e => setBoite(e.target.value)}
              placeholder={boiteSuggeree ? `${boiteSuggeree} (suggérée)` : 'Non rangé'} className="mono" />
          </label>
          <label className="field">
            <span>Code client</span>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Ex. AET-2024-017"
              aria-invalid={!!codePris} aria-describedby={codePris ? 'form-error' : undefined} className="mono" />
          </label>
        </div>
        {(numeroPris || codePris) && (
          <p className="field-error" id="form-error" role="alert">
            {numeroPris ? `Le n° ${numero} est déjà attribué à ${numeroPris.nom}. Choisissez un autre numéro.`
              : `Le code « ${code} » est déjà utilisé par ${codePris!.nom}.`}
          </p>
        )}

        <div className="field-row">
          <label className="field">
            <span>Téléphone</span>
            <input type="tel" inputMode="tel" value={telephone} onChange={e => setTelephone(e.target.value)} name="tel" autoComplete="off" placeholder="0550 12 34 56" />
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
          <button type="submit" className="btn-primary" disabled={create.isPending || !nom.trim() || !!numeroPris || !!codePris}>
            {create.isPending ? 'Enregistrement…' : 'Ajouter le client'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
