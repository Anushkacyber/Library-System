export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#f4f6fa', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: 20, color: '#fff',
        animation: 'lf-pulse 1.4s ease-in-out infinite',
      }}>L.</div>
      <style>{`@keyframes lf-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
