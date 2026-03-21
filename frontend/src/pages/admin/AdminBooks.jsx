import { useState, useEffect } from 'react'
import API from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminBooks() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  
  // Form State
  const [formData, setFormData] = useState({
    title: '', author: '', isbn: '', genre: '', 
    publisher: '', publish_year: '', total_copies: 1, 
    location: '', description: ''
  })

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const res = await API.get(`/api/books?search=${search}`)
      setBooks(res.data.books || [])
    } catch (err) {
      toast.error('Failed to load books')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchBooks, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const loadingToast = toast.loading(editingBook ? 'Updating book...' : 'Adding book...')
    try {
      if (editingBook) {
        await API.put(`/api/books/${editingBook.id}`, formData)
        toast.success('Book updated!', { id: loadingToast })
      } else {
        await API.post('/api/books', formData)
        toast.success('Book added successfully!', { id: loadingToast })
      }
      setShowModal(false)
      fetchBooks()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed', { id: loadingToast })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this book?')) return
    try {
      await API.delete(`/api/books/${id}`)
      toast.success('Book deactivated')
      fetchBooks()
    } catch (err) {
      toast.error('Failed to deactivate book')
    }
  }

  const openEdit = (book) => {
    setEditingBook(book)
    setFormData({
      title: book.title, author: book.author, isbn: book.isbn || '', 
      genre: book.genre || '', publisher: book.publisher || '', 
      publish_year: book.publish_year || '', total_copies: book.total_copies, 
      location: book.location || '', description: book.description || ''
    })
    setShowModal(true)
  }

  const openAdd = () => {
    setEditingBook(null)
    setFormData({
      title: '', author: '', isbn: '', genre: '', 
      publisher: '', publish_year: '', total_copies: 1, 
      location: '', description: ''
    })
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 text-sm">Manage library books and stock levels</p>
        </div>
        <button 
          onClick={openAdd}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2"
        >
          <span>➕</span> Add New Book
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
          <input 
            type="text" 
            placeholder="Search by title, author, or ISBN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:bg-white focus:border-slate-900 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">Book Details</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1,2,3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="4" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-1/2"></div></td>
                </tr>
              ))
            ) : books.map(book => (
              <tr key={book.id} className="group hover:bg-slate-50/50 transition-all">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase text-sm">{book.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{book.author} · {book.genre}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-mono">{book.isbn}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{book.available_copies}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-xs text-slate-500">{book.total_copies}</span>
                  </div>
                  <div className="w-24 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500" 
                      style={{ width: `${(book.available_copies / book.total_copies) * 100}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                  {book.location || 'Not Set'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openEdit(book)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(book.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && books.length === 0 && (
          <div className="p-20 text-center text-slate-400">
            <div className="text-4xl mb-2">🎈</div>
            <p className="font-bold">No books found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-white rounded-3xl w-full max-w-2xl relative shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Book Title</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-slate-900 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Author</label>
                  <input required value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-slate-900 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">ISBN</label>
                  <input value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-slate-900 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Genre</label>
                  <input value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-slate-900 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Publisher</label>
                  <input value={formData.publisher} onChange={e => setFormData({...formData, publisher: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-slate-900 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Copies</label>
                  <input type="number" required value={formData.total_copies} onChange={e => setFormData({...formData, total_copies: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-slate-900 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Location (Shelf)</label>
                  <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-slate-900 outline-none transition-all" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-all">
                  {editingBook ? 'Save Changes' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
