import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../utils/api'
import toast from 'react-hot-toast'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.bh-page { font-family: 'DM Sans', sans-serif; padding: 28px 24px; }
.bh-card { background: #fff; border-radius: 18px; border: 1px solid #e8ecf4; }
.bh-row { display: flex; align-items: center; gap: 14px; padding: 16px; border-bottom: 1px solid #f8faff; transition: background 0.15s; }
.bh-row:last-child { border-bottom: none; }
.bh-row:hover { background: #fafbff; }
.bh-tab { padding: 7px 16px; border-radius: 9px; font-size: 12px; font-weight: 600; border: 1.5px solid #e8ecf4; cursor: pointer; transition: all 0.15s; background: #fff; color: #94a3b8; }
.bh-tab.active { background: #0d0d0d; color: #fff; border-color: #0d0d0d; }
.bh-tab:not(.active):hover { border-color: #0d0d0d; color: #0d0d0d; }
.bh-badge { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 100px; font-size: 10px; font-weight: 700; }
.bh-skel { background: linear-gradient(90deg,#f1f5f9 25%,#e8ecf4 50%,#f1f5f9 75%); background-size: 200% 100%; border-radius: 14px; animation: bh-sh 1.4s infinite; }
@keyframes bh-sh { 0%{background-position:200% 0}100%{background-position:-200% 0} }
`

const STATUS_MAP = {
  borrowed: { label: 'Borrowed', bg: '#eff6ff', color: '#2563eb' },
  returned: { label: 'Returned', bg: '#f0fdf4', color: '#16a34a' },
  overdue: { label: 'Overdue', bg: '#fef2f2', color: '#dc2626' },
  lost: { label: 'Lost', bg: '#f1f5f9', color: '#64748b' },
}

const COVER_COLORS = [
  ['#1e293b','#334155'],['#312e81','#4338ca'],['#064e3b','#065f46'],
  ['#7c2d12','#9a3412'],['#4a044e','#6b21a8'],['#0c4a6e','#0369a1'],
]

export default function BorrowHistory() {
  const { user, updateUser } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [paying, setPaying] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try { const r = await API.get('/api/borrow/my-history'); setRecords(r.data.records || []) }
    catch { toast.error('Failed to load history') }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handlePayFine = async () => {
    const bal = parseFloat(user?.fine_balance || 0)
    if (bal <= 0) return
    setPaying(true)
    try {
      await API.post('/api/borrow/pay-fine', { amount: bal })
      toast.success(`₹${bal.toFixed(2)} paid!`)
      updateUser({ ...user, fine_balance: 0 })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Payment failed') }
    setPaying(false)
  }

  const fineBalance = parseFloat(user?.fine_balance || 0)

  const tabs = [
    { k: 'all', l: 'All', count: records.length },
    { k: 'active', l: 'Active', count: records.filter(r => r.status === 'borrowed' && !r.days_overdue).length },
    { k: 'overdue', l: 'Overdue', count: records.filter(r => r.days_overdue > 0).length },
    { k: 'returned', l: 'Returned', count: records.filter(r => r.status === 'returned').length },
  ]

  const filtered = filter === 'all' ? records
    : filter === 'active' ? records.filter(r => r.status === 'borrowed' && !r.days_overdue)
    : filter === 'overdue' ? records.filter(r => r.days_overdue > 0)
    : records.filter(r => r.status === 'returned')

  const getStatusDisplay = (r) => {
    if (r.days_overdue > 0) return { label: 'Overdue', bg: '#fef2f2', color: '#dc2626' }
    return STATUS_MAP[r.status] || { label: r.status, bg: '#f1f5f9', color: '#64748b' }
  }

  return (
    <>
      <style>{css}</style>
      <div className="bh-page">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 24, color: '#0d0d0d', letterSpacing: '-0.5px' }}>Borrow History</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>All your borrowed books and fine records</p>
          </div>
          <button onClick={fetchData} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
            background: '#fff', border: '1.5px solid #e8ecf4', borderRadius: 10,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#475569', fontFamily: 'DM Sans, sans-serif',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
        </div>

        {/* Fine banner */}
        {fineBalance > 0 && (
          <div style={{
            background: '#0d0d0d', borderRadius: 18, padding: '20px 24px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: 'rgba(239,68,68,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ width: 22, height: 22 }}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Outstanding Fine</p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 32, color: '#fff', lineHeight: 1 }}>₹{fineBalance.toFixed(2)}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>New borrowing blocked until cleared</p>
              </div>
            </div>
            <button
              onClick={handlePayFine}
              disabled={paying}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', background: '#fff', color: '#0d0d0d',
                border: 'none', borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700, fontSize: 13, cursor: paying ? 'not-allowed' : 'pointer',
                opacity: paying ? 0.6 : 1,
              }}
            >
              {paying && <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0d0d0d', borderRadius: '50%', animation: 'bh-spin 0.7s linear infinite', display: 'inline-block' }} />}
              Pay ₹{fineBalance.toFixed(2)} Now
            </button>
          </div>
        )}
        <style>{`@keyframes bh-spin { to { transform: rotate(360deg); } }`}</style>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {tabs.map(({ k, l, count }) => (
            <button key={k} className={`bh-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
              {l}
              <span style={{
                marginLeft: 6, padding: '1px 7px', borderRadius: 100, fontSize: 10,
                background: filter === k ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                color: filter === k ? '#fff' : '#94a3b8',
              }}>{count}</span>
            </button>
          ))}
        </div>

        {/* Records */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="bh-skel" style={{ height: 80 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bh-card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 4 }}>No records</p>
            <p style={{ fontSize: 12 }}>Nothing to show in this category</p>
          </div>
        ) : (
          <div className="bh-card">
            {filtered.map((r, i) => {
              const [c1, c2] = COVER_COLORS[i % COVER_COLORS.length]
              const fine = parseFloat(r.current_fine || r.fine_amount || 0)
              const status = getStatusDisplay(r)
              return (
                <div key={r.id} className="bh-row">
                  {/* Cover */}
                  <div style={{
                    width: 36, height: 48, borderRadius: 8, flexShrink: 0,
                    background: `linear-gradient(145deg, ${c1}, ${c2})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: 'rgba(255,255,255,0.6)',
                    boxShadow: '2px 2px 8px rgba(0,0,0,0.1)',
                  }}>📘</div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: '#0d0d0d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.title}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>by {r.author}</p>
                  </div>

                  {/* Dates */}
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>
                      {r.due_date ? new Date(r.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </p>
                    <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>Due date</p>
                  </div>

                  {/* Status + fine */}
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className="bh-badge" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                    {r.days_overdue > 0 && (
                      <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 600 }}>{r.days_overdue}d late</span>
                    )}
                    {fine > 0 && (
                      <span className="bh-badge" style={{ background: '#fef2f2', color: '#dc2626' }}>₹{fine.toFixed(0)}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
