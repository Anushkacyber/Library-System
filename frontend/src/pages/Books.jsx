import { useState, useEffect } from 'react'
import API from '../utils/api'
import toast from 'react-hot-toast'

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
.bk-page { font-family: 'DM Sans', sans-serif; padding: 28px 24px; }
.bk-card { background: #fff; border-radius: 18px; border: 1px solid #e8ecf4; transition: all 0.2s; }
.bk-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.07); transform: translateY(-2px); }
.bk-btn { display: inline-flex; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif; font-weight: 600; border: none; cursor: pointer; transition: all 0.18s; border-radius: 10px; padding: 8px 16px; font-size: 12px; }
.bk-btn-dark { background: #0d0d0d; color: #fff; }
.bk-btn-dark:hover { background: #1e1e1e; }
.bk-btn-outline { background: #fff; color: #0d0d0d; border: 1.5px solid #e0e4ee; }
.bk-btn-outline:hover { border-color: #0d0d0d; }
.bk-tab { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s; background: transparent; color: #94a3b8; }
.bk-tab.active { background: #0d0d0d; color: #fff; }
.bk-skel { background: linear-gradient(90deg,#f1f5f9 25%,#e8ecf4 50%,#f1f5f9 75%); background-size: 200% 100%; border-radius: 14px; animation: bk-sh 1.4s infinite; }
@keyframes bk-sh { 0%{background-position:200% 0}100%{background-position:-200% 0} }
.bk-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 100px; font-size: 10px; font-weight: 700; }
.bk-badge-green { background: #f0fdf4; color: #16a34a; }
.bk-badge-red { background: #fef2f2; color: #dc2626; }
.bk-badge-gray { background: #f1f5f9; color: #64748b; }
.bk-search { display: flex; align-items: center; gap: 8px; background: #fff; border: 1.5px solid #e8ecf4; border-radius: 12px; padding: 10px 14px; }
.bk-search input { border: none; background: transparent; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #0d0d0d; outline: none; flex: 1; }
.bk-search input::placeholder { color: #94a3b8; }
.bk-search:focus-within { border-color: #0d0d0d; }
`

const COVER_COLORS = [
  ['#1e293b','#334155'],['#312e81','#4338ca'],['#064e3b','#065f46'],
  ['#7c2d12','#9a3412'],['#4a044e','#6b21a8'],['#0c4a6e','#0369a1'],
  ['#1c1917','#292524'],['#14532d','#166534'],['#1e1b4b','#312e81'],
]

export default function BooksPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [borrowing, setBorrowing] = useState(null)
  const [page, setPage] = useState(1)

  const fetchBooks = async (q = '') => {
    setLoading(true)
    try {
      const r = await API.get(`/api/books?search=${encodeURIComponent(q)}&page=${page}&limit=18`)
      setBooks(r.data.books || [])
    } catch { toast.error('Failed to load books') }
    setLoading(false)
  }

  useEffect(() => { fetchBooks(search) }, [search, page])

  const handleBorrow = async (bookId) => {
    setBorrowing(bookId)
    try {
      await API.post('/api/borrow', { book_id: bookId })
      toast.success('Book borrowed! Happy reading 📖')
      fetchBooks(search)
    } catch (err) { toast.error(err.response?.data?.message || 'Could not borrow') }
    setBorrowing(null)
  }

  const filtered = tab === 'available' ? books.filter(b => b.available_copies > 0)
    : tab === 'unavailable' ? books.filter(b => b.available_copies === 0) : books

  return (
    <>
      <style>{css}</style>
      <div className="bk-page">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 24, color: '#0d0d0d', letterSpacing: '-0.5px' }}>Library Books</h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Browse and borrow from our collection</p>
          </div>
        </div>

        {/* Search + tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="bk-search" style={{ flex: 1, minWidth: 200 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search by title, author, ISBN…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <div style={{ display: 'flex', gap: 4, background: '#f8faff', borderRadius: 10, padding: 3 }}>
            {[{ k: 'all', l: 'All' }, { k: 'available', l: 'Available' }, { k: 'unavailable', l: 'Borrowed Out' }].map(({ k, l }) => (
              <button key={k} className={`bk-tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bk-skel" style={{ height: 220 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#475569' }}>No books found</p>
            <p style={{ fontSize: 13 }}>Try a different search term</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {filtered.map((book, i) => {
              const [c1, c2] = COVER_COLORS[i % COVER_COLORS.length]
              const avail = book.available_copies > 0
              return (
                <div key={book.id} className="bk-card" style={{ overflow: 'hidden' }}>
                  {/* Cover */}
                  <div style={{
                    height: 110, background: `linear-gradient(145deg, ${c1}, ${c2})`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, position: 'relative',
                  }}>
                    📖
                    <span className={`bk-badge ${avail ? 'bk-badge-green' : 'bk-badge-red'}`}
                      style={{ position: 'absolute', top: 8, right: 8 }}>
                      {avail ? `${book.available_copies} left` : 'Out'}
                    </span>
                  </div>
                  <div style={{ padding: '12px' }}>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12,
                      color: '#0d0d0d', marginBottom: 3, lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{book.title}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>{book.author}</p>
                    {book.genre && (
                      <span className="bk-badge bk-badge-gray" style={{ marginBottom: 10, display: 'inline-flex' }}>{book.genre}</span>
                    )}
                    <button
                      className="bk-btn bk-btn-dark"
                      style={{ width: '100%', justifyContent: 'center', opacity: avail ? 1 : 0.4, cursor: avail ? 'pointer' : 'not-allowed' }}
                      disabled={!avail || borrowing === book.id}
                      onClick={() => avail && handleBorrow(book.id)}
                    >
                      {borrowing === book.id ? (
                        <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      ) : avail ? 'Borrow' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  )
}
