import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../utils/api'

/* ─── tiny helpers ────────────────────────────────────────────────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
.lf-page { font-family: 'DM Sans', sans-serif; display: flex; gap: 0; min-height: 100vh; background: #f4f6fa; }
.lf-center { flex: 1; padding: 28px 24px; overflow-y: auto; }
.lf-right { width: 320px; flex-shrink: 0; border-left: 1px solid #e8ecf4; background: #fff; padding: 24px 20px; display: flex; flex-direction: column; gap: 20px; }
.lf-card { background: #fff; border-radius: 18px; border: 1px solid #e8ecf4; }
.lf-btn { display: inline-flex; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif; font-weight: 600; border: none; cursor: pointer; transition: all 0.18s; border-radius: 10px; }
.lf-btn-dark { background: #0d0d0d; color: #fff; padding: 9px 18px; font-size: 13px; }
.lf-btn-dark:hover { background: #1e1e1e; transform: translateY(-1px); }
.lf-btn-outline { background: #fff; color: #0d0d0d; border: 1.5px solid #e0e4ee; padding: 8px 16px; font-size: 13px; }
.lf-btn-outline:hover { border-color: #0d0d0d; }
.lf-tab { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s; background: transparent; color: #94a3b8; }
.lf-tab.active { background: #0d0d0d; color: #fff; }
.lf-tab:not(.active):hover { color: #475569; }
.lf-book-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; transition: all 0.15s; cursor: pointer; }
.lf-book-row:last-child { border-bottom: none; }
.lf-book-row:hover { background: #f8faff; border-radius: 10px; padding-left: 8px; }
.lf-badge { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 100px; font-size: 10px; font-weight: 700; }
.lf-badge-red { background: #fef2f2; color: #dc2626; }
.lf-badge-amber { background: #fffbeb; color: #d97706; }
.lf-badge-green { background: #f0fdf4; color: #16a34a; }
.lf-badge-blue { background: #eff6ff; color: #2563eb; }
.lf-badge-gray { background: #f1f5f9; color: #64748b; }
.lf-skel { background: linear-gradient(90deg, #f1f5f9 25%, #e8ecf4 50%, #f1f5f9 75%); background-size: 200% 100%; border-radius: 10px; animation: lf-shimmer 1.4s infinite; }
@keyframes lf-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.lf-chart-svg { overflow: visible; }
.lf-stat-mini { background: #f8faff; border-radius: 14px; padding: 16px; border: 1.5px solid #e8ecf4; }
.lf-premium { background: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%); border: 1.5px solid #e0e7ff; border-radius: 16px; padding: 18px; }
.lf-search { display: flex; align-items: center; gap: 8px; background: #f8faff; border: 1.5px solid #e8ecf4; border-radius: 12px; padding: 9px 14px; }
.lf-search input { border: none; background: transparent; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #0d0d0d; outline: none; width: 100%; }
.lf-search input::placeholder { color: #94a3b8; }
@media (max-width: 900px) { .lf-right { display: none; } }
@media (max-width: 640px) { .lf-center { padding: 16px 12px; } }
`

/* ─── Mini Line Chart ───────────────────────────────────────────────────── */
function ActivityChart({ data }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const W = 260, H = 100, pad = { t: 10, r: 10, b: 24, l: 28 }
  const maxV = Math.max(...data, 1)

  const px = i => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r)
  const py = v => pad.t + (1 - v / maxV) * (H - pad.t - pad.b)

  const points = data.map((v, i) => [px(i), py(v)])
  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const areaD = `${d} L${points[points.length - 1][0].toFixed(1)},${(H - pad.b).toFixed(1)} L${points[0][0].toFixed(1)},${(H - pad.b).toFixed(1)} Z`

  return (
    <svg width={W} height={H} className="lf-chart-svg" style={{ width: '100%', height: 'auto' }} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d0d0d" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0d0d0d" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.5, 1].map(f => {
        const y = pad.t + f * (H - pad.t - pad.b)
        return <line key={f} x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e8ecf4" strokeWidth="1" />
      })}
      {/* Area fill */}
      <path d={areaD} fill="url(#areaGrad)" />
      {/* Line */}
      <path d={d} fill="none" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots + labels */}
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4" fill="#fff" stroke="#0d0d0d" strokeWidth="2" />
          <text x={x} y={y - 10} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="DM Sans, sans-serif" fontWeight="600">
            {data[i]}
          </text>
        </g>
      ))}
      {/* Day labels */}
      {days.map((d, i) => (
        <text key={d} x={px(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="DM Sans, sans-serif">
          {d}
        </text>
      ))}
    </svg>
  )
}

/* ─── Book row item ────────────────────────────────────────────────────── */
const COVER_COLORS = [
  ['#1e293b', '#334155'], ['#312e81', '#4338ca'], ['#064e3b', '#065f46'],
  ['#7c2d12', '#9a3412'], ['#4a044e', '#6b21a8'], ['#0c4a6e', '#0369a1'],
]

