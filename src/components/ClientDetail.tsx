import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { MapPin, Phone, Plus, Trash2, X } from 'lucide-react'
import { initials, fmtDate } from '@/lib/search'
import { statutOf, STATUT_LABEL, type Statut } from '@/lib/supabase'
import { useClientMutations, useDossierMutations } from '@/hooks/useData'
import type { ClientRow } from '@/pages/ClientsPage'

const ETAT: Record<Statut, { etat: string; archived: boolean }> = {
  actif: { etat: 'actif', archived: false },
  instance: { etat: 'En attente', archived: false },
  archive: { etat: 'Termine', archived: true },
}

function EditableField({ label, value, onSave, multiline, type }: {
  label: string; value: string | null; onSave: (v: string | null) => void; multiline?: boolean; type?: string
}) {
  const [v, setV] = useState(value ?? '')
  useEffect(() => setV(value ?? ''), [value])
  const commit = () => { const next = v.trim() || null; if (next !== (value ?? null)) onSave(next) }
  return (
    <label className="field">
      <span>{label}</span>
      {multiline
        ? <textarea rows={3} value={v} onChange={e => setV(e.target.value)} onBlur={commit} placeholder="—" />
        : <input type={type} value={v} onChange={e => setV(e.target.value)} onBlur={commit}
            onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} placeholder="—" />}
    </label>
  )
}

export default function ClientDetail({ client, onClose }: { client: ClientRow; onClose: () => void }) {
  const { update, remove } = useClientMutations()
  const dossierM = useDossierMutations()
  const [adding, setAdding] = useState(false)
  const [numero, setNumero] = useState('')
  const [objet, setObjet] = useState('')
  const [statut, setStatut] = useState<Statut>('actif')

  const save = (patch: { nom?: string; oldNom?: string; telephone?: string | null; adresse?: string | null; observation?: string | null }) =>
    update.mutate({ id: client.id, ...patch }, {
      onSuccess: () => toast.success('Enregistré'),
      onError: err => toast.error(`Échec : ${(err as Error).message}`),
    })

  const addDossier = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = numero.trim() || `D-${new Date().getFullYear()}-${Date.now().toString(36).slice(-5).toUpperCase()}`
    try {
      await dossierM.create.mutateAsync({
        id, nom: client.nom, endroit: client.adresse, observations: objet.trim() || null, ...ETAT[statut],
      })
      toast.success('Dossier ajouté')
      setAdding(false); setNumero(''); setObjet(''); setStatut('actif')
    } catch (err) {
      toast.error(`Échec : ${(err as Error).message}`)
    }
  }

  const changeStatut = (id: string, s: Statut) =>
    dossierM.update.mutate({ id, ...ETAT[s] }, { onError: err => toast.error((err as Error).message) })

  const del = () => {
    if (!confirm(`Supprimer définitivement le client « ${client.nom} » ? Ses dossiers sont conservés.`)) return
    remove.mutate(client.id, {
      onSuccess: () => { toast.success('Client supprimé'); onClose() },
      onError: err => toast.error((err as Error).message),
    })
  }

  return (
    <div className="overlay drawer-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" aria-label={`Fiche de ${client.nom}`}>
        <div className="drawer-head">
          <span className="avatar lg">{initials(client.nom)}</span>
          <div className="drawer-title">
            <h2>{client.nom}</h2>
            <span className="muted">Client depuis le {fmtDate(client.created_at)}</span>
          </div>
          <button className="btn-ghost icon" onClick={onClose} aria-label="Fermer"><X size={19} /></button>
        </div>

        <div className="quick">
          {client.telephone
            ? <a className="btn-secondary" href={`tel:${client.telephone.replace(/\s/g, '')}`}><Phone size={15} /> Appeler</a>
            : <span className="btn-secondary disabled"><Phone size={15} /> Pas de numéro</span>}
          {client.adresse && (
            <a className="btn-secondary" target="_blank" rel="noreferrer"
              href={`https://www.google.com/maps/search/${encodeURIComponent(client.adresse + ', Oran')}`}>
              <MapPin size={15} /> Carte
            </a>
          )}
        </div>

        <section className="drawer-section">
          <h3>Coordonnées</h3>
          <EditableField label="Nom complet" value={client.nom} onSave={v => v && save({ nom: v, oldNom: client.nom })} />
          <div className="field-row">
            <EditableField label="Téléphone" type="tel" value={client.telephone} onSave={v => save({ telephone: v })} />
            <EditableField label="Adresse / lieu" value={client.adresse} onSave={v => save({ adresse: v })} />
          </div>
          <EditableField label="Note" multiline value={client.observation} onSave={v => save({ observation: v })} />
        </section>

        <section className="drawer-section">
          <div className="section-head">
            <h3>Dossiers <span className="muted">{client.dossiers.length}</span></h3>
            {!adding && <button className="btn-ghost small" onClick={() => setAdding(true)}><Plus size={15} /> Ajouter</button>}
          </div>

          {adding && (
            <form className="dossier-form" onSubmit={addDossier}>
              <div className="field-row">
                <label className="field"><span>N° de dossier</span>
                  <input value={numero} onChange={e => setNumero(e.target.value)} placeholder="Auto si vide" autoFocus /></label>
                <label className="field"><span>Statut</span>
                  <select value={statut} onChange={e => setStatut(e.target.value as Statut)}>
                    {(Object.keys(STATUT_LABEL) as Statut[]).map(s => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
                  </select></label>
              </div>
              <label className="field"><span>Objet / note</span>
                <input value={objet} onChange={e => setObjet(e.target.value)} placeholder="Ex. Établissement EDD" /></label>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={dossierM.create.isPending}>Créer le dossier</button>
              </div>
            </form>
          )}

          {client.dossiers.length === 0 && !adding ? (
            <p className="muted small-text">Aucun dossier pour ce client.</p>
          ) : (
            <ul className="dossiers">
              {client.dossiers.map(d => {
                const s = statutOf(d)
                return (
                  <li key={d.id} className="dossier">
                    <div className="dossier-top">
                      <span className="mono dossier-id">{d.id}</span>
                      <select className={`badge-select ${s}`} value={s} onChange={e => changeStatut(d.id, e.target.value as Statut)} aria-label="Statut">
                        {(Object.keys(STATUT_LABEL) as Statut[]).map(k => <option key={k} value={k}>{STATUT_LABEL[k]}</option>)}
                      </select>
                    </div>
                    {d.observations && <p className="dossier-obs">{d.observations}</p>}
                    <span className="muted small-text">{d.endroit ? `${d.endroit} · ` : ''}{fmtDate(d.created_at)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <button className="btn-danger" onClick={del}><Trash2 size={15} /> Supprimer ce client</button>
      </aside>
    </div>
  )
}
