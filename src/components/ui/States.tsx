import { ReactNode } from 'react'
import { Inbox, AlertTriangle, Loader2 } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({
  title = 'Aucune donnée',
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className="state-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '48px 24px',
        color: 'var(--text-3)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 30, lineHeight: 1, marginBottom: 4 }}>
        {icon ?? <Inbox size={30} strokeWidth={1.5} />}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{title}</div>
      {description && (
        <div style={{ fontSize: 12, maxWidth: 340, lineHeight: 1.5 }}>{description}</div>
      )}
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  )
}

export function ErrorState({
  message = 'Une erreur est survenue',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="state-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '40px 24px',
        color: 'var(--text-3)',
        textAlign: 'center',
      }}
    >
      <AlertTriangle size={26} strokeWidth={1.6} style={{ color: 'var(--orange)' }} />
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-2)' }}>{message}</div>
      {onRetry && (
        <button className="btn btn-sm" onClick={onRetry} style={{ marginTop: 6 }}>
          Réessayer
        </button>
      )}
    </div>
  )
}

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div
      role="status"
      className="state-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '48px 24px',
        color: 'var(--text-3)',
      }}
    >
      <Loader2 size={22} className="spinner" style={{ width: 22, height: 22 }} />
      <div style={{ fontSize: 12.5 }}>{label}</div>
    </div>
  )
}