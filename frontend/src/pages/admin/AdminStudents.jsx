import { useState, useEffect } from 'react'
import API from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await API.get(`/api/admin/students?search=${search}`)
      setStudents(res.data.students || [])
    } catch (err) {
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchStudents, 300)
    return () => clearTimeout(timer)
  }, [search])

  const toggleStatus = async (id) => {
    try {
      await API.put(`/api/admin/students/${id}/toggle-active`)
      toast.success('Student status updated')
      fetchStudents()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Student Directory</h1>
          <p className="text-slate-500 text-sm">Manage user accounts and membership status</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
          <input 
            type="text" 
            placeholder="Search by name, email or student ID..."
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
              <th className="px-6 py-4">Student Info</th>
              <th className="px-6 py-4">Activity</th>
              <th className="px-6 py-4">Fines</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1,2,3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="5" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-1/2"></div></td>
                </tr>
              ))
            ) : students.map(student => (
              <tr key={student.id} className="text-sm hover:bg-slate-50/50 transition-all">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs">
                      {student.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase">{student.student_id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-900 font-bold">{student.active_borrows || 0} Books</div>
                  <div className="text-[10px] text-slate-500">Currently issued</div>
                </td>
                <td className="px-6 py-4">
                  <div className={`font-bold ${parseFloat(student.fine_balance) > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    ₹{parseFloat(student.fine_balance || 0).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${student.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {student.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => toggleStatus(student.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${student.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                  >
                    {student.is_active ? 'Suspend Access' : 'Restore Access'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
