import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { ClientRow } from '@/pages/ClientsPage'

// Étiquettes de dos de dossier : n° de classement, boîte, nom et code.
// Rendues hors de l'application et visibles uniquement à l'impression.
export default function PrintLabels({ clients, onDone }: { clients: ClientRow[]; onDone: () => void }) {
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    document.body.classList.add('printing')
    const after = () => done.current()
    window.addEventListener('afterprint', after)
    const t = setTimeout(() => window.print(), 50)
    return () => {
      clearTimeout(t)
      window.removeEventListener('afterprint', after)
      document.body.classList.remove('printing')
    }
  }, [])

  const sorted = [...clients].sort((a, b) => (a.numero ?? Infinity) - (b.numero ?? Infinity))
  return createPortal(
    <div className="labels" aria-hidden>
      {sorted.map(c => (
        <div key={c.id} className="label">
          <div className="label-top">
            <span className="label-no">{c.numero ?? '—'}</span>
            <span className="label-box">{c.boite ? `Boîte ${c.boite}` : 'Non rangé'}</span>
          </div>
          <div className="label-name">{c.nom}</div>
          {c.code && <div className="label-code">{c.code}</div>}
        </div>
      ))}
    </div>,
    document.body,
  )
}
