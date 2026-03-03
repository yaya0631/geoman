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

  // Demo mode — bypass auth for development
  const handleDemo = () => navigate('/')

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-text">GEOMAN</div>
          <div className="login-logo-sub">GESTION DES DOSSIERS FONCIERS</div>
        </div>

        <h2 className="login-title">Connexion</h2>

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
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
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

        <div style={{ margin: '16px 0', textAlign: 'center', position: 'relative' }}>
          <div style={{ height: 1, background: 'var(--border)', position: 'absolute', left: 0, right: 0, top: '50%' }} />
          <span style={{ position: 'relative', background: 'var(--surface)', padding: '0 10px', fontSize: 11, color: 'var(--text-3)' }}>ou</span>
        </div>

        <button
          className="btn"
          style={{ width: '100%', justifyContent: 'center', height: 36, border: '1px solid var(--border)' }}
          onClick={handleDemo}
        >
          Continuer en mode démo
        </button>

        <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          GeoMan v2.0 — Système de gestion foncière<br />
          République Algérienne Démocratique et Populaire
        </p>
      </div>
    </div>
  )
}
