export default async function DevisRefuserConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; token?: string }>
}) {
  const { id, token } = await searchParams

  if (!id || !token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb', fontFamily: 'Inter, Arial, sans-serif', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>
          <p style={{ color: '#dc2626', fontSize: 14 }}>Lien invalide.</p>
        </div>
      </div>
    )
  }

  const refuserUrl = `/api/devis/${id}/refuser?token=${token}`

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb', fontFamily: 'Inter, Arial, sans-serif', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 32px rgba(0,0,0,0.08)' }}>

        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fef2f2', border: '2px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <div style={{ display: 'inline-block', background: '#fef2f2', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>Confirmation requise</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 12px', lineHeight: 1.3 }}>
          Décliner ce devis ?
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: '0 0 32px' }}>
          Cette action est définitive. Votre dossier sera archivé et aucune relance ne vous sera envoyée.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a
            href={refuserUrl}
            style={{ display: 'block', background: '#dc2626', color: 'white', borderRadius: 28, padding: '13px 24px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
          >
            Oui, je décline ce devis
          </a>
          <a
            href="https://neotravel-six.vercel.app"
            style={{ display: 'block', background: '#f1f5f9', color: '#475569', borderRadius: 28, padding: '13px 24px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
          >
            Annuler — retour au site
          </a>
        </div>

      </div>
    </div>
  )
}
