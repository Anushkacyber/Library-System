import { Link } from 'react-router-dom'

const FEATURES = [
  { icon: '📚', title: 'Smart Book Management', desc: 'Search, reserve & borrow from thousands of titles with real-time availability.' },
  { icon: '🪑', title: 'Live Seat Booking', desc: 'Visual floor map with real-time availability via Socket.io. Book in seconds.' },
  { icon: '⏰', title: 'Automated Fine System', desc: '7-day policy with ₹5/day late fees, automatically calculated and tracked.' },
  { icon: '📊', title: 'Rich Analytics', desc: 'Admin dashboard with charts, student metrics, and occupancy reports.' },
  { icon: '🔔', title: 'Smart Notifications', desc: 'Due date reminders, overdue alerts, and seat status via email + in-app.' },
  { icon: '🔐', title: 'Secure & Role-Based', desc: 'JWT authentication with separate student and admin portals.' },
]

const STATS = [
  { num: '5,000+', label: 'Books' },
  { num: '150', label: 'Seats' },
  { num: '∞', label: 'Users' },
  { num: '99.9%', label: 'Uptime' },
]

const css = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
.ld-page { font-family: 'DM Sans', sans-serif; background: #f4f6fa; min-height: 100vh; color: #0d0d0d; overflow-x: hidden; }
.ld-nav { display: flex; align-items: center; justify-content: space-between; max-width: 1140px; margin: 0 auto; padding: 20px 24px; }
.ld-logo { display: flex; align-items: center; gap: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 18px; color: #0d0d0d; text-decoration: none; }
.ld-logo-mark { width: 36px; height: 36px; border-radius: 10px; background: #0d0d0d; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; }
.ld-nav-links { display: flex; align-items: center; gap: 8px; }
.ld-nav-link { font-size: 13px; font-weight: 600; color: #64748b; text-decoration: none; padding: 8px 14px; border-radius: 9px; transition: all 0.15s; }
.ld-nav-link:hover { background: #fff; color: #0d0d0d; }
.ld-nav-cta { background: #0d0d0d; color: #fff; font-size: 13px; font-weight: 700; padding: 9px 20px; border-radius: 10px; text-decoration: none; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
.ld-nav-cta:hover { background: #1e1e1e; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
.ld-hero { max-width: 1140px; margin: 0 auto; padding: 60px 24px 40px; display: flex; align-items: center; gap: 48px; }
.ld-hero-left { flex: 1; }
.ld-chip { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1.5px solid #e8ecf4; color: #475569; font-size: 11px; font-weight: 700; padding: 5px 13px; border-radius: 100px; margin-bottom: 24px; }
.ld-chip-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; animation: ld-pulse 2s infinite; }
@keyframes ld-pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
.ld-h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: clamp(36px, 5vw, 60px); line-height: 1.05; letter-spacing: -1.5px; color: #0d0d0d; margin-bottom: 20px; }
.ld-h1 em { font-style: normal; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.ld-sub { font-size: 15px; color: #64748b; line-height: 1.7; margin-bottom: 32px; max-width: 480px; }
.ld-btns { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
.ld-btn-primary { display: inline-flex; align-items: center; gap: 8px; background: #0d0d0d; color: #fff; padding: 13px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; font-family: 'Plus Jakarta Sans', sans-serif; text-decoration: none; transition: all 0.2s; }
.ld-btn-primary:hover { background: #1e1e1e; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
.ld-btn-secondary { display: inline-flex; align-items: center; gap: 8px; background: #fff; color: #475569; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; font-family: 'DM Sans', sans-serif; text-decoration: none; border: 1.5px solid #e8ecf4; transition: all 0.2s; }
.ld-btn-secondary:hover { border-color: #0d0d0d; color: #0d0d0d; }
.ld-creds { display: flex; flex-wrap: wrap; gap: 16px; font-size: 11px; color: #94a3b8; align-items: center; }
.ld-cred-code { background: #fff; border: 1px solid #e8ecf4; color: #475569; padding: 2px 8px; border-radius: 6px; font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 10px; }
.ld-hero-right { flex-shrink: 0; width: 380px; }
.ld-preview { background: #fff; border: 1.5px solid #e8ecf4; border-radius: 24px; padding: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.06); }
.ld-preview-top { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.ld-preview-logo { width: 32px; height: 32px; border-radius: 9px; background: #0d0d0d; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 900; font-family: 'Plus Jakarta Sans', sans-serif; }
.ld-preview-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 14px; color: #0d0d0d; }
.ld-preview-sub { font-size: 11px; color: #94a3b8; }
.ld-preview-card { background: #f8faff; border: 1px solid #e8ecf4; border-radius: 14px; padding: 14px; margin-bottom: 10px; display: flex; align-items: center; gap: 10; justify-content: space-between; }
.ld-preview-stat { text-align: center; }
.ld-preview-stat-n { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 22px; color: #0d0d0d; line-height: 1; }
.ld-preview-stat-l { font-size: 10px; color: #94a3b8; margin-top: 2px; }
.ld-preview-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
.ld-preview-row:last-child { border-bottom: none; }
.ld-preview-cover { width: 24px; height: 32px; border-radius: 5px; background: linear-gradient(145deg, #1e293b, #334155); flex-shrink: 0; }
.ld-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; max-width: 1140px; margin: 0 auto; padding: 0 24px 48px; }
.ld-stat-card { background: #fff; border: 1.5px solid #e8ecf4; border-radius: 18px; padding: 20px; text-align: center; }
.ld-stat-n { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 28px; color: #0d0d0d; line-height: 1; }
.ld-stat-l { font-size: 12px; color: #94a3b8; margin-top: 4px; }
.ld-features { max-width: 1140px; margin: 0 auto; padding: 0 24px 60px; }
.ld-features-header { text-align: center; margin-bottom: 32px; }
.ld-features-h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 28px; color: #0d0d0d; margin-bottom: 8px; }
.ld-features-sub { font-size: 14px; color: #94a3b8; }
.ld-feature-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.ld-feat { background: #fff; border: 1.5px solid #e8ecf4; border-radius: 18px; padding: 22px; transition: all 0.2s; }
.ld-feat:hover { border-color: #0d0d0d; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.ld-feat-icon { width: 42px; height: 42px; border-radius: 12px; background: #f8faff; border: 1px solid #e8ecf4; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 14px; }
.ld-feat-title { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 14px; color: #0d0d0d; margin-bottom: 6px; }
.ld-feat-desc { font-size: 12px; color: #94a3b8; line-height: 1.65; }
.ld-footer { border-top: 1px solid #e8ecf4; padding: 24px; }
.ld-footer-inner { max-width: 1140px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; font-size: 12px; color: #94a3b8; }
.ld-tech { display: flex; flex-wrap: wrap; gap: 6px; }
.ld-tech-tag { background: #fff; border: 1px solid #e8ecf4; padding: 3px 10px; border-radius: 100px; font-size: 11px; color: #64748b; }
@media (max-width: 768px) { .ld-hero { flex-direction: column; gap: 32px; } .ld-hero-right { width: 100%; } .ld-stats { grid-template-columns: repeat(2, 1fr); } }
`

const PreviewCover = ({ color1, color2, title, author }) => (
  <div className="ld-preview-row">
    <div style={{ width: 24, height: 32, borderRadius: 5, background: `linear-gradient(145deg, ${color1}, ${color2})`, flexShrink: 0 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: '#0d0d0d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</p>
      <p style={{ fontSize: 10, color: '#94a3b8' }}>by {author}</p>
    </div>
    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', background: '#eff6ff', color: '#2563eb', borderRadius: 100 }}>Active</span>
  </div>
)

export default function Landing() {
  return (
    <>
      <style>{css}</style>
      <div className="ld-page">
        {/* Nav */}
        <nav className="ld-nav">
          <a href="/" className="ld-logo">
            <div className="ld-logo-mark">L.</div>
            LibraFlow
          </a>
          <div className="ld-nav-links">
            <Link to="/login" className="ld-nav-link">Sign In</Link>
            <Link to="/register" className="ld-nav-cta">Get Started</Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="ld-hero">
          <div className="ld-hero-left">
            <div className="ld-chip">
              <div className="ld-chip-dot" />
              Production-Ready · MERN Stack · Real-Time
            </div>
            <h1 className="ld-h1">
              The Modern<br />
              <em>Library System</em>
            </h1>
            <p className="ld-sub">
              A full-stack library management platform with live seat booking, intelligent fine tracking, and real-time notifications — designed for modern institutions.
            </p>
            <div className="ld-btns">
              <Link to="/register" className="ld-btn-primary">
                Start Free
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="ld-hero-right">
            <div className="ld-preview">
              <div className="ld-preview-top">
                <div className="ld-preview-logo">L.</div>
                <div>
                  <p className="ld-preview-title">Hello Josh! 👋</p>
                  <p className="ld-preview-sub">Good morning, welcome back.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[{ n: '3', l: 'Books\nborrowed' }, { n: '0', l: 'Books\noverdue' }].map(({ n, l }) => (
                  <div key={l} className="ld-preview-card">
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 24, color: '#0d0d0d', lineHeight: 1 }}>{n}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, whiteSpace: 'pre-line', lineHeight: 1.3 }}>{l}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: '#f8faff', border: '1px solid #e8ecf4', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: '#0d0d0d', marginBottom: 6 }}>My Books</p>
                <PreviewCover color1="#1e293b" color2="#334155" title="Clean Code" author="Robert C. Martin" />
                <PreviewCover color1="#312e81" color2="#4338ca" title="Design Patterns" author="Gang of Four" />
                <PreviewCover color1="#064e3b" color2="#065f46" title="The Pragmatic Programmer" author="Hunt & Thomas" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="ld-stats">
            {STATS.map(({ num, label }) => (
              <div key={label} className="ld-stat-card">
                <p className="ld-stat-n">{num}</p>
                <p className="ld-stat-l">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="ld-features">
          <div className="ld-features-header">
            <h2 className="ld-features-h2">Everything you need</h2>
            <p className="ld-features-sub">Built for students and administrators</p>
          </div>
          <div className="ld-feature-grid">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="ld-feat">
                <div className="ld-feat-icon">{icon}</div>
                <h3 className="ld-feat-title">{title}</h3>
                <p className="ld-feat-desc">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="ld-footer">
          <div className="ld-footer-inner">
            <span>© 2025 LibraFlow — Production Ready MERN Stack</span>
            <div className="ld-tech">
              {['React 18', 'Node.js', 'PostgreSQL', 'Socket.io', 'Tailwind CSS'].map(t => (
                <span key={t} className="ld-tech-tag">{t}</span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
