import BookingPage from './pages/BookingPage'
export default function App() {
  const slug = window.location.pathname.replace(/^\//, '').split('/')[0]
  if (!slug) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans, sans-serif' }}>
        <p style={{ color:'#7070A0', fontSize:16 }}>Negocio no encontrado. Visita <a href="https://agendamx.net" style={{ color:'#FF5C3A' }}>agendamx.net</a></p>
      </div>
    )
  }
  return <BookingPage slug={slug} />
}
