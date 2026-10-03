import { useEffect, useRef } from 'react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Fenêtre modale accessible : focus piégé à l'intérieur, Échap pour fermer,
// focus rendu au déclencheur à la fermeture, page de fond figée.
export function useDialog<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null)
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const node = ref.current
    if (node && !node.contains(document.activeElement)) {
      const auto = node.querySelector<HTMLElement>('[autofocus]') ?? node.querySelector<HTMLElement>(FOCUSABLE)
      auto?.focus()
    }
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close.current() }
      if (e.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null)
      if (!items.length) return
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      root?.removeAttribute('inert')
      document.body.style.overflow = ''
      trigger?.focus?.()
    }
  }, [])

  return ref
}
