import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
.reg-page { min-height: 100vh; display: flex; font-family: 'DM Sans', sans-serif; background: #f4f6fa; }
.reg-left { width: 400px; flex-shrink: 0; background: #0d0d0d; display: flex; flex-direction: column; padding: 40px; position: relative; overflow: hidden; }
.reg-left-glow { position: absolute; top: -80px; right: -80px; width: 280px; height: 280px; background: radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
.reg-left-dots { position: absolute; inset: 0; background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 24px 24px; pointer-events: none; }
.reg-logo { display: flex; align-items: center; gap: 10px; margin-bottom: auto; position: relative; z-index: 1; }
.reg-logo-mark { width: 40px; height: 40px; border-radius: 12px; background: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 18px; color: #0d0d0d; }
.reg-logo-name { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 18px; color: #fff; }
.reg-left-content { position: relative; z-index: 1; }
.reg-left-h { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 26px; color: #fff; line-height: 1.15; margin-bottom: 8px; }
.reg-left-sub { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.65; margin-bottom: 24px; }
.reg-check { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 10px; font-size: 12px; color: rgba(255,255,255,0.5); }
.reg-check-icon { width: 16px; height: 16px; background: rgba(99,102,241,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.reg-right { flex: 1; display: flex; align-items: flex-start; justify-content: center; padding: 32px 24px; overflow-y: auto; }
.reg-form-wrap { width: 100%; max-width: 440px; }
.reg-form-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 26px; color: #0d0d0d; margin-bottom: 6px; }
.reg-form-sub { font-size: 13px; color: #94a3b8; margin-bottom: 24px; }
.reg-label { display: block; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
.reg-input { width: 100%; padding: 11px 14px; background: #fff; border: 1.5px solid #e8ecf4; border-radius: 11px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #0d0d0d; outline: none; transition: border-color 0.15s; }
.reg-input:focus { border-color: #0d0d0d; }
.reg-input::placeholder { color: #94a3b8; }
.reg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.reg-col-full { grid-column: 1 / -1; }
.reg-input-wrap { position: relative; }
.reg-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; }
.reg-submit { width: 100%; padding: 13px; background: #0d0d0d; color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; margin-top: 4px; }
.reg-submit:hover:not(:disabled) { background: #1e1e1e; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
.reg-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.reg-bottom { text-align: center; font-size: 13px; color: #94a3b8; margin-top: 18px; }
.reg-link { color: #0d0d0d; font-weight: 700; text-decoration: none; }
.reg-link:hover { text-decoration: underline; }
.reg-back { display: block; text-align: center; font-size: 12px; color: #94a3b8; text-decoration: none; margin-top: 14px; transition: color 0.15s; }
.reg-back:hover { color: #475569; }
@media (max-width: 768px) { .reg-left { display: none; } .reg-grid { grid-template-columns: 1fr; } .reg-col-full { grid-column: 1; } }
@keyframes reg-spin { to { transform: rotate(360deg); } }
`

const PERKS = [
  'Search 5,000+ books instantly',
  'Book seats with time slots',
  'Track dues & pay fines online',
  'Get email reminders',
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', student_id: '', phone: '', department: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to LibraFlow.')
      navigate('/dashboard')
    } catch (err) {
      const errors = err.response?.data?.errors
      toast.error(errors?.[0]?.msg || err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <>
      <style>{css}</style>
      <div className="reg-page">
        {/* Left */}
        <div className="reg-left">
          <div className="reg-left-glow" />
          <div className="reg-left-dots" />
          <div className="reg-logo">
            <div className="reg-logo-mark">L.</div>
            <span className="reg-logo-name">LibraFlow</span>
          </div>
          <div className="reg-left-content">
            <h2 className="reg-left-h">Join LibraFlow</h2>
            <p className="reg-left-sub">Create your student account to access books, seats, and more.</p>
            {PERKS.map(p => (
              <div key={p} className="reg-check">
                <div className="reg-check-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="3" style={{ width: 10, height: 10 }}><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="reg-right">
          <div className="reg-form-wrap">
            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 14 }}>L.</div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#0d0d0d' }}>LibraFlow</span>
            </div>

            <h1 className="reg-form-title">Create account</h1>
            <p className="reg-form-sub">Fill in your details to get started</p>

            <form onSubmit={handleSubmit}>
              <div className="reg-grid" style={{ marginBottom: 12 }}>
                <div className="reg-col-full">
                  <label className="reg-label">Full Name *</label>
                  <input className="reg-input" placeholder="Your full name" value={form.name} onChange={e => f('name', e.target.value)} required />
                </div>
                <div>
                  <label className="reg-label">Student ID *</label>
                  <input className="reg-input" placeholder="STU2024001" value={form.student_id} onChange={e => f('student_id', e.target.value)} required />
                </div>
                <div>
                  <label className="reg-label">Phone</label>
                  <input className="reg-input" placeholder="+91 00000 00000" value={form.phone} onChange={e => f('phone', e.target.value)} />
                </div>
                <div className="reg-col-full">
                  <label className="reg-label">Email *</label>
                  <input type="email" className="reg-input" placeholder="you@college.edu" value={form.email} onChange={e => f('email', e.target.value)} required />
                </div>
                <div className="reg-col-full">
                  <label className="reg-label">Department</label>
                  <input className="reg-input" placeholder="Computer Science, Electronics…" value={form.department} onChange={e => f('department', e.target.value)} />
                </div>
                <div className="reg-col-full">
                  <label className="reg-label">Password *</label>
                  <div className="reg-input-wrap">
                    <input
                      type={showPass ? 'text' : 'password'} className="reg-input" style={{ paddingRight: 40 }}
                      placeholder="Min 6 characters" value={form.password}
                      onChange={e => f('password', e.target.value)} required minLength={6}
                    />
                    <button type="button" className="reg-eye" onClick={() => setShowPass(!showPass)}>
                      {showPass
                        ? <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="reg-submit">
                {loading && <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'reg-spin 0.7s linear infinite', display: 'inline-block' }} />}
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="reg-bottom">
              Already have an account?{' '}
              <Link to="/login" className="reg-link">Sign in</Link>
            </p>
            <Link to="/" className="reg-back">← Back to homepage</Link>
          </div>
        </div>
      </div>
    </>
  )
}
