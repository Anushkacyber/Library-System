import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  {
    to: '/dashboard', label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  {
    to: '/books', label: 'Books',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      </svg>
    )
  },
  {
    to: '/seats', label: 'Seats',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    )
  },
  {
    to: '/history', label: 'History',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    )
  },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6fa', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 72,
        background: '#0d0d0d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 18, color: '#0d0d0d',
          marginBottom: 32, flexShrink: 0,
        }}>L.</div>

        {/* Nav items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', alignItems: 'center' }}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              title={label}
              style={({ isActive }) => ({
                width: 44, height: 44, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isActive ? '#0d0d0d' : 'rgba(255,255,255,0.35)',
                background: isActive ? '#ffffff' : 'transparent',
                transition: 'all 0.2s',
                textDecoration: 'none',
              })}
              onMouseEnter={e => { if (!e.currentTarget.style.background.includes('255,255,255,1')) e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
              onMouseLeave={e => { if (!e.currentTarget.style.background.includes('rgb(255, 255, 255)')) e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
            >
              {icon}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {/* Settings */}
          <button
            title="Settings"
            style={{
              width: 44, height: 44, borderRadius: 12, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.35)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" style={{width:20,height:20}}>
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              width: 44, height: 44, borderRadius: 12, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.35)', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:20,height:20}}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>

          {/* Avatar */}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 12, fontWeight: 700, marginTop: 4,
            border: '2px solid rgba(255,255,255,0.15)',
          }}>{initials}</div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
}