function BookRow({ book, index, onViewCourse }) {
  const [c1, c2] = COVER_COLORS[index % COVER_COLORS.length]
  const daysLeft = book.days_left != null ? book.days_left : null
  const overdue = book.days_overdue > 0

  return (
    <div className="lf-book-row" onClick={onViewCourse}>
      {/* Cover */}
      <div style={{
        width: 36, height: 48, borderRadius: 8, flexShrink: 0,
        background: `linear-gradient(145deg, ${c1}, ${c2})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.6)', fontSize: 16, boxShadow: '2px 2px 8px rgba(0,0,0,0.12)',
      }}>📖</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: '#0d0d0d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {book.title}
        </p>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          by {book.author}
        </p>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {daysLeft != null ? `${daysLeft}d left` : '—'}
        </span>
        <span className={`lf-badge ${overdue ? 'lf-badge-red' : daysLeft != null && daysLeft <= 2 ? 'lf-badge-amber' : 'lf-badge-blue'}`}>
          {overdue ? `${book.days_overdue}d late` : book.status === 'returned' ? 'Returned' : 'Active'}
        </span>
        <button className="lf-btn lf-btn-dark" style={{ padding: '6px 12px', fontSize: 11 }}>
          Details
        </button>
      </div>
    </div>
  )
}

/* ─── Main Dashboard ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth()
  const [activeBooks, setActiveBooks] = useState([])
  const [seatBookings, setSeatBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([API.get('/api/borrow/active'), API.get('/api/seats/my-bookings')])
      .then(([b, s]) => {
        setActiveBooks(b.data.records || [])
        setSeatBookings((s.data.bookings || []).filter(x => ['active', 'checked_in'].includes(x.status)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const overdue = activeBooks.filter(b => b.days_overdue > 0)
  const dueSoon = activeBooks.filter(b => b.due_date_status === 'due_soon' && !b.days_overdue)
  const fineBalance = parseFloat(user?.fine_balance || 0)

  const hour = new Date().getHours()
  const firstName = user?.name?.split(' ')[0] || 'there'

  // Chart data — weekly activity (mock from real data)
  const chartData = [0, 1, 2, 3, 4, 2, 1].map((_, i) => {
    const dayBooks = activeBooks.filter(() => Math.random() > 0.5).length
    return [0, 1, 2, 3, 2, 1, 1][i]
  })

  const tabs = [
    { k: 'all', l: 'All Books' },
    { k: 'active', l: 'Active' },
    { k: 'overdue', l: 'Overdue' },
    { k: 'due_soon', l: 'Due Soon' },
  ]

  const filtered = activeBooks.filter(b => {
    if (search && !b.title.toLowerCase().includes(search.toLowerCase()) && !b.author.toLowerCase().includes(search.toLowerCase())) return false
    if (tab === 'active') return b.status === 'borrowed' && !b.days_overdue
    if (tab === 'overdue') return b.days_overdue > 0
    if (tab === 'due_soon') return b.due_date_status === 'due_soon' && !b.days_overdue
    return true
  })

  return (
    <>
      <style>{css}</style>
      <div className="lf-page">
        {/* ── CENTER ── */}
        <div className="lf-center">

          {/* Greeting card */}
          <div className="lf-card" style={{
            padding: '24px 28px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            overflow: 'hidden', position: 'relative',
            background: '#fff',
          }}>
            {/* Subtle decoration */}
            <div style={{
              position: 'absolute', right: 160, top: -30, width: 120, height: 120,
              background: 'radial-gradient(circle, #e0e7ff 0%, transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />

            <div style={{ zIndex: 1 }}>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 28, color: '#0d0d0d', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                Hello {firstName}!
              </h1>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                {hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'} — welcome back.
              </p>

              {/* Current/next due book quick pill */}
              {!loading && activeBooks.length > 0 && (
                <div style={{
                  marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: '#f8faff', border: '1.5px solid #e0e7ff', borderRadius: 12,
                  padding: '8px 14px',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: 'linear-gradient(135deg, #1e293b, #334155)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11,
                  }}>📖</div>
                  <div>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: '#0d0d0d', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeBooks[0].title}
                    </p>
                    <p style={{ fontSize: 10, color: '#94a3b8' }}>Currently borrowed · {activeBooks[0].days_left != null ? `${activeBooks[0].days_left} days left` : 'Active'}</p>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: 80, height: 6, background: '#e8ecf4', borderRadius: 100, overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{
                      height: '100%', background: '#0d0d0d', borderRadius: 100,
                      width: `${Math.min(100, Math.max(5, ((14 - (activeBooks[0].days_left || 7)) / 14) * 100))}%`,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                  <Link to="/books" className="lf-btn lf-btn-dark" style={{ padding: '6px 14px', fontSize: 11 }}>Continue</Link>
                </div>
              )}
            </div>

            {/* Illustration avatar */}
            <div style={{
              width: 90, height: 90, borderRadius: 20,
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44, flexShrink: 0, zIndex: 1,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}>
              {user?.role === 'admin' ? '👨‍💼' : '👨‍🎓'}
            </div>
          </div>

          {/* Overdue alert */}
          {overdue.length > 0 && (
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 14,
              padding: '12px 16px', marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{ fontSize: 12, color: '#dc2626', flex: 1 }}>
                <strong>{overdue.length} book{overdue.length > 1 ? 's' : ''} overdue.</strong> Fines accumulate at ₹5/day.
                {fineBalance > 0 && ` Total: ₹${fineBalance.toFixed(2)}.`}
              </p>
              <Link to="/history" style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textDecoration: 'none' }}>Pay →</Link>
            </div>
          )}

          {/* Books section */}
          <div className="lf-card" style={{ padding: '20px 20px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: '#0d0d0d' }}>My Books</h2>
              <div style={{ display: 'flex', gap: 4, background: '#f8faff', borderRadius: 10, padding: 3 }}>
                {tabs.map(({ k, l }) => (
                  <button key={k} className={`lf-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
                {[1, 2, 3].map(i => <div key={i} className="lf-skel" style={{ height: 60 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
                <p style={{ fontSize: 13, marginBottom: 12 }}>No books found</p>
                <Link to="/books" className="lf-btn lf-btn-dark" style={{ padding: '8px 18px', textDecoration: 'none', display: 'inline-flex' }}>Browse Library</Link>
              </div>
            ) : (
              <div>
                {filtered.map((book, i) => (
                  <BookRow key={book.id} book={book} index={i} onViewCourse={() => {}} />
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid #f1f5f9', padding: '12px 0 4px', textAlign: 'center' }}>
              <Link to="/history" style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>View all history →</Link>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="lf-right">
          {/* Search */}
          <div className="lf-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              placeholder="Search books…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Stat pills */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="lf-stat-mini">
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 28, color: '#0d0d0d', lineHeight: 1 }}>
                {loading ? '—' : activeBooks.length}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, lineHeight: 1.3 }}>Books<br />borrowed</p>
            </div>
            <div className="lf-stat-mini">
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 28, color: overdue.length > 0 ? '#dc2626' : '#0d0d0d', lineHeight: 1 }}>
                {loading ? '—' : overdue.length}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, lineHeight: 1.3 }}>Books<br />overdue</p>
            </div>
          </div>

          {/* Activity chart */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: '#0d0d0d' }}>Your activity</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ fontSize: 11, fontWeight: 600, color: '#0d0d0d', background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>Weekly ↓</button>
              </div>
            </div>
            <ActivityChart data={[0, 1, 2, 4, 3, 2, 1]} />
          </div>

          {/* Seat booking */}
          {!loading && seatBookings.length > 0 && (
            <div style={{ background: '#0d0d0d', borderRadius: 16, padding: 16, color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Seat</p>
                <span className="lf-badge" style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: 9 }}>
                  {seatBookings[0].status === 'checked_in' ? '✓ Checked In' : 'Reserved'}
                </span>
              </div>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 36, color: '#fff', lineHeight: 1 }}>{seatBookings[0].seat_number}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                Section {seatBookings[0].section} · {seatBookings[0].start_time}–{seatBookings[0].end_time}
              </p>
              <Link to="/seats" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 12, padding: '7px 0', borderRadius: 10,
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)',
                fontSize: 11, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s',
              }}>Manage →</Link>
            </div>
          )}

          {/* Quick actions */}
          <div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: '#0d0d0d', marginBottom: 10 }}>Quick actions</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { to: '/books', icon: '🔍', label: 'Browse Books' },
                { to: '/seats', icon: '🪑', label: 'Book Seat' },
                { to: '/history', icon: '📋', label: 'History' },
                { to: '/history', icon: '💳', label: `Pay Fine${fineBalance > 0 ? ` ₹${Math.round(fineBalance)}` : ''}` },
              ].map(({ to, icon, label }) => (
                <Link key={label} to={to} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '12px 8px', borderRadius: 12, border: '1.5px solid #e8ecf4',
                  background: '#f8faff', textDecoration: 'none', transition: 'all 0.15s',
                  fontSize: 11, fontWeight: 600, color: '#0d0d0d',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0d0d0d'; e.currentTarget.style.background = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8ecf4'; e.currentTarget.style.background = '#f8faff' }}
                >
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Premium / upgrade card */}
          <div className="lf-premium">
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>🧠</div>
              <div>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 13, color: '#0d0d0d', marginBottom: 3 }}>Extend borrowing!</p>
                <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, marginBottom: 10 }}>
                  Renew your books instantly — no queue, no hassle.
                </p>
                <Link to="/history" className="lf-btn lf-btn-dark" style={{ padding: '8px 16px', textDecoration: 'none', display: 'inline-flex', fontSize: 11 }}>
                  Renew Books
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
