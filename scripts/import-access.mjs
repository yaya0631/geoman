// Import unique de l'ancienne base Access (kambathy_bd_be) vers Supabase.
//
//   node scripts/import-access.mjs kambathy_data.json            → simulation (rien n'est écrit)
//   node scripts/import-access.mjs kambathy_data.json --apply    → écrit dans la base
//
// Le JSON attendu contient les tables exportées : { "archive": [...], "instance": [...] }
// Variables lues dans .env (jamais commité) : VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Les cas douteux sont listés dans import-report.csv et ne sont pas importés.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const [file = 'kambathy_data.json'] = process.argv.slice(2).filter(a => !a.startsWith('--'))
const APPLY = process.argv.includes('--apply')
const url = process.env.VITE_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis dans .env'); process.exit(1) }
const db = createClient(url, key, { auth: { persistSession: false } })

const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
// Accepte plusieurs orthographes de colonnes selon l'export
const pick = (row, ...keys) => {
  for (const k of keys) {
    const hit = Object.keys(row).find(c => norm(c).replace(/[^a-z0-9]/g, '') === k)
    if (hit && row[hit] !== null && row[hit] !== '') return row[hit]
  }
  return null
}
const int = v => (v == null || v === '' || isNaN(Number(v)) ? null : Math.trunc(Number(v)))
const day = v => { if (!v) return null; const d = new Date(v); return isNaN(d) ? null : d.toISOString().slice(0, 10) }

const data = JSON.parse(readFileSync(file, 'utf8'))
const archives = data.archive ?? data.Archive ?? []
const instances = data.instance ?? data.Instance ?? []

const { data: clients, error } = await db.from('clients').select('id, nom, numero, boite').limit(10000)
if (error) { console.error(error.message); process.exit(1) }
const byName = new Map()
for (const c of clients) { const k = norm(c.nom); byName.set(k, [...(byName.get(k) ?? []), c]) }
const usedNumbers = new Map(clients.filter(c => c.numero != null).map(c => [c.numero, c]))

const report = [], updates = [], inserts = []
const seen = new Set()
for (const a of archives) {
  const nom = String(pick(a, 'nom', 'client', 'nomclient', 'nomprenom') ?? '').trim()
  const numero = int(pick(a, 'numeroarchive', 'narchive', 'numarchive', 'numero'))
  const boite = int(pick(a, 'numeroboite', 'boite', 'nboite')) || null
  const date = day(pick(a, 'datearchive', 'datearchivage', 'date'))
  const issue = msg => report.push([numero ?? '', nom, msg])
  if (!nom) { issue('Nom vide'); continue }
  if (numero == null) { issue('N° d\'archive manquant'); continue }
  if (seen.has(numero)) { issue('N° en double dans le fichier Access'); continue }
  seen.add(numero)
  const matches = byName.get(norm(nom)) ?? []
  if (matches.length > 1) { issue(`Nom ambigu : ${matches.length} clients portent ce nom`); continue }
  const owner = usedNumbers.get(numero)
  if (owner && owner.id !== matches[0]?.id) { issue(`N° déjà attribué à ${owner.nom}`); continue }
  const patch = { numero, boite, date_archivage: date }
  if (matches[0]) updates.push({ id: matches[0].id, nom, ...patch })
  else inserts.push({ nom, en_archive: true, ...patch })
}

// Boîtes des dossiers en instance : complètent la boîte des clients qui n'en ont pas
const boxOf = new Map()
for (const i of instances) {
  const nom = norm(pick(i, 'nom', 'client', 'nomclient'))
  const boite = int(pick(i, 'numeroboite', 'boite', 'nboite'))
  if (nom && boite) boxOf.set(nom, boite)
}
for (const u of [...updates, ...inserts]) if (!u.boite) u.boite = boxOf.get(norm(u.nom)) ?? null

const csv = r => r.map(v => { const s = String(v ?? ''); return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }).join(';')
writeFileSync('import-report.csv', '﻿' + [csv(['N°', 'Nom', 'Problème']), ...report.map(csv)].join('\r\n'))
console.log(`${archives.length} archives lues · ${updates.length} clients à mettre à jour · ${inserts.length} à créer · ${report.length} cas douteux (import-report.csv)`)

if (!APPLY) { console.log('Simulation uniquement. Relancez avec --apply pour écrire.'); process.exit(0) }
for (const { id, nom: _n, ...patch } of updates) {
  const r = await db.from('clients').update(patch).eq('id', id)
  if (r.error) console.error(`× ${_n} : ${r.error.message}`)
}
for (let i = 0; i < inserts.length; i += 200) {
  const r = await db.from('clients').insert(inserts.slice(i, i + 200))
  if (r.error) console.error(`× lot ${i / 200 + 1} : ${r.error.message}`)
}
console.log('Import terminé.')
