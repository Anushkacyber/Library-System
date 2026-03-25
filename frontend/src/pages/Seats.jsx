import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import API from '../utils/api'
import toast from 'react-hot-toast'

const SECTIONS = ['A', 'B', 'C', 'D']
const DURATIONS = [
  { id: '2h', label: '2 Hours', price: 30 },
  { id: '4h', label: '4 Hours', price: 50 },
  { id: 'full', label: 'Full Day', price: 100 },
]

const css = `
.seat-container { max-width: 1200px; margin: 0 auto; padding: 24px; font-family: 'DM Sans', sans-serif; }
.section-tab { padding: 10px 20px; border-radius: 12px; font-weight: 700; transition: all 0.2s; cursor: pointer; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; }
.section-tab.active { background: #0d0d0d; color: #fff; border-color: #0d0d0d; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.table-group { display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 6px; padding: 8px; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1; position: relative; }
.table-label { position: absolute; top: -10px; left: 10px; background: #fff; padding: 0 6px; font-size: 9px; font-weight: 800; color: #94a3b8; border: 1px solid #e2e8f0; border-radius: 4px; }
.seat { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: 1.5px solid #e2e8f0; }
.seat-available { background: #fff; color: #0d0d0d; }
.seat-available:hover { border-color: #0d0d0d; transform: scale(1.05); }
.seat-occupied { background: #fee2e2; color: #dc2626; border-color: #fecaca; cursor: not-allowed; }
.seat-mine { background: #6366f1; color: #fff; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
.seat-checked-in { background: #10b981; color: #fff; border-color: #059669; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2); }
.seat-selected { background: #0d0d0d; color: #fff; border-color: #0d0d0d; }
.seat-maintenance { background: #ffedd5; color: #ea580c; border-color: #fed7aa; cursor: not-allowed; }
.timer-chip { background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 8px; font-family: monospace; font-weight: 700; font-size: 14px; }
.busy-meter { height: 4px; background: #e2e8f0; border-radius: 10px; overflow: hidden; margin-top: 8px; }
.busy-fill { height: 100%; transition: width 0.5s ease; }
`

function Timer({ endTime, bookingDate }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const update = () => {
      if (!endTime) return
      
      let end = new Date(endTime)
      if (isNaN(end.getTime()) && bookingDate) {
        const dateStr = new Date(bookingDate).toISOString().split('T')[0]
        end = new Date(`${dateStr}T${endTime}`)
      }
      
      const diff = end - new Date()
      if (diff <= 0) { setTimeLeft('00:00:00'); return }
      
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0')
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
      setTimeLeft(`${h}:${m}:${s}`)
    }
    const itv = setInterval(update, 1000); update()
    return () => clearInterval(itv)
  }, [endTime, bookingDate])

  return <span className="timer-chip">{timeLeft}</span>
}

