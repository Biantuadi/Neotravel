export default function DevisRefusePage({ searchParams }: { searchParams: { already?: string } }) {
  const already = searchParams?.already === '1'
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb', fontFamily: 'Inter, Arial, sans-serif', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f8fafc', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
            <path d="M9 14s1.5 2 3 2 3-2 3-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
        </div>

        <div style={{ display: 'inline-block', background: '#f1f5f9', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Dossier clôturé</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.3 }}>
          {already ? 'Refus déjà enregistré' : 'Nous prenons note de votre décision'}
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 28px' }}>
          {already
            ? 'Vous avez déjà décliné ce devis. Votre dossier a été archivé.'
            : 'Merci pour votre retour. Vous recevrez un email de confirmation sous peu. Votre dossier a été archivé — aucune relance ne vous sera envoyée.'}
        </p>

        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px', border: '1.5px solid #f1f5f9', marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Si votre situation évolue, n&apos;hésitez pas à nous soumettre une nouvelle demande.
          </p>
        </div>

        <a href="https://neotravel-six.vercel.app" style={{ display: 'inline-block', background: '#1a2138', color: 'white', borderRadius: 28, padding: '12px 24px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Faire une nouvelle demande →
        </a>
      </div>
    </div>
  )
}
