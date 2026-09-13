import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)
  const [sent, setSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Identifiants incorrects. Vérifiez votre email et mot de passe.')
    } else {
      navigate('/')
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
      setError(`Impossible d'envoyer le lien : ${error.message}`)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-text">GEOMAN</div>
          <div className="login-logo-sub">GESTION DES DOSSIERS FONCIERS</div>
        </div>

        <h2 className="login-title">{forgot ? 'Réinitialiser le mot de passe' : 'Connexion'}</h2>

        {forgot ? (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sent ? (
              <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: 5, padding: '10px 12px', fontSize: 12.5, color: 'var(--green)', lineHeight: 1.5 }}>
                Un lien de réinitialisation vous a été envoyé. Vérifiez votre boîte de réception.
              </div>
            ) : (
              <>
                <div className="form-field">
                  <label className="form-label">Adresse e-mail</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 28 }}
                      type="email"
                      placeholder="admin@geoman.dz"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 5, padding: '8px 10px', fontSize: 12, color: 'var(--red)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ height: 38, width: '100%', justifyContent: 'center', fontSize: 13, marginTop: 4 }} disabled={loading}>
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
                <button type="button" className="btn" style={{ width: '100%', justifyContent: 'center', height: 34 }} onClick={() => { setForgot(false); setError('') }}>
                  ← Retour à la connexion
                </button>
              </>
            )}
          </form>
        ) : (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-field">
            <label className="form-label">Adresse e-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 28 }}
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
            <label className="form-label">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 28, paddingRight: 32 }}
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 5, padding: '8px 10px', fontSize: 12, color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: 38, width: '100%', justifyContent: 'center', fontSize: 13, marginTop: 4 }}
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        )}

        {!forgot && !sent && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button type="button" className="btn btn-sm" onClick={() => setForgot(true)} style={{ color: 'var(--text-3)' }}>
              Mot de passe oublié ?
            </button>
          </div>
        )}

        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          GeoMan — Système de gestion foncière<br />
          République Algérienne Démocratique et Populaire
        </p>
      </div>
    </div>
  )
}
