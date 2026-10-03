import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Check, Download, LayoutGrid, List, LogOut, Plus, Printer, Search, X } from 'lucide-react'
import { exportDatabase } from '@/lib/csv'
import { supabase, statutOf, STATUT_LABEL, type Client, type Dossier, type Statut } from '@/lib/supabase'
import { norm, fmtDate } from '@/lib/search'
import { useClients, useDossiers, useMouvementsIndex } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import ClientDetail from '@/components/ClientDetail'
import ClientForm from '@/components/ClientForm'
import BoxesView from '@/components/BoxesView'
import BulkMoveDialog from '@/components/BulkMoveDialog'
import PrintLabels from '@/components/PrintLabels'

type Filtre = 'tous' | Statut
const FILTRES: { key: Filtre; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'actif', label: 'En cours' },
  { key: 'instance', label: 'En instance' },
  { key: 'archive', label: 'Archivés' },
]
type Lieu = 'tous' | 'in' | 'out'
type Tri = 'numero' | 'boite' | 'nom' | 'recent'
type Vue = 'liste' | 'boites'
const PAGE = 60
// Un dossier sorti depuis plus de 30 jours est signalé en retard
export const OVERDUE_DAYS = 30
const DAY = 86_400_000
// Les clients sans numéro passent en fin de liste
const byNum = (a: number | null, b: number | null) => (a ?? Infinity) - (b ?? Infinity)

export type ClientRow = Client & {
  dossiers: Dossier[]; statut: Statut | null; haystack: string
  sortiLe: string | null; joursSorti: number | null; enRetard: boolean
}

