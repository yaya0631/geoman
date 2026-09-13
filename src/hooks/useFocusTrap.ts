import { useEffect } from 'react'

/**
 * Piège le focus clavier dans le conteneur référencé (modal, dialogue).
 * Restaure le focus sur l'élément actif précédent à la fermeture.
 * Améliore l'accessibilité clavier (WCAG 2.0 — 2.1.2 No Keyboard Trap, inverse).
 */
export function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (!active || !ref.current) return

    const container = ref.current
    const previous = document.activeElement as HTMLElement | null

    // Focus initial sur le premier élément focusable
    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )

    requestAnimationFrame(() => {
      const els = focusables()
      if (els.length > 0) els[0].focus()
    })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const els = focusables()
      if (els.length === 0) return
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey && (active === first || active === container || !container.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !container.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus?.()
    }
  }, [ref, active])
}