import { useEffect, useRef, ReactNode } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'

interface ModalShellProps {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  icon?: ReactNode
  footer?: ReactNode
}

/**
 * Coquille de modal accessible : role="dialog", aria-modal, piège de focus clavier,
 * fermeture par Échap et clic sur le fond.
 */
export default function ModalShell({ title, onClose, children, size = 'md', icon, footer }: ModalShellProps) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <div className="modal-header">
          {icon}
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}