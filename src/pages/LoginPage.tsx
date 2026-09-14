import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight, KeyRound, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { status } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)
  const [sent, setSent] = useState(false)

  // Déjà connecté → retour à la page protégée
  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Identifiants incorrects. Vérifiez votre adresse email et mot de passe.')
    } else {
      navigate(from, { replace: true })
    }
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) {
      setError(`Impossible d'envoyer le lien de réinitialisation : ${error.message}`)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ animation: 'scale-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {/* Brand Header */}
        <div className="login-logo" style={{ animation: 'slide-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="login-logo-icon">
            GM
          </div>
          <div className="login-logo-text">GEOMAN PRO</div>
          <div className="login-logo-sub">SYSTÈME DE GESTION DES DOSSIERS FONCIERS</div>
        </div>

        <h2 className="login-title">
          {forgot ? 'Récupération de mot de passe' : 'Connexion à votre espace'}
        </h2>

        {forgot ? (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sent ? (
              <div style={{
                background: 'var(--green-dim)',
                border: '1px solid var(--green)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                fontSize: 13,
                color: 'var(--green)',
                lineHeight: 1.5
              }}>
                Un email contenant les instructions de réinitialisation a été envoyé à <strong>{email}</strong>.
              </div>
            ) : (
              <>
                <div className="form-field">
                  <label className="form-label">Adresse e-mail professionnelle</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 32 }}
                      type="email"
                      placeholder="contact@geometre.dz"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'var(--red-dim)',
                    border: '1px solid var(--red)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '9px 12px',
                    fontSize: 12.5,
                    color: 'var(--red)'
                  }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: 40, width: '100%', justifyContent: 'center', fontSize: 13.5, marginTop: 4 }}
                  disabled={loading}
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien de récupération'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', height: 34 }}
                  onClick={() => { setForgot(false); setError('') }}
                >
                  ← Revenir à la connexion
                </button>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-field">
              <label className="form-label">Adresse e-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 32 }}
                  type="email"
                  placeholder="admin@geoman.dz"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Mot de passe</label>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setForgot(true)}
                  style={{ padding: 0, height: 'auto', fontSize: 11.5, color: 'var(--acc)' }}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 32, paddingRight: 36 }}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-3)',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--red-dim)',
                border: '1px solid var(--red)',
                borderRadius: 'var(--radius-sm)',
                padding: '9px 12px',
                fontSize: 12.5,
                color: 'var(--red)'
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ height: 42, width: '100%', justifyContent: 'center', fontSize: 14, fontWeight: 700, marginTop: 4 }}
              disabled={loading}
            >
              <span>{loading ? 'Authentification...' : 'Ouvrir ma session'}</span>
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>
        )}

        {/* Security Badge Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          fontSize: 11,
          color: 'var(--text-3)'
        }}>
          <ShieldCheck size={14} style={{ color: 'var(--green)' }} />
          <span>Environnement sécurisé • Chiffrement RLS PostgreSQL</span>
        </div>
      </div>
    </div>
  )
}
