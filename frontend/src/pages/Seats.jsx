import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import API from '../utils/api'
import toast from 'react-hot-toast'

const SECTIONS = ['A', 'B', 'C', 'D']

const css = `
.seat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 8px; margin-top: 20px; }
.seat-item { width: 40px; height: 40px; border-radius: 8px; display: flex; alignItems: center; justifyContent: center; cursor: pointer; transition: all 0.2s; font-size: 11px; font-weight: 700; border: 1.5px solid #e0e4ee; }
.seat-available { background: #fff; color: #0d0d0d; }
.seat-available:hover { border-color: #0d0d0d; transform: translateY(-2px); }
.seat-booked { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; border-color: #f1f5f9; }
.seat-selected { background: #0d0d0d; color: #fff; border-color: #0d0d0d; }
.seat-mine { background: #6366f1; color: #fff; border-color: #6366f1; }
.seat-checked-in { background: #10b981; color: #fff; border-color: #10b981; }
`

export default function Seats() {
  const { socket, connected } = useSocket()
  const { user } = useAuth()
  const [seats, setSeats] = useState([])
  const [section, setSection] = useState('A')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [myBooking, setMyBooking] = useState(null)

  const fetchSeats = useCallback(async () => {
    try {
      setLoading(true)
      const res = await API.get(`/api/seats?date=${date}&section=${section}`)
      setSeats(res.data.seats || [])
      
      const myRes = await API.get('/api/seats/my-bookings')
      const active = (myRes.data.bookings || []).find(b => ['active', 'checked_in'].includes(b.status))
      setMyBooking(active || null)
    } catch (err) {
      toast.error('Failed to load seats')
    } finally {
      setLoading(false)
    }
  }, [date, section])

  useEffect(() => {
    fetchSeats()
  }, [fetchSeats])

  useEffect(() => {
    if (!socket) return
    socket.emit('joinSeatMonitor', { date, section })
    
    socket.on('seatStatusUpdate', (update) => {
      setSeats(prev => prev.map(s => s.id === update.seatId ? { ...s, status: update.status } : s))
      if (update.userId === user?.id) fetchSeats()
    })

    return () => {
      socket.off('seatStatusUpdate')
    }
  }, [socket, date, section, user?.id, fetchSeats])

  const handleBook = async () => {
    if (!selectedSeat) return
    try {
      await API.post('/api/seats/book', { seatId: selectedSeat.id, date })
      toast.success('Seat booked successfully!')
      setSelectedSeat(null)
      fetchSeats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed')
    }
  }

  const handleCheckIn = async () => {
    try {
      await API.post(`/api/seats/checkin/${myBooking.id}`)
      toast.success('Checked in successfully!')
      fetchSeats()
    } catch (err) {
      toast.error('Check-in failed')
    }
  }

  const handleCheckOut = async () => {
    try {
      await API.post(`/api/seats/checkout/${myBooking.id}`)
      toast.success('Checked out successfully!')
      fetchSeats()
    } catch (err) {
      toast.error('Check-out failed')
    }
  }

  const cancelBooking = async () => {
    try {
      await API.delete(`/api/seats/booking/${myBooking.id}`)
      toast.success('Booking cancelled')
      fetchSeats()
    } catch (err) {
      toast.error('Cancellation failed')
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <style>{css}</style>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-plus">Library Seats</h1>
          <p className="text-slate-500 mt-1">Real-time seat availability & booking</p>
        </div>
        {!connected && (
          <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-amber-200">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            Reconnecting to live updates...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Map & Controls */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
              <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                {SECTIONS.map(s => (
                  <button 
                    key={s}
                    onClick={() => setSection(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${section === s ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Section {s}
                  </button>
                ))}
              </div>
              <input 
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 outline-none"
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-6 gap-4 animate-pulse">
                {[...Array(24)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-lg"></div>)}
              </div>
            ) : (
              <div className="seat-grid">
                {seats.map(s => {
                  const isMine = myBooking?.seat_id === s.id
                  const status = isMine ? myBooking.status : s.status
                  const isSelected = selectedSeat?.id === s.id
                  
                  let className = 'seat-item '
                  if (isMine) className += status === 'checked_in' ? 'seat-checked-in' : 'seat-mine'
                  else if (status === 'booked' || status === 'checked_in') className += 'seat-booked'
                  else if (isSelected) className += 'seat-selected'
                  else className += 'seat-available'

                  return (
                    <div 
                      key={s.id} 
                      className={className}
                      onClick={() => (status === 'available' || isMine) && setSelectedSeat(s)}
                    >
                      {s.seat_number}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border border-slate-200"></div> Available</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-100"></div> Occupied</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> Your Booking</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Checked In</div>
            </div>
          </div>
        </div>

        {/* Right: Booking Panel */}
        <div>
          {myBooking ? (
            <div className="bg-slate-900 rounded-2xl p-6 text-white sticky top-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">Current Booking</p>
                  <h2 className="text-4xl font-black">{myBooking.seat_number}</h2>
                  <p className="text-slate-400 text-xs mt-1">Section {myBooking.section} · {date}</p>
                </div>
                <div className={`px-2 py-1 rounded text-[9px] font-black uppercase ${myBooking.status === 'checked_in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  {myBooking.status === 'checked_in' ? 'Checked In' : 'Active'}
                </div>
              </div>

              <div className="space-y-3">
                {myBooking.status === 'active' ? (
                  <>
                    <button 
                      onClick={handleCheckIn}
                      className="w-100 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all block text-center"
                    >
                      Check In Now
                    </button>
                    <button 
                      onClick={cancelBooking}
                      className="w-100 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all block text-center"
                    >
                      Cancel Booking
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleCheckOut}
                    className="w-100 bg-white text-slate-900 hover:bg-slate-100 font-bold py-3 rounded-xl transition-all block text-center"
                  >
                    Finish & Check Out
                  </button>
                )}
              </div>
              
              <p className="text-[10px] text-slate-500 mt-6 leading-relaxed italic">
                * Please check in within 30 minutes of your booking time to avoid automatic release.
              </p>
            </div>
          ) : selectedSeat ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confirm Booking</p>
              <h2 className="text-3xl font-black text-slate-900 mb-6">Seat {selectedSeat.seat_number}</h2>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Date</span>
                  <span className="font-bold">{date}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Section</span>
                  <span className="font-bold">Section {section}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Policy</span>
                  <span className="font-bold">7-Day Access</span>
                </div>
              </div>

              <button 
                onClick={handleBook}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all"
              >
                Book Now
              </button>
              <button 
                onClick={() => setSelectedSeat(null)}
                className="w-full text-slate-400 hover:text-slate-600 font-bold py-2 mt-2 text-xs"
              >
                Cancel Selection
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center sticky top-6">
              <div className="text-4xl mb-4 opacity-50">🪑</div>
              <h3 className="font-bold text-slate-900">Select a seat</h3>
              <p className="text-xs text-slate-500 mt-2">Pick an available seat from the map to view booking options.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
