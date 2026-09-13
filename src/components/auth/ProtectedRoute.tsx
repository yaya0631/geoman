import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingState } from '@/components/ui/States'

/**
 * Garde d'authentification stricte.
 * - Tant que la session initiale est indéterminée : écran de chargement (pas de flash).
 * - Non authentifié : redirection immédiate vers /login (avec retour après connexion).
 * - Authentifié : rend le contenu protégé.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingState label="Vérification de la session..." />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}