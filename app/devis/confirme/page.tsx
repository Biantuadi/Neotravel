export default function DevisConfirmePage({ searchParams }: { searchParams: { already?: string } }) {
  const already = searchParams?.already === '1'
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb', fontFamily: 'Inter, Arial, sans-serif', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <div style={{ display: 'inline-block', background: '#f0fdf4', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>Devis accepté</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.3 }}>
          {already ? 'Devis déjà confirmé !' : 'Votre devis est confirmé !'}
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 32px' }}>
          {already
            ? 'Vous avez déjà accepté ce devis. Notre équipe est en train de préparer votre dossier.'
            : 'Merci pour votre confirmation. Notre équipe va prendre en charge votre dossier et vous contactera prochainement pour finaliser les détails.'}
        </p>

        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px', border: '1.5px solid #f1f5f9', marginBottom: 28 }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Un conseiller vous contactera dans les <strong style={{ color: '#0f172a' }}>24 heures</strong> pour finaliser votre réservation.
          </p>
        </div>

        <a href="https://neotravel-six.vercel.app" style={{ display: 'inline-block', background: '#21a666', color: 'white', borderRadius: 28, padding: '12px 24px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Retour au site →
        </a>
      </div>
    </div>
  )
}
