import { useState, useEffect } from 'react'
import API from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminSeats() {
  const [seats, setSeats] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [tab, setTab] = useState('bookings') // 'bookings' or 'maintenance'

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [sRes, bRes] = await Promise.all([
        API.get(`/api/seats?date=${date}`),
        API.get(`/api/admin/seat-bookings?date=${date}`)
      ])
      setSeats(sRes.data.seats || [])
      setBookings(bRes.data.bookings || [])
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [date])

  const toggleMaintenance = async (seatId, current) => {
    try {
      await API.post(`/api/seats/maintenance/${seatId}`, { is_maintenance: !current })
      toast.success('Seat status updated')
      fetchAll()
    } catch { toast.error('Update failed') }
  }

  const handleAction = async (id, action) => {
    try {
      const endpoint = action === 'checkout' ? `/api/seats/checkout/${id}` : action === 'checkin' ? `/api/seats/checkin/${id}` : `/api/seats/booking/${id}`
      const method = action === 'cancel' ? 'delete' : 'post'
      await API[method](endpoint)
      toast.success(`Action ${action} successful`)
      fetchAll()
    } catch { toast.error(`Failed to ${action}`) }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Seat Operations</h1>
          <p className="text-slate-500 text-sm">Real-time occupancy and maintenance management</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setTab('bookings')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'bookings' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Monitor</button>
            <button onClick={() => setTab('maintenance')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'maintenance' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Maintenance</button>
          </div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none shadow-sm" />
        </div>
      </div>

      {tab === 'bookings' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Seat</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan="5" className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-1/3"></div></td></tr>)
              ) : bookings.map(b => (
                <tr key={b.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{b.seat_number}</div>
                    <div className="text-[10px] text-slate-500 uppercase">Section {b.section}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{b.student_name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{b.student_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-600 font-medium">{b.start_time.substring(0,5)} - {b.end_time.substring(0,5)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      b.status === 'checked_in' ? 'bg-emerald-50 text-emerald-600' : 
                      b.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {b.status === 'active' && <button onClick={() => handleAction(b.id, 'checkin')} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold hover:bg-emerald-100">Check-in</button>}
                      {b.status === 'checked_in' && <button onClick={() => handleAction(b.id, 'checkout')} className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-black">Check-out</button>}
                      <button onClick={() => handleAction(b.id, 'cancel')} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && bookings.length === 0 && <div className="p-20 text-center text-slate-400 font-bold">No active bookings</div>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {seats.map(s => (
            <div key={s.id} className={`p-4 rounded-2xl border transition-all ${s.is_maintenance ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-xl text-slate-900">{s.seat_number}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Section {s.section}</p>
                </div>
                <button 
                  onClick={() => toggleMaintenance(s.id, s.is_maintenance)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${s.is_maintenance ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >
                  {s.is_maintenance ? 'Repairing' : 'Functional'}
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-dashed border-slate-100">
                <div className={`w-full h-2 rounded-full ${s.is_maintenance ? 'bg-orange-200' : s.status ? 'bg-red-100' : 'bg-emerald-100'}`}></div>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">{s.is_maintenance ? 'Unavailable for booking' : s.status ? 'Currently Occupied' : 'Ready to use'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
