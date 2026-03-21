import { useState, useEffect } from 'react'
import API from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminFines() {
  const [data, setData] = useState({ debtors: [], summary: {} })
  const [loading, setLoading] = useState(true)

  const fetchFines = async () => {
    try {
      setLoading(true)
      const res = await API.get('/api/borrow/fine-report')
      setData(res.data)
    } catch (err) {
      toast.error('Failed to load fine report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFines()
  }, [])

  const clearFine = async (studentId, amount) => {
    if (!window.confirm(`Clear fine of ₹${amount} for this student?`)) return
    try {
      await API.post(`/api/borrow/pay-fine/${studentId}`, { amount })
      toast.success('Fine cleared')
      fetchFines()
    } catch (err) {
      toast.error('Failed to clear fine')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Fine Management</h1>
        <p className="text-slate-500 text-sm">Track balances and record payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
          <div className="text-3xl font-black text-red-500">₹{parseFloat(data.summary?.pending_fines || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Collected</p>
          <div className="text-3xl font-black text-emerald-500">₹{parseFloat(data.summary?.collected_fines || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Debtors</p>
          <div className="text-3xl font-black text-slate-900">{data.debtors?.length || 0} Students</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Outstanding Balances</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Overdue Books</th>
              <th className="px-6 py-4">Fine Balance</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan="4" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-1/4"></div></td></tr>)
            ) : data.debtors.map(d => (
              <tr key={d.student_id} className="text-sm hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{d.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{d.student_id}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{d.overdue_books}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-black text-red-500">₹{parseFloat(d.fine_balance).toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => clearFine(d.student_id, d.fine_balance)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Clear Balance
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data.debtors.length === 0 && (
          <div className="p-20 text-center text-slate-400">
            <p className="font-bold">No outstanding balances!</p>
          </div>
        )}
      </div>
    </div>
  )
}
