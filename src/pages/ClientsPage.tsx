import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { LogOut, Plus, Search, X } from 'lucide-react'
import { supabase, statutOf, STATUT_LABEL, type Client, type Dossier, type Statut } from '@/lib/supabase'
import { norm, initials } from '@/lib/search'
import { useClients, useDossiers } from '@/hooks/useData'
import ClientDetail from '@/components/ClientDetail'
import ClientForm from '@/components/ClientForm'

type Filtre = 'tous' | Statut
const FILTRES: { key: Filtre; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'actif', label: 'En cours' },
  { key: 'instance', label: 'En instance' },
  { key: 'archive', label: 'Archivés' },
]
const PAGE = 60

export type ClientRow = Client & { dossiers: Dossier[]; statut: Statut | null; haystack: string }

export default function ClientsPage() {
  const clientsQ = useClients()
  const dossiersQ = useDossiers()
  const [query, setQuery] = useState('')
  const q = useDeferredValue(query)
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [tri, setTri] = useState<'nom' | 'recent'>('nom')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const searchRef = useRef<HTMLInputElement>(null)

  // Raccourci « / » pour rechercher, Échap pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (e.key === '/' && !typing) { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'Escape') { setSelectedId(null); setCreating(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
      const haystack = norm([c.nom, c.adresse, c.telephone, c.observation, ...dossiers.map(d => `${d.id} ${d.observations ?? ''}`)].join(' '))
      return { ...c, dossiers, statut, haystack }
    })
  }, [clientsQ.data, dossiersQ.data])

  const counts = useMemo(() => {
    const c: Record<Filtre, number> = { tous: rows.length, actif: 0, instance: 0, archive: 0 }
    for (const r of rows) if (r.statut) c[r.statut]++
    return c
  }, [rows])

  const filtered = useMemo(() => {
    const terms = norm(q).split(' ').filter(Boolean)
    const list = rows.filter(r =>
      (filtre === 'tous' || r.statut === filtre) && terms.every(t => r.haystack.includes(t)))
    return tri === 'nom'
      ? list.sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' }))
      : list.sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [rows, q, filtre, tri])

  useEffect(() => setLimit(PAGE), [q, filtre, tri])

  const selected = rows.find(r => r.id === selectedId) ?? null
  const loading = clientsQ.isLoading || dossiersQ.isLoading
  const error = clientsQ.error || dossiersQ.error

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
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <Plus size={17} /> Nouveau client
          </button>
        </section>

        <div className="search">
          <Search size={19} className="search-icon" />
          <input
            ref={searchRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un nom, une adresse, un téléphone, un n° de dossier…"
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
          <select className="sort" value={tri} onChange={e => setTri(e.target.value as 'nom' | 'recent')} aria-label="Trier">
            <option value="nom">Nom A → Z</option>
            <option value="recent">Plus récents</option>
          </select>
        </div>

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
            <ul className="list">
              {filtered.slice(0, limit).map(r => (
                <li key={r.id}>
                  <button className={`row ${selectedId === r.id ? 'active' : ''}`} onClick={() => setSelectedId(r.id)}>
                    <span className="avatar">{initials(r.nom)}</span>
                    <span className="row-main">
                      <span className="row-name">{r.nom}</span>
                      <span className="row-sub">{r.adresse || 'Adresse non renseignée'}{r.telephone && <> · <span className="mono">{r.telephone}</span></>}</span>
                    </span>
                    <span className="row-meta">
                      {r.statut && <span className={`badge ${r.statut}`}>{STATUT_LABEL[r.statut]}</span>}
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
          </>
        )}
      </main>

      {selected && <ClientDetail client={selected} onClose={() => setSelectedId(null)} />}
      {creating && (
        <ClientForm
          initialName={query}
          existing={rows}
          onClose={() => setCreating(false)}
          onCreated={id => { setCreating(false); setQuery(''); setSelectedId(id) }}
          onOpenExisting={id => { setCreating(false); setSelectedId(id) }}
        />
      )}
    </div>
  )
}
