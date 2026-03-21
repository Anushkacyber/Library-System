import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ADMIN_NAV = [
  {
    to: '/admin', label: 'Overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    )
  },
  {
    to: '/admin/books', label: 'Books',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
      </svg>
    )
  },
  {
    to: '/admin/students', label: 'Students',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    )
  },
  {
    to: '/admin/borrows', label: 'Borrows',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/>
      </svg>
    )
  },
  {
    to: '/admin/seats', label: 'Seats',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
      </svg>
    )
  },
  {
    to: '/admin/fines', label: 'Fines',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    )
  },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fc', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#0d0d0d', color: '#fff',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh', zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 14, color: '#0d0d0d'
          }}>L.</div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 16 }}>Admin Portal</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ADMIN_NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                textDecoration: 'none', color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
              })}
              onMouseEnter={e => { if (!e.currentTarget.style.background.includes('0.1')) e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
              onMouseLeave={e => { if (!e.currentTarget.style.background.includes('0.1')) e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12
            }}>AD</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Super Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', padding: '8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" style={{width:16,height:16}}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: '32px 40px', overflowY: 'auto' }}>
        <header style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 24, color: '#0d0d0d' }}>System Administration</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>Monitor and manage the library resources</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <Link to="/dashboard" style={{
               padding: '8px 16px', borderRadius: 10, background: '#fff', border: '1.5px solid #e0e4ee',
               color: '#0d0d0d', fontSize: 13, fontWeight: 600, textDecoration: 'none'
             }}>Student View</Link>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}

function Link({ to, children, ...props }) {
  const navigate = useNavigate()
  return <a href={to} onClick={e => { e.preventDefault(); navigate(to) }} {...props}>{children}</a>
}
