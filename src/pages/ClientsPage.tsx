import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Download, LayoutGrid, List, LogOut, Plus, Search, X } from 'lucide-react'
import { exportDatabase } from '@/lib/csv'
import { supabase, statutOf, joursDepuis, RETARD_JOURS, STATUT_LABEL, type Client, type Dossier, type Statut } from '@/lib/supabase'
import { norm } from '@/lib/search'
import { useClientMutations, useClients, useDossiers, useLastSorties } from '@/hooks/useData'
import ClientDetail from '@/components/ClientDetail'
import ClientForm from '@/components/ClientForm'
import BoxesView from '@/components/BoxesView'

type Filtre = 'tous' | Statut
const FILTRES: { key: Filtre; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'actif', label: 'En cours' },
  { key: 'instance', label: 'En instance' },
  { key: 'archive', label: 'Archivés' },
]
type Lieu = 'tous' | 'in' | 'out'
type Tri = 'numero' | 'boite' | 'nom' | 'recent' | 'sortie'
const PAGE = 60
// Les clients sans numéro passent en fin de liste
const byNum = (a: number | null, b: number | null) => (a ?? Infinity) - (b ?? Infinity)

export type ClientRow = Client & { dossiers: Dossier[]; statut: Statut | null; haystack: string; sortiDepuis: string | null }

