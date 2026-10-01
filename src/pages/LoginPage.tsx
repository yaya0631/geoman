import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { status } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)
  const [sent, setSent] = useState(false)

  if (status === 'authenticated') return <Navigate to="/" replace />
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (forgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
      error ? setError(error.message) : setSent(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      error ? setError('Email ou mot de passe incorrect.') : navigate(from, { replace: true })
    }
    setLoading(false)
  }

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2 3 7v10l9 5 9-5V7z M3 7l9 5 9-5 M12 12v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          </span>
          <span className="brand-name">Geoman</span>
        </div>
        <h1>{forgot ? 'Mot de passe oublié' : 'Bon retour'}</h1>
        <p className="muted">{forgot ? 'Recevez un lien de réinitialisation par email.' : 'Connectez-vous pour accéder à vos clients.'}</p>

        {sent ? (
          <div className="notice">Lien envoyé à <strong>{email}</strong>.</div>
        ) : (
          <>
            <label className="field"><span>Email</span>
              <input type="email" required autoFocus autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
            {!forgot && (
              <label className="field"><span>Mot de passe</span>
                <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
            )}
            {error && <div className="error">{error}</div>}
            <button className="btn-primary block" disabled={loading}>
              {loading ? 'Patientez…' : forgot ? 'Envoyer le lien' : 'Se connecter'}
            </button>
          </>
        )}
        <button type="button" className="link center" onClick={() => { setForgot(!forgot); setError(''); setSent(false) }}>
          {forgot ? '← Retour à la connexion' : 'Mot de passe oublié ?'}
        </button>
      </form>
    </div>
  )
}
