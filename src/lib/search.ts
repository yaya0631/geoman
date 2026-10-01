// Normalise un texte pour la recherche : minuscules, sans accents, espaces simplifiés
export function norm(s: string | null | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function initials(nom: string): string {
  const words = nom.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean)
  const skip = new Set(['heritiers', 'herit', 'hérit', 'héritiers', 'mr', 'mme', 'et', 'de', 'ben'])
  const useful = words.filter(w => !skip.has(w.toLowerCase()))
  const list = useful.length ? useful : words
  return ((list[0]?.[0] ?? '?') + (list[1]?.[0] ?? '')).toUpperCase()
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