export default function ClientsPage() {
  const clientsQ = useClients()
  const dossiersQ = useDossiers()
  const sortiesQ = useLastSorties()
  const { moveMany } = useClientMutations()
  const [query, setQuery] = useState('')
  const q = useDeferredValue(query)
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [lieu, setLieu] = useState<Lieu>('tous')
  const [tri, setTri] = useState<Tri>('numero')
  const [vue, setVue] = useState<'liste' | 'boites'>('liste')
  // undefined = toutes les boîtes, null = non rangés
  const [boiteF, setBoiteF] = useState<number | null | undefined>(undefined)
  const [exporting, setExporting] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [bulkMotif, setBulkMotif] = useState('')

  const runExport = async () => {
    setExporting(true)
    try {
      const n = await exportDatabase()
      toast.success(`Export terminé : ${n.clients} clients, ${n.dossiers} dossiers, ${n.mouvements} mouvements`)
    } catch (err) {
      toast.error(`Export impossible : ${(err as Error).message}`)
    } finally {
      setExporting(false)
    }
  }
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const searchRef = useRef<HTMLInputElement>(null)

  // « / » rechercher, « n » nouveau client, Échap fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target
      const typing = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement
      if (e.key === 'Escape') { setSelectedId(null); setCreating(false); if (!typing) setPicked(new Set()); return }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'n' && !selectedId && !creating) { e.preventDefault(); setCreating(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, creating])

  // Rattache chaque dossier à son client par nom normalisé
  const rows = useMemo<ClientRow[]>(() => {
    const byName = new Map<string, Dossier[]>()
    for (const d of dossiersQ.data ?? []) {
      const k = norm(d.nom)
      const list = byName.get(k)
      list ? list.push(d) : byName.set(k, [d])
    }
    return (clientsQ.data ?? []).map(c => {
      const dossiers = (byName.get(norm(c.nom)) ?? []).sort((a, b) => b.created_at.localeCompare(a.created_at))
      const statuts = dossiers.map(statutOf)
      const statut: Statut | null = statuts.includes('actif') ? 'actif' : statuts.includes('instance') ? 'instance' : statuts.length ? 'archive' : null
      const haystack = norm([c.nom, c.code, c.numero, c.boite && `boite ${c.boite}`, c.adresse, c.telephone, c.observation, ...dossiers.map(d => `${d.id} ${d.observations ?? ''}`)].join(' '))
      const sortiDepuis = c.en_archive ? null : sortiesQ.data?.get(c.id) ?? null
      return { ...c, dossiers, statut, haystack, sortiDepuis }
    })
  }, [clientsQ.data, dossiersQ.data, sortiesQ.data])

  // Lieux connus, dédoublonnés sans tenir compte de la casse ni des accents (orthographe la plus fréquente)
  const places = useMemo(() => {
    const freq = new Map<string, Map<string, number>>()
    const add = (v: string | null) => {
      const s = v?.trim(); if (!s) return
      const k = norm(s), m = freq.get(k) ?? new Map<string, number>()
      m.set(s, (m.get(s) ?? 0) + 1); freq.set(k, m)
    }
    for (const c of clientsQ.data ?? []) add(c.adresse)
    for (const d of dossiersQ.data ?? []) add(d.endroit)
    return [...freq.values()].map(m => [...m].sort((a, b) => b[1] - a[1])[0][0]).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [clientsQ.data, dossiersQ.data])

  const counts = useMemo(() => {
    const c: Record<Filtre, number> = { tous: rows.length, actif: 0, instance: 0, archive: 0 }
    for (const r of rows) if (r.statut) c[r.statut]++
    return c
  }, [rows])
  const sortis = useMemo(() => rows.filter(r => !r.en_archive).length, [rows])
  const enRetard = useMemo(() => rows.filter(r => r.sortiDepuis && joursDepuis(r.sortiDepuis) > RETARD_JOURS).length, [rows])

  const filtered = useMemo(() => {
    const terms = norm(q).split(' ').filter(Boolean)
    const list = rows.filter(r =>
      (filtre === 'tous' || r.statut === filtre)
      && (lieu === 'tous' || (lieu === 'in') === r.en_archive)
      && (boiteF === undefined || (r.boite || null) === boiteF)
      && terms.every(t => r.haystack.includes(t)))
    const byName = (a: ClientRow, b: ClientRow) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
    if (tri === 'numero') return list.sort((a, b) => byNum(a.numero, b.numero) || byName(a, b))
    if (tri === 'boite') return list.sort((a, b) => byNum(a.boite || null, b.boite || null) || byNum(a.numero, b.numero) || byName(a, b))
    if (tri === 'nom') return list.sort(byName)
    if (tri === 'sortie') return list.sort((a, b) => (a.sortiDepuis ?? '￿').localeCompare(b.sortiDepuis ?? '￿') || byName(a, b))
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [rows, q, filtre, lieu, tri, boiteF])

  useEffect(() => setLimit(PAGE), [q, filtre, lieu, tri, boiteF])

  const selected = rows.find(r => r.id === selectedId) ?? null
  const loading = clientsQ.isLoading || dossiersQ.isLoading
  const error = clientsQ.error || dossiersQ.error

  const pickedRows = rows.filter(r => picked.has(r.id))
  const pickedIn = pickedRows.filter(r => r.en_archive).length
  const toggle = (id: string) => setPicked(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const bulk = (type: 'sortie' | 'retour') => {
    const ids = pickedRows.filter(r => r.en_archive === (type === 'sortie')).map(r => r.id)
    if (!ids.length) return
    const s = ids.length > 1 ? 's' : ''
    moveMany.mutate({ ids, type, motif: bulkMotif.trim() || null }, {
      onSuccess: () => {
        toast.success(`${ids.length} dossier${s} ${type === 'sortie' ? `sorti${s}` : 'remis en archive'}`)
        setPicked(new Set()); setBulkMotif('')
      },
      onError: err => toast.error(`Échec : ${(err as Error).message}`),
    })
  }
  const showRetards = () => { setVue('liste'); setLieu('out'); setTri('sortie'); setBoiteF(undefined) }
  const openBox = (b: number | null) => { setBoiteF(b); setVue('liste'); setTri('numero') }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2 3 7v10l9 5 9-5V7z M3 7l9 5 9-5 M12 12v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          </span>
          <span className="brand-name">Geoman</span>
        </div>
        <button className="btn-ghost icon" title="Se déconnecter" onClick={() => supabase.auth.signOut()}>
          <LogOut size={17} />
        </button>
      </header>

      <main className="content">
        <section className="hero">
          <div>
            <h1>Clients</h1>
            <p className="muted">{loading ? 'Chargement…' : `${rows.length} clients · ${dossiersQ.data?.length ?? 0} dossiers`}</p>
          </div>
          <div className="hero-actions">
            <div className="segmented" role="group" aria-label="Affichage">
              <button aria-pressed={vue === 'liste'} onClick={() => setVue('liste')}><List size={14} aria-hidden /> Liste</button>
              <button aria-pressed={vue === 'boites'} onClick={() => setVue('boites')}><LayoutGrid size={14} aria-hidden /> Boîtes</button>
            </div>
            <button className="btn-secondary" onClick={runExport} disabled={exporting || loading}>
              <Download size={16} /> {exporting ? 'Export…' : 'Exporter CSV'}
            </button>
            <button className="btn-primary" onClick={() => setCreating(true)} title="Raccourci : N">
              <Plus size={17} /> Nouveau client
            </button>
          </div>
        </section>

        {enRetard > 0 && (
          <button className="alert-banner" onClick={showRetards}>
            <AlertTriangle size={17} aria-hidden />
            <span><strong>{enRetard} dossier{enRetard > 1 ? 's' : ''}</strong> sorti{enRetard > 1 ? 's' : ''} depuis plus de {RETARD_JOURS} jours</span>
            <span className="alert-cta">Voir</span>
          </button>
        )}

        {vue === 'boites' ? (
          loading ? <ul className="boxes">{Array.from({ length: 8 }, (_, i) => <li key={i} className="box skeleton" />)}</ul>
            : <BoxesView rows={rows} onOpen={openBox} />
        ) : (
          <>
            <div className="search">
              <Search size={19} className="search-icon" />
              <input
                ref={searchRef}
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un nom, un n°, un code, une adresse, un téléphone…"
                aria-label="Rechercher"
              />
              {query ? (
                <button className="search-clear" onClick={() => { setQuery(''); searchRef.current?.focus() }} aria-label="Effacer"><X size={16} /></button>
              ) : <kbd>/</kbd>}
            </div>

            <div className="toolbar">
              <div className="chips" role="tablist">
                {FILTRES.map(f => (
                  <button key={f.key} role="tab" aria-selected={filtre === f.key}
                    className={`chip ${filtre === f.key ? 'on' : ''}`} onClick={() => setFiltre(f.key)}>
                    {f.key !== 'tous' && <span className={`dot ${f.key}`} />}
                    {f.label}<span className="chip-n">{counts[f.key]}</span>
                  </button>
                ))}
              </div>
              <div className="segmented" role="group" aria-label="Emplacement du dossier">
                {([['tous', 'Partout', rows.length], ['in', 'En archive', rows.length - sortis], ['out', 'Sortis', sortis]] as const).map(([k, label, n]) => (
                  <button key={k} aria-pressed={lieu === k} onClick={() => setLieu(k)}>
                    {label}<span className="chip-n">{n}</span>
                  </button>
                ))}
              </div>
              <select className="sort" value={tri} onChange={e => setTri(e.target.value as Tri)} aria-label="Trier">
                <option value="numero">N° de classement</option>
                <option value="boite">Boîte</option>
                <option value="nom">Nom A → Z</option>
                <option value="recent">Plus récents</option>
                <option value="sortie">Sortis depuis longtemps</option>
              </select>
            </div>

            {boiteF !== undefined && (
              <div className="active-filter">
                <span>{boiteF == null ? 'Dossiers non rangés' : <>Boîte <span className="mono">{boiteF}</span></>}</span>
                <button onClick={() => setBoiteF(undefined)} aria-label="Retirer le filtre boîte"><X size={14} /></button>
              </div>
            )}

            {error ? (
              <div className="empty">
                <strong>Impossible de charger les données</strong>
                <span className="muted">{(error as Error).message}</span>
                <button className="btn-secondary" onClick={() => { clientsQ.refetch(); dossiersQ.refetch() }}>Réessayer</button>
              </div>
            ) : loading ? (
              <ul className="list">{Array.from({ length: 8 }, (_, i) => <li key={i} className="row skeleton" />)}</ul>
            ) : filtered.length === 0 ? (
              <div className="empty">
                <strong>Aucun client trouvé</strong>
                <span className="muted">{query ? `Rien ne correspond à « ${query} ».` : 'Aucun client dans cette catégorie.'}</span>
                <button className="btn-secondary" onClick={() => setCreating(true)}><Plus size={15} /> Créer {query ? `« ${query} »` : 'un client'}</button>
              </div>
            ) : (
              <>
                <p className="result-count">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</p>
                <ul className={`list ${picked.size ? 'picking' : ''}`}>
                  {filtered.slice(0, limit).map(r => {
                    const jours = r.sortiDepuis ? joursDepuis(r.sortiDepuis) : null
                    return (
                      <li key={r.id} className={`row-item ${picked.has(r.id) ? 'picked' : ''}`}>
                        <label className="row-check" title="Sélectionner">
                          <input type="checkbox" checked={picked.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Sélectionner ${r.nom}`} />
                        </label>
                        <button className={`row ${selectedId === r.id ? 'active' : ''}`} onClick={() => setSelectedId(r.id)}>
                          <span className="file-no" title={r.boite ? `Boîte ${r.boite}` : 'Non rangé'}>
                            <span className="mono">{r.numero ?? '—'}</span>
                            <span className="file-box">{r.boite ? `B${r.boite}` : 'NR'}</span>
                          </span>
                          <span className="row-main">
                            <span className="row-name">{r.nom}{r.code && <span className="row-code mono">{r.code}</span>}</span>
                            <span className="row-sub">{r.adresse || 'Adresse non renseignée'}{r.telephone && <> · <span className="mono">{r.telephone}</span></>}</span>
                          </span>
                          <span className="row-meta">
                            {!r.en_archive && (
                              <span className={`badge out ${jours != null && jours > RETARD_JOURS ? 'late' : ''}`}>
                                <ArrowUpFromLine size={12} aria-hidden /> Sorti{jours != null && ` · ${jours} j`}
                              </span>
                            )}
                            {r.statut && <span className={`badge ${r.statut}`}>{STATUT_LABEL[r.statut]}</span>}
                            <span className="row-count">{r.dossiers.length} dossier{r.dossiers.length > 1 ? 's' : ''}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {filtered.length > limit && (
                  <button className="btn-secondary more" onClick={() => setLimit(l => l + PAGE)}>
                    Afficher plus ({filtered.length - limit} restants)
                  </button>
                )}
              </>
            )}
          </>
        )}
      </main>

      {picked.size > 0 && (
        <div className="bulk-bar" role="region" aria-label="Actions groupées">
          <span className="bulk-n"><strong>{picked.size}</strong> sélectionné{picked.size > 1 ? 's' : ''}</span>
          <input value={bulkMotif} onChange={e => setBulkMotif(e.target.value)} placeholder="Motif (facultatif)" aria-label="Motif commun" />
          <button className="btn-secondary" disabled={moveMany.isPending || !pickedIn} onClick={() => bulk('sortie')}>
            <ArrowUpFromLine size={15} /> Sortir ({pickedIn})
          </button>
          <button className="btn-primary" disabled={moveMany.isPending || pickedIn === pickedRows.length} onClick={() => bulk('retour')}>
            <ArrowDownToLine size={15} /> Remettre ({pickedRows.length - pickedIn})
          </button>
          <button className="btn-ghost icon" onClick={() => setPicked(new Set())} aria-label="Annuler la sélection"><X size={17} /></button>
        </div>
      )}

      <datalist id="places">{places.map(p => <option key={p} value={p} />)}</datalist>

      {selected && <ClientDetail client={selected} onClose={() => setSelectedId(null)} />}
      {creating && (
        <ClientForm
          initialName={query}
          existing={rows}
          places={places}
          onClose={() => setCreating(false)}
          onCreated={id => { setCreating(false); setQuery(''); setSelectedId(id) }}
          onOpenExisting={id => { setCreating(false); setSelectedId(id) }}
        />
      )}
    </div>
  )
}
