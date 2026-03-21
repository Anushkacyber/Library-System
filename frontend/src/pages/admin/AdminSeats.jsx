import { useState, useEffect } from 'react'
import API from '../../utils/api'
import toast from 'react-hot-toast'

export default function AdminSeats() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const res = await API.get(`/api/admin/seat-bookings?date=${date}`)
      setBookings(res.data.bookings || [])
    } catch (err) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [date])

  const handleAction = async (id, action) => {
    try {
      const endpoint = action === 'checkout' ? `/api/seats/checkout/${id}` : action === 'checkin' ? `/api/seats/checkin/${id}` : `/api/seats/booking/${id}`
      const method = action === 'cancel' ? 'delete' : 'post'
      
      await API[method](endpoint)
      toast.success(`Action ${action} successful`)
      fetchBookings()
    } catch (err) {
      toast.error(`Failed to ${action}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Seat Monitoring</h1>
          <p className="text-slate-500 text-sm">Real-time occupancy and booking logs</p>
        </div>
        <input 
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none shadow-sm"
        />
      </div>

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
                    {b.status === 'active' && (
                      <button onClick={() => handleAction(b.id, 'checkin')} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold hover:bg-emerald-100">Check-in</button>
                    )}
                    {b.status === 'checked_in' && (
                      <button onClick={() => handleAction(b.id, 'checkout')} className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-black">Check-out</button>
                    )}
                    <button onClick={() => handleAction(b.id, 'cancel')} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && bookings.length === 0 && (
          <div className="p-20 text-center text-slate-400">
            <p className="font-bold">No bookings for this date</p>
          </div>
        )}
      </div>
    </div>
  )
}
