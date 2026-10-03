import { useMemo } from 'react'
import { Archive, Inbox } from 'lucide-react'
import type { ClientRow } from '@/pages/ClientsPage'

type Box = { boite: number | null; count: number; out: number; min: number | null; max: number | null }

// Liste compacte des numéros libres : 1602, 1615–1618, …
function gaps(nums: number[], max = 40): { label: string; total: number } {
  const set = new Set(nums)
  if (!nums.length) return { label: '', total: 0 }
  const lo = Math.min(...nums), hi = Math.max(...nums)
  const ranges: string[] = []
  let total = 0
  for (let n = lo; n <= hi; n++) {
    if (set.has(n)) continue
    let end = n
    while (end + 1 <= hi && !set.has(end + 1)) end++
    total += end - n + 1
    ranges.push(end > n ? `${n}–${end}` : `${n}`)
    n = end
  }
  return { label: ranges.slice(0, max).join(', ') + (ranges.length > max ? '…' : ''), total }
}

export default function BoxesView({ rows, onOpen }: { rows: ClientRow[]; onOpen: (boite: number | null) => void }) {
  const boxes = useMemo<Box[]>(() => {
    const map = new Map<number | null, Box>()
    for (const r of rows) {
      const k = r.boite || null
      const b = map.get(k) ?? { boite: k, count: 0, out: 0, min: null, max: null }
      b.count++
      if (!r.en_archive) b.out++
      if (r.numero != null) {
        b.min = b.min == null ? r.numero : Math.min(b.min, r.numero)
        b.max = b.max == null ? r.numero : Math.max(b.max, r.numero)
      }
      map.set(k, b)
    }
    return [...map.values()].sort((a, b) => (a.boite ?? Infinity) - (b.boite ?? Infinity))
  }, [rows])
  const free = useMemo(() => gaps(rows.flatMap(r => (r.numero != null ? [r.numero] : []))), [rows])

  return (
    <div className="boxes-wrap">
      {free.total > 0 && (
        <p className="free-numbers">
          <strong>{free.total} numéro{free.total > 1 ? 's' : ''} libre{free.total > 1 ? 's' : ''}</strong>
          <span className="mono">{free.label}</span>
        </p>
      )}
      <ul className="boxes">
        {boxes.map(b => (
          <li key={b.boite ?? 'none'}>
            <button className={`box ${b.boite == null ? 'none' : ''}`} onClick={() => onOpen(b.boite)}>
              <span className="box-head">
                {b.boite == null ? <Inbox size={16} aria-hidden /> : <Archive size={16} aria-hidden />}
                <span>{b.boite == null ? 'Non rangés' : <>Boîte <span className="mono">{b.boite}</span></>}</span>
              </span>
              <span className="box-range mono">{b.min != null ? (b.min === b.max ? b.min : `${b.min} – ${b.max}`) : '—'}</span>
              <span className="box-foot">
                <span>{b.count} dossier{b.count > 1 ? 's' : ''}</span>
                {b.out > 0 && <span className="box-out"><span className="dot instance" /> {b.out} sorti{b.out > 1 ? 's' : ''}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