export default function Seats() {
  const { socket, connected } = useSocket()
  const { user } = useAuth()
  const [seats, setSeats] = useState([])
  const [section, setSection] = useState('A')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [duration, setDuration] = useState('2h')
  const [myBooking, setMyBooking] = useState(null)

  const fetchSeats = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const res = await API.get(`/api/seats?date=${date}&section=${section}`)
      setSeats(res.data.seats || [])
      const myRes = await API.get('/api/seats/my-bookings')
      const active = (myRes.data.bookings || []).find(b => ['active', 'checked_in'].includes(b.status))
      setMyBooking(active || null)
    } catch { toast.error('Failed to load seats') }
    finally { setLoading(false) }
  }, [date, section])

  useEffect(() => { fetchSeats(true) }, [fetchSeats])

  useEffect(() => {
    if (!socket) return
    socket.emit('joinSeatMonitor', { date, section })
    socket.on('seatStatusUpdate', () => fetchSeats())
    socket.on('seatsRefresh', () => fetchSeats())
    return () => { socket.off('seatStatusUpdate'); socket.off('seatsRefresh') }
  }, [socket, date, section, fetchSeats])

  const handleBook = async () => {
    if (!selectedSeat) return
    try {
      await API.post('/api/seats/book', { 
        seat_id: selectedSeat.id, 
        section: selectedSeat.section,
        booking_date: date,
        duration_type: duration,
        start_time: new Date().toLocaleTimeString('en-GB')
      })
      toast.success('Seat reserved! Please check in within 15 mins')
      setSelectedSeat(null); fetchSeats()
    } catch (err) { toast.error(err.response?.data?.message || 'Booking failed') }
  }

  const handleAction = async (action, id) => {
    try {
      await API.post(`/api/seats/${action}/${id}`)
      toast.success(`${action} successful!`); fetchSeats()
    } catch { toast.error(`${action} failed`) }
  }

  const handleExtend = async () => {
    if (!myBooking) return
    const loader = toast.loading('Checking availability...')
    try {
      await API.post(`/api/seats/extend/${myBooking.id}`)
      toast.success('Stay extended by 2 hours!', { id: loader })
      fetchSeats()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Extension failed', { id: loader })
    }
  }

  const groupedSeats = useMemo(() => {
    const tables = []
    for (let i = 0; i < seats.length; i += 4) tables.push(seats.slice(i, i + 4))
    return tables
  }, [seats])

  const busyScore = useMemo(() => {
    if (!seats.length) return 0
    const occupied = seats.filter(s => s.status).length
    return Math.round((occupied / seats.length) * 100)
  }, [seats])

  return (
    <div className="seat-container">
      <style>{css}</style>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: '#0d0d0d' }}>Library Commons</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Real-time workspace management & booking</p>
        </div>
        {!connected && <div style={{ background: '#fffbeb', color: '#b45309', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>📡 Reconnecting...</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
        {/* Left: Map */}
        <div>
          <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f1f5f9', padding: 24 }}>
            {/* Controls */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 8, background: '#f8fafc', padding: 4, borderRadius: 14 }}>
                {SECTIONS.map(s => (
                  <button key={s} className={`section-tab ${section === s ? 'active' : ''}`} onClick={() => setSection(s)}>Section {s}</button>
                ))}
              </div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ border: '1.5px solid #f1f5f9', borderRadius: 14, padding: '0 16px', fontWeight: 700, outline: 'none' }} />
            </div>

            {/* Busy meter for C/D */}
            {['C', 'D'].includes(section) && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  <span>Busy Meter</span>
                  <span>{busyScore}% Capacity</span>
                </div>
                <div className="busy-meter">
                  <div className="busy-fill" style={{ width: `${busyScore}%`, background: busyScore > 80 ? '#ef4444' : busyScore > 50 ? '#f59e0b' : '#10b981' }} />
                </div>
              </div>
            )}

            {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#cbd5e1' }}>Loading Map...</div> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 20 }}>
                {groupedSeats.map((table, ti) => (
                  <div key={ti} className="table-group">
                    <span className="table-label">T-{table[0]?.seat_number.slice(1,3)}</span>
                    {table.map(s => {
                      const isMine = myBooking?.seat_id === s.id
                      const status = isMine ? myBooking.status : (s.is_maintenance ? 'maintenance' : s.status)
                      const isSelected = selectedSeat?.id === s.id
                      let cls = 'seat '
                      if (isMine) cls += status === 'checked_in' ? 'seat-checked-in' : 'seat-mine'
                      else if (status === 'maintenance') cls += 'seat-maintenance'
                      else if (status === 'active' || status === 'checked_in') cls += 'seat-occupied'
                      else if (isSelected) cls += 'seat-selected'
                      else cls += 'seat-available'
                      return (
                        <div key={s.id} className={cls} onClick={() => !s.is_maintenance && !s.status && setSelectedSeat(s)}>
                          {isSelected && '✓'} {!isSelected && s.seat_number}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Legend */}
            <div style={{ marginTop: 32, display: 'flex', gap: 24, fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, border: '1.5px solid #e2e8f0' }} /> Available</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#6366f1' }} /> Yours</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }} /> In Use</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#fee2e2', border: '1.5px solid #fecaca' }} /> Occupied</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 12, borderRadius: 3, background: '#ffedd5', border: '1.5px solid #fed7aa' }} /> Repairs</div>
            </div>
          </div>
        </div>

        {/* Right: Panel */}
        <div style={{ position: 'sticky', top: 24 }}>
          {myBooking ? (
            <div style={{ background: '#0d0d0d', borderRadius: 24, padding: 24, color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Active Session</p>
                  <h2 style={{ fontSize: 32, fontWeight: 900 }}>{myBooking.seat_number}</h2>
                </div>
                <div style={{ background: myBooking.status === 'checked_in' ? '#10b981' : '#6366f1', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800 }}>{myBooking.status.replace('_', ' ')}</div>
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>TIME REMAINING</p>
                <Timer endTime={myBooking.end_time} bookingDate={myBooking.booking_date} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myBooking.status === 'active' ? (
                  <button onClick={() => handleAction('checkin', myBooking.id)} style={{ padding: 14, borderRadius: 12, border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Check In Now</button>
                ) : (
                  <button onClick={() => handleAction('checkout', myBooking.id)} style={{ padding: 14, borderRadius: 12, border: 'none', background: '#fff', color: '#0d0d0d', fontWeight: 800, cursor: 'pointer' }}>Finish Session</button>
                )}
                {myBooking.status === 'checked_in' && (
                  <button onClick={handleExtend} style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700 }}>Extend Stay</button>
                )}
              </div>
            </div>
          ) : selectedSeat ? (
            <div style={{ background: '#fff', borderRadius: 24, border: '1.5px solid #f1f5f9', padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>Seat {selectedSeat.seat_number}</h2>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>Section {selectedSeat.section} · {date}</p>
              
              {['A', 'B'].includes(section) ? (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 12, textTransform: 'uppercase' }}>Select Duration</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {DURATIONS.map(d => (
                      <div key={d.id} onClick={() => setDuration(d.id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 12, border: '1.5px solid', borderColor: duration === d.id ? '#0d0d0d' : '#f1f5f9', background: duration === d.id ? '#fafafa' : '#fff' }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{d.label}</span>
                        <span style={{ fontWeight: 800, color: '#6366f1' }}>₹{d.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <p style={{ padding: 16, background: '#f8fafc', borderRadius: 12, fontSize: 13, color: '#475569', marginBottom: 24 }}>This is a free section. Reservations are not required, just check in when you arrive!</p>}

              <button onClick={handleBook} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: '#0d0d0d', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{['A', 'B'].includes(section) ? 'Proceed to Pay & Book' : 'Book Free Seat'}</button>
              <button onClick={() => setSelectedSeat(null)} style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>Cancel Selection</button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🪑</div>
              <h3 style={{ fontWeight: 800, color: '#475569' }}>Pick your spot</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Select an available seat from the map to view booking details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
