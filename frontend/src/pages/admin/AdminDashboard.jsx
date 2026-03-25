import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/api/admin/dashboard')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl"></div>)}
    </div>
    <div className="h-64 bg-slate-100 rounded-2xl"></div>
  </div>

  const { stats, recentActivity } = data

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, sub: `${stats.newStudentsMonth} new this month`, icon: '🎓', color: 'blue' },
    { label: 'Books Available', value: `${stats.availableCopies}/${stats.totalCopies}`, sub: `${stats.totalBooks} unique titles`, icon: '📚', color: 'indigo' },
    { label: 'Active Borrows', value: stats.activeBorrows, sub: `${stats.overdueBooks} overdue books`, icon: '📖', color: 'amber' },
    { label: 'Seat Occupancy', value: `${stats.occupiedSeats}/${stats.totalSeats}`, sub: `${Math.round((stats.occupiedSeats/stats.totalSeats)*100)}% current load`, icon: '🪑', color: 'emerald' },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(s => (
          <div key={s.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-6 border-bottom border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Recent Borrowing Activity</h3>
              <Link to="/admin/borrows" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Book</th>
                    <th className="px-6 py-3">Issue Date</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentActivity.map(a => (
                    <tr key={a.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{a.student_name}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{a.student_id}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{a.title}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(a.issue_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${a.status === 'borrowed' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Occupancy Analytics */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900">Seat Occupancy Analytics</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Peak Hours</span>
            </div>
            <div className="h-48 flex items-end gap-2 px-2">
              {[...Array(24)].map((_, i) => {
                const hourData = stats.occupancyTrends.find(t => parseInt(t.hour) === i)
                const height = hourData ? Math.min((parseInt(hourData.bookings) / 10) * 100, 100) : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full bg-slate-50 rounded-t-lg transition-all hover:bg-indigo-100 min-h-[4px]" style={{ height: `${height}%` }}>
                      {hourData && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {hourData.bookings} bookings
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] font-bold text-slate-400">{i}h</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions & Fines */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-4">Pending Fines</h3>
            <div className="text-4xl font-black mb-2">₹{stats.pendingFines.toLocaleString()}</div>
            <p className="text-slate-400 text-xs mb-6">Total outstanding balance across {stats.totalStudents} students</p>
            <Link to="/admin/fines" className="block w-full bg-white text-slate-900 text-center font-bold py-3 rounded-xl hover:bg-slate-100 transition-colors">Manage Fines</Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/books" className="p-4 rounded-xl bg-slate-50 border border-slate-100 border-dashed hover:border-slate-900 hover:bg-white transition-all text-center">
                <span className="block text-xl mb-1">➕</span>
                <span className="text-[10px] font-black uppercase text-slate-900">Add Book</span>
              </Link>
              <button 
                onClick={async () => {
                  const loader = toast.loading('Sending reminders...')
                  try {
                    const res = await API.post('/api/admin/notifications/send-reminders')
                    toast.success(res.data.message, { id: loader })
                  } catch (err) {
                    toast.error('Failed to send reminders', { id: loader })
                  }
                }}
                className="p-4 rounded-xl bg-slate-50 border border-slate-100 border-dashed hover:border-slate-900 hover:bg-white transition-all text-center"
              >
                <span className="block text-xl mb-1">🔔</span>
                <span className="text-[10px] font-black uppercase text-slate-900">Reminders</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
