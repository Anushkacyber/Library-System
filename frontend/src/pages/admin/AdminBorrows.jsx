import { useState, useEffect } from 'react'
import API from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminBorrows() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const res = await API.get(`/api/borrow/all?status=${status}&page=${page}`)
      setRecords(res.data.records || [])
    } catch (err) {
      toast.error('Failed to load borrow records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [status, page])

  const handleReturn = async (bookId, recordId) => {
    try {
      await API.post(`/api/books/${bookId}/return`, { record_id: recordId })
      toast.success('Book returned successfully')
      fetchRecords()
    } catch (err) {
      toast.error('Failed to process return')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Circulation Records</h1>
          <p className="text-slate-500 text-sm">Monitor issues, returns, and overdue status</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl self-start inline-flex">
        {['', 'borrowed', 'returned'].map(s => (
          <button 
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${status === s ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {s || 'All Records'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">Book</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Issue/Due Date</th>
              <th className="px-6 py-4">Status & Fine</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan="5" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-1/4"></div></td></tr>)
            ) : records.map(r => (
              <tr key={r.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{r.title}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{r.author}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{r.student_name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{r.student_id}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-900 font-medium">{new Date(r.issue_date).toLocaleDateString()}</div>
                  <div className={`text-[10px] ${r.status === 'borrowed' && new Date(r.due_date) < new Date() ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                    Due: {new Date(r.due_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      r.status === 'borrowed' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {r.status}
                    </span>
                    {(r.current_fine > 0 || r.fine_amount > 0) && (
                      <span className="text-red-500 font-black text-[10px]">₹{r.current_fine || r.fine_amount}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {r.status === 'borrowed' && (
                    <button 
                      onClick={() => handleReturn(r.book_id, r.id)}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-black transition-all"
                    >
                      Receive Return
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && records.length === 0 && (
          <div className="p-20 text-center text-slate-400">
            <p className="font-bold">No records found</p>
          </div>
        )}
      </div>
    </div>
  )
}
