export default function DevisExpirePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb', fontFamily: 'Inter, Arial, sans-serif', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff7ed', border: '2px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <div style={{ display: 'inline-block', background: '#fff7ed', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ea580c' }}>Devis expiré</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.3 }}>Ce devis a expiré</h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 32px' }}>
          Votre devis n&apos;est plus valable. Pas d&apos;inquiétude, vous pouvez faire une nouvelle demande et nous générerons un nouveau devis actualisé.
        </p>

        <a href="https://neotravel.fr" style={{ display: 'inline-block', background: '#1a2138', color: 'white', borderRadius: 28, padding: '12px 24px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Faire une nouvelle demande →
        </a>
      </div>
    </div>
  )
}
