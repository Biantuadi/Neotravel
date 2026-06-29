export default function DevisInvalidePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb', fontFamily: 'Inter, Arial, sans-serif', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>

        <div style={{ display: 'inline-block', background: '#fef2f2', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>Lien invalide</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.3 }}>Lien invalide ou expiré</h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 32px' }}>
          Ce lien ne fonctionne pas. Il a peut-être déjà été utilisé ou est incorrect. Contactez-nous si vous avez besoin d&apos;aide.
        </p>

        <a href="https://neotravel.fr" style={{ display: 'inline-block', background: '#1a2138', color: 'white', borderRadius: 28, padding: '12px 24px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Retour au site →
        </a>
      </div>
    </div>
  )
}