export default function ClientsPage() {
  const clientsQ = useClients()
  const dossiersQ = useDossiers()
  const mouvQ = useMouvementsIndex()
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const q = useDeferredValue(query)
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [lieu, setLieu] = useState<Lieu>('tous')
  const [retardOnly, setRetardOnly] = useState(false)
  const [boite, setBoite] = useState<number | 'none' | null>(null)
  const [tri, setTri] = useState<Tri>('numero')
  const [vue, setVue] = useState<Vue>('liste')
  const [exporting, setExporting] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [bulk, setBulk] = useState<'sortie' | 'retour' | null>(null)
  const [printing, setPrinting] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const runExport = async () => {
    setExporting(true)
    try {
      const n = await exportDatabase()
      toast.success(`Export terminé : ${n.clients} clients, ${n.dossiers} dossiers, ${n.mouvements} mouvements`)
    } catch (err) {
      toast.error(`Export impossible. ${(err as Error).message}`)
    } finally {
      setExporting(false)
    }
  }

  // Rattache chaque dossier à son client par nom normalisé
  const rows = useMemo<ClientRow[]>(() => {
    const byName = new Map<string, Dossier[]>()
    for (const d of dossiersQ.data ?? []) {
      const k = norm(d.nom)
      const list = byName.get(k)
      list ? list.push(d) : byName.set(k, [d])
    }
    const now = Date.now()
    return (clientsQ.data ?? []).map(c => {
      const dossiers = (byName.get(norm(c.nom)) ?? []).sort((a, b) => b.created_at.localeCompare(a.created_at))
      const statuts = dossiers.map(statutOf)
      const statut: Statut | null = statuts.includes('actif') ? 'actif' : statuts.includes('instance') ? 'instance' : statuts.length ? 'archive' : null
      const haystack = norm([c.nom, c.code, c.numero, c.boite && `boite ${c.boite}`, c.adresse, c.telephone, c.observation, ...dossiers.map(d => `${d.id} ${d.observations ?? ''}`)].join(' '))
      const sortiLe = c.en_archive ? null : mouvQ.data?.lastSortie.get(c.id) ?? null
      const joursSorti = sortiLe ? Math.floor((now - new Date(sortiLe).getTime()) / DAY) : null
      return { ...c, dossiers, statut, haystack, sortiLe, joursSorti, enRetard: (joursSorti ?? 0) > OVERDUE_DAYS }
    })
  }, [clientsQ.data, dossiersQ.data, mouvQ.data])

  const counts = useMemo(() => {
    const c: Record<Filtre, number> = { tous: rows.length, actif: 0, instance: 0, archive: 0 }
    for (const r of rows) if (r.statut) c[r.statut]++
    return c
  }, [rows])
  const sortis = useMemo(() => rows.filter(r => !r.en_archive).length, [rows])
  const enRetard = useMemo(() => rows.filter(r => r.enRetard).length, [rows])

  const filtered = useMemo(() => {
    const terms = norm(q).split(' ').filter(Boolean)
    const list = rows.filter(r =>
      (filtre === 'tous' || r.statut === filtre)
      && (lieu === 'tous' || (lieu === 'in') === r.en_archive)
      && (!retardOnly || r.enRetard)
      && (boite === null || (boite === 'none' ? !r.boite : r.boite === boite))
      && terms.every(t => r.haystack.includes(t)))
    const byName = (a: ClientRow, b: ClientRow) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
    if (retardOnly) return list.sort((a, b) => (b.joursSorti ?? 0) - (a.joursSorti ?? 0))
    if (tri === 'numero') return list.sort((a, b) => byNum(a.numero, b.numero) || byName(a, b))
    if (tri === 'boite') return list.sort((a, b) => byNum(a.boite || null, b.boite || null) || byNum(a.numero, b.numero) || byName(a, b))
    if (tri === 'nom') return list.sort(byName)
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [rows, q, filtre, lieu, retardOnly, boite, tri])

  useEffect(() => setLimit(PAGE), [q, filtre, lieu, retardOnly, boite, tri])

  const overlayOpen = !!selectedId || creating || !!bulk
  // Raccourcis : « / » rechercher, « N » nouveau client, « V » liste / boîtes, Échap vide la sélection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement
      if (overlayOpen || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape' && typing && t === searchRef.current) { setQuery(''); t.blur(); return }
      if (typing) return
      if (e.key === '/') { e.preventDefault(); setVue('liste'); requestAnimationFrame(() => searchRef.current?.focus()) }
      else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setCreating(true) }
      else if (e.key === 'v' || e.key === 'V') setVue(v => (v === 'liste' ? 'boites' : 'liste'))
      else if (e.key === 'Escape') setPicked(new Set())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [overlayOpen])

  const togglePick = (id: string) => setPicked(p => {
    const next = new Set(p)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const visible = filtered.slice(0, limit)
  const allPicked = visible.length > 0 && visible.every(r => picked.has(r.id))
  const pickAll = () => setPicked(p => {
    const next = new Set(p)
    visible.forEach(r => (allPicked ? next.delete(r.id) : next.add(r.id)))
    return next
  })
  const pickedRows = rows.filter(r => picked.has(r.id))

  const selected = rows.find(r => r.id === selectedId) ?? null
  const loading = clientsQ.isLoading || dossiersQ.isLoading
  const error = clientsQ.error || dossiersQ.error
  const hasFilters = filtre !== 'tous' || lieu !== 'tous' || retardOnly || boite !== null
  const resetFilters = () => { setFiltre('tous'); setLieu('tous'); setRetardOnly(false); setBoite(null); setQuery('') }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2 3 7v10l9 5 9-5V7z M3 7l9 5 9-5 M12 12v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          </span>
          <span className="brand-name">Geoman</span>
        </div>
        <div className="topbar-end">
          {session?.user.email && <span className="user-email">{session.user.email}</span>}
          <button className="btn-ghost icon" aria-label="Se déconnecter" title="Se déconnecter" onClick={() => supabase.auth.signOut()}>
            <LogOut size={17} aria-hidden />
          </button>
        </div>
      </header>

      <main className="content">
        <section className="hero">
          <div>
            <h1>Clients</h1>
            <p className="muted">
              {loading ? 'Chargement…' : <><span className="num">{rows.length}</span> clients · <span className="num">{dossiersQ.data?.length ?? 0}</span> dossiers · <span className="num">{sortis}</span> sortis</>}
            </p>
          </div>
          <div className="hero-actions">
            <button className="btn-secondary" onClick={runExport} disabled={exporting || loading}>
              <Download size={16} aria-hidden /> {exporting ? 'Export en cours…' : 'Exporter en CSV'}
            </button>
            <button className="btn-primary fab" onClick={() => setCreating(true)} title="Raccourci : N">
              <Plus size={17} aria-hidden /> Nouveau client
            </button>
          </div>
        </section>

        {enRetard > 0 && !retardOnly && (
          <div className="alert" role="status">
            <AlertTriangle size={18} aria-hidden />
            <span>
              <strong>{enRetard} dossier{enRetard > 1 ? 's' : ''} sorti{enRetard > 1 ? 's' : ''} depuis plus de {OVERDUE_DAYS} jours.</strong>{' '}
              Pensez à {enRetard > 1 ? 'les' : 'le'} récupérer.
            </span>
            <button className="btn-secondary small" onClick={() => { setRetardOnly(true); setVue('liste') }}>Voir les retards</button>
          </div>
        )}

        <div className="search">
          <Search size={19} className="search-icon" aria-hidden />
          <input
            ref={searchRef}
            type="search"
            autoFocus
            value={query}
            onChange={e => { setQuery(e.target.value); if (vue === 'boites') setVue('liste') }}
            placeholder="Nom, code, n° de classement, adresse, téléphone, n° de dossier…"
            aria-label="Rechercher un client"
          />
          {query ? (
            <button className="search-clear" onClick={() => { setQuery(''); searchRef.current?.focus() }} aria-label="Effacer la recherche"><X size={16} aria-hidden /></button>
          ) : <kbd aria-hidden>/</kbd>}
        </div>

        <div className="toolbar">
          <div className="chips" role="group" aria-label="Statut des dossiers">
            {FILTRES.map(f => (
              <button key={f.key} aria-pressed={filtre === f.key}
                className="chip" onClick={() => setFiltre(f.key)}>
                {f.key !== 'tous' && <span className={`dot ${f.key}`} aria-hidden />}
                {f.label}<span className="chip-n">{counts[f.key]}</span>
              </button>
            ))}
          </div>
          <div className="toolbar-end">
            <div className="segmented" role="group" aria-label="Emplacement du dossier">
              {([['tous', 'Partout', rows.length], ['in', 'En archive', rows.length - sortis], ['out', 'Sortis', sortis]] as const).map(([k, label, n]) => (
                <button key={k} aria-pressed={lieu === k} onClick={() => setLieu(k)}>
                  {label}<span className="chip-n">{n}</span>
                </button>
              ))}
            </div>
            <div className="segmented" role="group" aria-label="Affichage">
              <button aria-pressed={vue === 'liste'} onClick={() => setVue('liste')} title="Liste (V)"><List size={15} aria-hidden /> Liste</button>
              <button aria-pressed={vue === 'boites'} onClick={() => setVue('boites')} title="Boîtes (V)"><LayoutGrid size={15} aria-hidden /> Boîtes</button>
            </div>
          </div>
        </div>

        {(retardOnly || boite !== null) && (
          <div className="active-filters">
            {retardOnly && (
              <button className="filter-tag warn-tag" onClick={() => setRetardOnly(false)} aria-label="Retirer le filtre En retard">
                En retard (+{OVERDUE_DAYS} j) <X size={13} aria-hidden />
              </button>
            )}
            {boite !== null && (
              <button className="filter-tag" onClick={() => setBoite(null)} aria-label="Retirer le filtre de boîte">
                {boite === 'none' ? 'Non rangés' : `Boîte ${boite}`} <X size={13} aria-hidden />
              </button>
            )}
          </div>
        )}

        {error ? (
          <div className="empty">
            <strong>Impossible de charger les données</strong>
            <span className="muted">Vérifiez votre connexion, puis réessayez. ({(error as Error).message})</span>
            <button className="btn-secondary" onClick={() => { clientsQ.refetch(); dossiersQ.refetch() }}>Réessayer</button>
          </div>
        ) : loading ? (
          <ul className="list" aria-busy="true" aria-label="Chargement">{Array.from({ length: 8 }, (_, i) => <li key={i} className="row skeleton" />)}</ul>
        ) : vue === 'boites' ? (
          <BoxesView rows={rows} onOpen={b => { setBoite(b ?? 'none'); setTri('numero'); setVue('liste') }} />
        ) : filtered.length === 0 ? (
          <div className="empty">
            <strong>Aucun client trouvé</strong>
            <span className="muted">{query ? `Aucun résultat pour « ${query} ».` : 'Aucun client ne correspond à ces filtres.'}</span>
            <div className="empty-actions">
              {hasFilters && <button className="btn-secondary" onClick={resetFilters}>Effacer les filtres</button>}
              <button className="btn-secondary" onClick={() => setCreating(true)}><Plus size={15} aria-hidden /> Créer {query ? `« ${query} »` : 'un client'}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="list-head">
              <label className="check">
                <input type="checkbox" checked={allPicked} onChange={pickAll} aria-label="Sélectionner tous les clients affichés" />
              </label>
              <p className="result-count">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</p>
              <select className="sort" value={retardOnly ? 'retard' : tri} disabled={retardOnly}
                onChange={e => setTri(e.target.value as Tri)} aria-label="Trier par">
                {retardOnly && <option value="retard">Plus anciennes sorties</option>}
                <option value="numero">N° de classement</option>
                <option value="boite">Boîte</option>
                <option value="nom">Nom (A → Z)</option>
                <option value="recent">Plus récents</option>
              </select>
            </div>
            <ul className="list">
              {visible.map(r => (
                <li key={r.id} className={`row-wrap ${selectedId === r.id ? 'active' : ''} ${picked.has(r.id) ? 'picked' : ''}`}>
                  <label className="check">
                    <input type="checkbox" checked={picked.has(r.id)} onChange={() => togglePick(r.id)} aria-label={`Sélectionner ${r.nom}`} />
                  </label>
                  <button className="row" onClick={() => setSelectedId(r.id)}>
                    <span className="file-no">
                      <span className="num">{r.numero ?? '—'}</span>
                      <span className="file-box">{r.boite ? `B${r.boite}` : 'Non rangé'}</span>
                    </span>
                    <span className="row-main">
                      <span className="row-name"><span className="truncate">{r.nom}</span>{r.code && <span className="row-code mono">{r.code}</span>}</span>
                      <span className="row-sub">{r.adresse || 'Adresse non renseignée'}{r.telephone && <> · <span className="num">{r.telephone}</span></>}</span>
                    </span>
                    <span className="row-meta">
                      <span className="row-badges">
                        {!r.en_archive && (
                          <span className={`badge ${r.enRetard ? 'late' : 'out'}`} title={r.sortiLe ? `Sorti le ${fmtDate(r.sortiLe)}` : undefined}>
                            {r.enRetard ? <AlertTriangle size={12} aria-hidden /> : <ArrowUpFromLine size={12} aria-hidden />}
                            {r.enRetard ? `Sorti · ${r.joursSorti} j` : 'Sorti'}
                          </span>
                        )}
                        {r.statut && <span className={`badge ${r.statut}`}>{STATUT_LABEL[r.statut]}</span>}
                      </span>
                      <span className="row-count">{r.dossiers.length} dossier{r.dossiers.length > 1 ? 's' : ''}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {filtered.length > limit && (
              <button className="btn-secondary more" onClick={() => setLimit(l => l + PAGE)}>
                Afficher plus ({filtered.length - limit} restants)
              </button>
            )}
            <p className="shortcuts" aria-hidden>
              <kbd>/</kbd> rechercher <kbd>N</kbd> nouveau client <kbd>V</kbd> liste ou boîtes <kbd>Échap</kbd> fermer
            </p>
          </>
        )}
      </main>

      {picked.size > 0 && (
        <div className="bulkbar" role="region" aria-label="Actions groupées">
          <span className="bulk-count"><Check size={15} aria-hidden /> {picked.size} sélectionné{picked.size > 1 ? 's' : ''}</span>
          <div className="bulk-actions">
            <button className="btn-bulk" onClick={() => setBulk('sortie')}><ArrowUpFromLine size={15} aria-hidden /> Sortir</button>
            <button className="btn-bulk" onClick={() => setBulk('retour')}><ArrowDownToLine size={15} aria-hidden /> Remettre en archive</button>
            <button className="btn-bulk" onClick={() => setPrinting(true)}><Printer size={15} aria-hidden /> Imprimer les étiquettes</button>
            <button className="btn-bulk icon" onClick={() => setPicked(new Set())} aria-label="Vider la sélection"><X size={16} aria-hidden /></button>
          </div>
        </div>
      )}

      {selected && <ClientDetail client={selected} motifs={mouvQ.data?.motifs ?? []} onClose={() => setSelectedId(null)} />}
      {creating && (
        <ClientForm
          initialName={query}
          existing={rows}
          onClose={() => setCreating(false)}
          onCreated={id => { setCreating(false); setQuery(''); setSelectedId(id) }}
          onOpenExisting={id => { setCreating(false); setSelectedId(id) }}
        />
      )}
      {bulk && (
        <BulkMoveDialog type={bulk} clients={pickedRows} motifs={mouvQ.data?.motifs ?? []}
          onClose={() => setBulk(null)} onDone={() => { setBulk(null); setPicked(new Set()) }} />
      )}
      {printing && <PrintLabels clients={pickedRows} onDone={() => setPrinting(false)} />}
    </div>
  )
}
