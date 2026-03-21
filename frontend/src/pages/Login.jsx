import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
.auth-page { min-height: 100vh; display: flex; font-family: 'DM Sans', sans-serif; background: #f4f6fa; }
.auth-left { width: 460px; flex-shrink: 0; background: #0d0d0d; display: flex; flex-direction: column; padding: 40px; position: relative; overflow: hidden; }
.auth-left-glow { position: absolute; top: -100px; right: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
.auth-left-glow2 { position: absolute; bottom: -80px; left: -80px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
.auth-left-dots { position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; }
.auth-logo { display: flex; align-items: center; gap: 10px; margin-bottom: auto; position: relative; z-index: 1; }
.auth-logo-mark { width: 40px; height: 40px; border-radius: 12px; background: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 18px; color: #0d0d0d; }
.auth-logo-name { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 18px; color: #fff; }
.auth-left-content { position: relative; z-index: 1; }
.auth-left-h { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 30px; color: #fff; line-height: 1.15; letter-spacing: -0.5px; margin-bottom: 10px; }
.auth-left-sub { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.65; margin-bottom: 28px; }
.auth-left-stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.auth-stat { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 14px; }
.auth-stat-n { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 18px; color: #fff; margin-bottom: 2px; }
.auth-stat-l { font-size: 10px; color: rgba(255,255,255,0.3); }
.auth-right { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
.auth-form-wrap { width: 100%; max-width: 400px; }
.auth-form-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 26px; color: #0d0d0d; margin-bottom: 6px; }
.auth-form-sub { font-size: 13px; color: #94a3b8; margin-bottom: 24px; }
.auth-demo-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
.auth-demo-btn { padding: 9px 12px; border-radius: 10px; font-size: 11px; font-weight: 700; border: 1.5px solid; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
.auth-label { display: block; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
.auth-input { width: 100%; padding: 11px 14px; background: #fff; border: 1.5px solid #e8ecf4; border-radius: 11px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #0d0d0d; outline: none; transition: border-color 0.15s; }
.auth-input:focus { border-color: #0d0d0d; }
.auth-input::placeholder { color: #94a3b8; }
.auth-input-wrap { position: relative; }
.auth-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; }
.auth-eye:hover { color: #475569; }
.auth-submit { width: 100%; padding: 13px; background: #0d0d0d; color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; margin-top: 4px; }
.auth-submit:hover:not(:disabled) { background: #1e1e1e; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
.auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-bottom { text-align: center; font-size: 13px; color: #94a3b8; margin-top: 20px; }
.auth-link { color: #0d0d0d; font-weight: 700; text-decoration: none; }
.auth-link:hover { text-decoration: underline; }
.auth-back { display: block; text-align: center; font-size: 12px; color: #94a3b8; text-decoration: none; margin-top: 16px; transition: color 0.15s; }
.auth-back:hover { color: #475569; }
@media (max-width: 768px) { .auth-left { display: none; } }
`

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <>
      <style>{css}</style>
      <div className="auth-page">
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-left-glow" />
          <div className="auth-left-glow2" />
          <div className="auth-left-dots" />

          <div className="auth-logo">
            <div className="auth-logo-mark">L.</div>
            <span className="auth-logo-name">LibraFlow</span>
          </div>

          <div className="auth-left-content">
            <h2 className="auth-left-h">Welcome<br />back.</h2>
            <p className="auth-left-sub">Your library, smarter. Manage books, seats, and learning all in one place.</p>
            <div className="auth-left-stat-grid">
              {[['5,000+', 'Books'], ['150', 'Seats'], ['Real-Time', 'Updates'], ['7-Day', 'Policy']].map(([n, l]) => (
                <div key={l} className="auth-stat">
                  <p className="auth-stat-n">{n}</p>
                  <p className="auth-stat-l">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="auth-right">
          <div className="auth-form-wrap">
            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 14 }}>L.</div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#0d0d0d' }}>LibraFlow</span>
            </div>

            <h1 className="auth-form-title">Sign in</h1>
            <p className="auth-form-sub">Enter your credentials to continue</p>

            {/* Demo buttons */}
            <div className="auth-demo-btns">
              <button
                className="auth-demo-btn"
                style={{ borderColor: '#fde68a', background: '#fffbeb', color: '#92400e' }}
                onClick={() => setForm({ email: 'admin@library.com', password: 'admin123' })}
              >🛡️ Admin Demo</button>
              <button
                className="auth-demo-btn"
                style={{ borderColor: '#c7d2fe', background: '#eef2ff', color: '#3730a3' }}
                onClick={() => setForm({ email: 'student@library.com', password: 'student123' })}
              >🎓 Student Demo</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="auth-label">Email Address</label>
                <input
                  type="email" className="auth-input" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                />
              </div>
              <div>
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'} className="auth-input" style={{ paddingRight: 40 }}
                    placeholder="••••••••" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })} required
                  />
                  <button type="button" className="auth-eye" onClick={() => setShowPass(!showPass)}>
                    {showPass
                      ? <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="auth-submit">
                {loading && <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite', display: 'inline-block' }} />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
            <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>

            <p className="auth-bottom">
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">Create one</Link>
            </p>
            <Link to="/" className="auth-back">← Back to homepage</Link>
          </div>
        </div>
      </div>
    </>
  )
}
