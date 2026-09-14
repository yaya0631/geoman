import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary React — empêche les crashes JS de transformer toute
 * l'application en écran noir. Intercepte les erreurs de rendu et affiche
 * un fallback dégradé avec possibilité de retry.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          background: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: 'var(--font-ui)',
          padding: 32,
          textAlign: 'center',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--red-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <AlertTriangle size={28} style={{ color: 'var(--red)' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Une erreur inattendue est survenue
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 420, margin: 0, lineHeight: 1.6 }}>
            L'application a rencontré un problème. Vous pouvez réessayer ou recharger la page.
          </p>
          {this.state.error && (
            <code style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-3)',
              background: 'var(--bg-2)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              maxWidth: 500,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {this.state.error.message}
            </code>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              className="btn btn-primary"
              onClick={this.handleRetry}
              style={{ gap: 6 }}
            >
              <RefreshCw size={14} />
              Réessayer
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => window.location.reload()}
            >
              Recharger la page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
