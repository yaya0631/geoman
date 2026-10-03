import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Archive, ArrowDownToLine, ArrowUpFromLine, MapPin, Phone, Plus, Trash2, X } from 'lucide-react'
import { initials, fmtDate } from '@/lib/search'
import { statutOf, STATUT_LABEL, type Statut } from '@/lib/supabase'
import { useClientMutations, useDossierMutations, useMouvements, type ClientInput } from '@/hooks/useData'
import type { ClientRow } from '@/pages/ClientsPage'

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const toInt = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : null)

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
  const { update, remove, move } = useClientMutations()
  const dossierM = useDossierMutations()
  const mouvementsQ = useMouvements(client.id)
  const [motif, setMotif] = useState('')
  const [askMotif, setAskMotif] = useState(false)
  const lastOut = mouvementsQ.data?.find(m => m.type === 'sortie')

  const toggleArchive = (e?: React.FormEvent) => {
    e?.preventDefault()
    const type = client.en_archive ? 'sortie' : 'retour'
    move.mutate({ id: client.id, type, motif: motif.trim() || null }, {
      onSuccess: () => {
        toast.success(type === 'sortie' ? 'Dossier sorti de l\'archive' : 'Dossier remis en archive')
        setMotif(''); setAskMotif(false)
      },
      onError: err => toast.error(`Échec : ${(err as Error).message}`),
    })
  }
  const [adding, setAdding] = useState(false)
  const [numero, setNumero] = useState('')
  const [objet, setObjet] = useState('')
  const [statut, setStatut] = useState<Statut>('actif')

  const save = (patch: Partial<ClientInput> & { oldNom?: string }) =>
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

        <section className={`location ${client.en_archive ? 'in' : 'out'}`} aria-live="polite">
          <div className="location-top">
            <span className="location-icon" aria-hidden>
              {client.en_archive ? <Archive size={18} /> : <ArrowUpFromLine size={18} />}
            </span>
            <div className="location-text">
              <strong>{client.en_archive ? 'Dans l\'archive' : 'Sorti de l\'archive'}</strong>
              <span>
                {client.en_archive
                  ? <>{client.boite ? `Boîte ${client.boite}` : 'Non rangé'}{client.numero != null && <> · N° <span className="mono">{client.numero}</span></>}</>
                  : lastOut ? <>Depuis le {fmtDateTime(lastOut.created_at)}{lastOut.motif && ` — ${lastOut.motif}`}</> : 'Date de sortie inconnue'}
              </span>
            </div>
          </div>
          {askMotif ? (
            <form className="location-form" onSubmit={toggleArchive}>
              <label className="field">
                <span>{client.en_archive ? 'Motif de sortie' : 'Remarque au retour'} (facultatif)</span>
                <input autoFocus value={motif} onChange={e => setMotif(e.target.value)}
                  placeholder={client.en_archive ? 'Ex. Remis au client, dépôt cadastre…' : 'Ex. Complet, pièces ajoutées…'} />
              </label>
              <div className="modal-foot">
                <button type="button" className="btn-secondary" onClick={() => { setAskMotif(false); setMotif('') }}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={move.isPending}>
                  {client.en_archive ? 'Confirmer la sortie' : 'Confirmer le retour'}
                </button>
              </div>
            </form>
          ) : (
            <button className={client.en_archive ? 'btn-secondary' : 'btn-primary'} onClick={() => setAskMotif(true)}>
              {client.en_archive
                ? <><ArrowUpFromLine size={16} /> Sortir le dossier</>
                : <><ArrowDownToLine size={16} /> Remettre en archive</>}
            </button>
          )}
        </section>

        <section className="drawer-section">
          <h3>Classement</h3>
          <div className="field-row">
            <EditableField label="N° de classement" type="number" value={client.numero?.toString() ?? null}
              onSave={v => save({ numero: toInt(v) })} />
            <EditableField label="Boîte" type="number" value={client.boite?.toString() ?? null}
              onSave={v => save({ boite: toInt(v) })} />
          </div>
          <EditableField label="Code client" value={client.code} onSave={v => save({ code: v })} />
        </section>

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

        <section className="drawer-section">
          <h3>Historique <span className="muted">{mouvementsQ.data?.length ?? ''}</span></h3>
          {mouvementsQ.isLoading ? <p className="muted small-text">Chargement…</p>
            : mouvementsQ.error ? <p className="muted small-text">Historique indisponible. Vérifiez que la migration v6 a été appliquée.</p>
            : (
              <ol className="timeline">
                {mouvementsQ.data!.map(m => (
                  <li key={m.id} className={m.type}>
                    <strong>{m.type === 'sortie' ? 'Sorti de l\'archive' : 'Remis en archive'}</strong>
                    {m.motif && <span>{m.motif}</span>}
                    <span className="muted small-text">{fmtDateTime(m.created_at)}{m.par && ` · ${m.par}`}</span>
                  </li>
                ))}
                <li className="origin">
                  <strong>Classé dans l'archive</strong>
                  <span className="muted small-text">{fmtDate(client.date_archivage ?? client.created_at)}</span>
                </li>
              </ol>
            )}
        </section>

        <button className="btn-danger" onClick={del}><Trash2 size={15} /> Supprimer ce client</button>
      </aside>
    </div>
  )
}
