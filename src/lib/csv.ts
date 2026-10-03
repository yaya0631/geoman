import { supabase, CLIENT_COLS, type Client, type Dossier, type Mouvement } from '@/lib/supabase'
import { norm } from '@/lib/search'

// Séparateur « ; » + BOM UTF-8 : Excel en français ouvre le fichier directement avec les accents
const SEP = ';'

function cell(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'boolean' ? (v ? 'oui' : 'non') : String(v)
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return '﻿' + [headers, ...rows].map(r => r.map(cell).join(SEP)).join('\r\n')
}

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function all<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(cols).range(from, from + 999)
    if (error) throw error
    const page = (data ?? []) as unknown as T[]
    out.push(...page)
    if (page.length < 1000) return out
  }
}

// Exporte toute la base (indépendamment des filtres affichés) en 3 fichiers CSV
export async function exportDatabase() {
  const [clients, dossiers, mouvements] = await Promise.all([
    all<Client>('clients', CLIENT_COLS),
    all<Dossier & { in_trash?: boolean }>('dossiers', 'id, nom, endroit, etat, observations, archived, created_at'),
    all<Mouvement>('client_mouvements', 'id, client_id, type, motif, par, created_at'),
  ])
  const day = new Date().toISOString().slice(0, 10)
  const nameOf = new Map(clients.map(c => [c.id, c.nom]))
  const dossierCount = new Map<string, number>()
  for (const d of dossiers) dossierCount.set(norm(d.nom), (dossierCount.get(norm(d.nom)) ?? 0) + 1)
  const last = new Map<string, Mouvement>()
  for (const m of mouvements) {
    const prev = last.get(m.client_id)
    if (!prev || m.created_at > prev.created_at) last.set(m.client_id, m)
  }

  const sorted = [...clients].sort((a, b) => (a.numero ?? Infinity) - (b.numero ?? Infinity) || a.nom.localeCompare(b.nom, 'fr'))
  download(`geoman-clients-${day}.csv`, toCsv(
    ['N° classement', 'Boîte', 'Code', 'Nom', 'Téléphone', 'Adresse', 'Note', 'Emplacement', 'Dernier mouvement', 'Motif', 'Date archivage', 'Nb dossiers', 'Créé le'],
    sorted.map(c => {
      const m = last.get(c.id)
      return [c.numero, c.boite, c.code, c.nom, c.telephone, c.adresse, c.observation,
        c.en_archive ? 'Dans l\'archive' : 'Sorti', m?.created_at.slice(0, 16).replace('T', ' '), m?.motif,
        c.date_archivage, dossierCount.get(norm(c.nom)) ?? 0, c.created_at.slice(0, 10)]
    }),
  ))
  download(`geoman-dossiers-${day}.csv`, toCsv(
    ['N° dossier', 'Client', 'Lieu', 'État', 'Archivé', 'Observations', 'Créé le'],
    dossiers.map(d => [d.id, d.nom, d.endroit, d.etat, d.archived, d.observations, d.created_at.slice(0, 10)]),
  ))
  download(`geoman-historique-${day}.csv`, toCsv(
    ['Date', 'Client', 'Mouvement', 'Motif', 'Par'],
    mouvements.sort((a, b) => a.created_at.localeCompare(b.created_at)).map(m =>
      [m.created_at.slice(0, 16).replace('T', ' '), nameOf.get(m.client_id) ?? m.client_id,
        m.type === 'sortie' ? 'Sortie' : 'Retour', m.motif, m.par]),
  ))
  return { clients: clients.length, dossiers: dossiers.length, mouvements: mouvements.length }
}
