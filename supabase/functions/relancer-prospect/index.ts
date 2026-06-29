import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'NeoTravel <onboarding@resend.dev>'
const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') ?? 'https://neotravel-six.vercel.app'
const PHONE = Deno.env.get('NEOTRAVEL_PHONE') ?? '01 23 45 67 89'
const DEVIS_TOKEN_SECRET = Deno.env.get('DEVIS_TOKEN_SECRET') ?? 'neotravel-devis-secret-change-me'

// DEMO_MODE=true → délais de 2 minutes au lieu de J+2/J+3/J+2
const DEMO_MODE = Deno.env.get('DEMO_MODE') === 'true'

const DELAI_RELANCE_1_MS = DEMO_MODE ? 2 * 60 * 1000          : 2 * 24 * 60 * 60 * 1000
const DELAI_RELANCE_2_MS = DEMO_MODE ? 2 * 60 * 1000          : 3 * 24 * 60 * 60 * 1000
const DELAI_CLOTURE_MS   = DEMO_MODE ? 2 * 60 * 1000          : 2 * 24 * 60 * 60 * 1000

// Token HMAC-SHA256 via WebCrypto (Deno compatible)
async function buildAcceptUrl(devisId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(DEVIS_TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(devisId))
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
  return `${SITE_URL}/api/devis/${devisId}/accepter?token=${hex}`
}

interface DemandeRow {
  id: string
  nom_prospect: string
  email: string
  depart?: string
  destination?: string
  date_depart?: string
  devis?: { id: string; prix_ttc: number; created_at: string; pdf_url?: string | null }[] | null
}

// ── Header commun ─────────────────────────────────────────
function header(accentColor: string): string {
  return `
  <table width="560" align="center" cellpadding="0" cellspacing="0" role="presentation"
    style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
    <tr><td style="background:${accentColor};height:5px;line-height:5px;font-size:0;">&nbsp;</td></tr>
    <tr>
      <td style="background:#1a2138;padding:28px;">
        <table cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td style="vertical-align:middle;"><div style="width:22px;height:22px;border-radius:50%;background:#e5534b;display:inline-block;"></div></td>
          <td style="vertical-align:middle;padding-left:12px;"><span style="font-size:15px;font-weight:700;color:#ffffff;">Neotravel</span></td>
        </tr></table>
      </td>
    </tr>`
}

function footer(footerNote: string): string {
  return `
    <tr><td style="border-top:1px solid #e5ebf0;"></td></tr>
    <tr>
      <td style="padding:14px 28px 20px;">
        <p style="margin:0 0 4px;font-size:11px;color:#707a8c;">Neotravel — Transport de groupe | https://neotravel-six.vercel.app</p>
        <p style="margin:0;font-size:10px;color:#a6adb8;line-height:16px;">${footerNote}</p>
      </td>
    </tr>
  </table>`
}

function wrap(inner: string): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:32px 0;background:#f4f6fb;font-family:Inter,Arial,sans-serif;">${inner}</body></html>`
}

function fmtDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtMoney(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

// ── Template Relance 1 ────────────────────────────────────
async function htmlRelance1(d: DemandeRow): Promise<string> {
  const prenom = d.nom_prospect.split(' ')[0]
  const depart = d.depart ?? '—'
  const destination = d.destination ?? '—'
  const devis = d.devis?.[0]
  const montant = devis ? fmtMoney(devis.prix_ttc) : '—'
  const dateEnvoi = devis ? fmtDate(devis.created_at) : '—'
  const dateDepart = fmtDate(d.date_depart)
  // CTA : PDF si dispo, sinon page d'acceptation
  const ctaUrl = devis?.pdf_url ?? (devis ? await buildAcceptUrl(devis.id) : SITE_URL)

  return wrap(`
  ${header('#ed8f1a')}
    <tr><td style="padding:28px;">
      <div style="display:inline-block;background:#fcf0de;border-radius:20px;padding:6px 14px;margin-bottom:22px;">
        <span style="font-size:11px;font-weight:700;color:#ed8f1a;">Relance 1</span>
      </div>
      <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#14141a;line-height:28px;">Avez-vous eu le temps de consulter notre devis&nbsp;?</p>
      <p style="margin:0 0 24px;font-size:12px;color:#707a8c;line-height:18px;">Votre devis est toujours valable — nous restons à votre disposition.</p>
      <div style="border-top:1px solid #e5ebf0;margin-bottom:20px;"></div>
      <p style="margin:0 0 6px;font-size:13px;color:#14141a;line-height:21px;">Bonjour ${prenom},</p>
      <p style="margin:0 0 12px;font-size:13px;color:#14141a;line-height:21px;">Nous vous avons envoyé un devis le <strong>${dateEnvoi}</strong> pour votre trajet <strong>${depart} → ${destination}</strong>.</p>
      <p style="margin:0 0 24px;font-size:13px;color:#14141a;line-height:21px;">Nous n'avons pas encore reçu votre retour et souhaitions nous assurer que tout est clair pour vous.</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fcf0de;border-radius:10px;margin-bottom:24px;">
        <tr><td style="padding:10px 16px 14px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#ed8f1a;">Rappel de votre devis</p>
          <p style="margin:0;font-size:12px;color:#8c520a;line-height:18px;">Montant TTC&nbsp;: <strong>${montant}</strong>&nbsp; | &nbsp;Trajet&nbsp;: ${depart} → ${destination}&nbsp; | &nbsp;Le ${dateDepart}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 12px;font-size:13px;color:#14141a;line-height:21px;">Si vous avez des questions ou souhaitez ajuster le nombre de passagers, les options ou les dates, n'hésitez pas à nous répondre directement à cet email.</p>
      <p style="margin:0 0 32px;font-size:12px;color:#707a8c;line-height:19px;">Nous pouvons également organiser un appel si vous le souhaitez au <strong>${PHONE}</strong>.</p>
      <table cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td style="background:#ed8f1a;border-radius:28px;">
          <a href="${ctaUrl}" style="display:inline-block;padding:13px 24px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;white-space:nowrap;">Voir mon devis →</a>
        </td>
      </tr></table>
    </td></tr>
  ${footer(`Relance automatique 1/2 — Ref. ${devis?.id ?? 'N/A'} — Répondez STOP pour ne plus recevoir de relances`)}`)
}

// ── Template Relance 2 ────────────────────────────────────
async function htmlRelance2(d: DemandeRow): Promise<string> {
  const prenom = d.nom_prospect.split(' ')[0]
  const depart = d.depart ?? '—'
  const destination = d.destination ?? '—'
  const devis = d.devis?.[0]
  const montant = devis ? fmtMoney(devis.prix_ttc) : '—'
  const acceptUrl = devis ? await buildAcceptUrl(devis.id) : SITE_URL
  const dateExpiration = devis
    ? fmtDate(new Date(new Date(devis.created_at).getTime() + 7 * 86400000).toISOString())
    : '—'

  return wrap(`
  ${header('#a06cfb')}
    <tr><td style="padding:28px;">
      <div style="display:inline-block;background:rgba(160,108,251,0.28);border-radius:20px;padding:6px 14px;margin-bottom:22px;">
        <span style="font-size:11px;font-weight:700;color:#a06cfb;">Relance 2</span>
      </div>
      <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#14141a;line-height:28px;">Relance 2 – Suivi de votre devis</p>
      <p style="margin:0 0 24px;font-size:12px;color:#707a8c;line-height:18px;">Cette relance est la dernière avant le transfert de votre dossier à notre service interne.</p>
      <div style="border-top:1px solid #e5ebf0;margin-bottom:20px;"></div>
      <p style="margin:0 0 6px;font-size:13px;color:#14141a;line-height:21px;">Bonjour ${prenom},</p>
      <p style="margin:0 0 12px;font-size:13px;color:#14141a;line-height:21px;">Ceci est notre dernière relance concernant votre devis pour le trajet <strong>${depart} → ${destination}</strong>.</p>
      <p style="margin:0 0 24px;font-size:13px;color:#14141a;line-height:21px;">Sans retour de votre part, votre dossier sera automatiquement transmis à notre équipe interne sous 48 heures.</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:rgba(160,108,251,0.18);border-radius:10px;margin-bottom:24px;">
        <tr><td style="padding:10px 16px 14px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#a06cfb;">Devis ${devis?.id ?? 'N/A'} — Expire le ${dateExpiration}</p>
          <p style="margin:0;font-size:12px;color:#391774;line-height:18px;">Montant&nbsp;: <strong>${montant}</strong>&nbsp; | &nbsp;Trajet&nbsp;: ${depart} → ${destination}</p>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:#14141a;line-height:21px;">Si vous êtes toujours intéressé(e), un simple clic suffit.</p>
      <p style="margin:0 0 24px;font-size:13px;color:#14141a;line-height:21px;">Si votre projet a changé, pas d'inquiétude&nbsp;: vous pouvez faire une nouvelle demande à tout moment sur https://neotravel-six.vercel.app.</p>
      <p style="margin:0 0 32px;font-size:12px;color:#707a8c;line-height:19px;">Pour toute question urgente, appelez-nous directement au <strong>${PHONE}</strong> — nous répondons en moins de 2 heures.</p>
      <table cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td style="background:#a06cfb;border-radius:28px;">
          <a href="${acceptUrl}" style="display:inline-block;padding:13px 24px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;white-space:nowrap;">Confirmer mon devis →</a>
        </td>
      </tr></table>
    </td></tr>
  ${footer('Relance automatique 2/2 — Dossier classé automatiquement après cette relance sans réponse')}`)
}

// ── Template Clôture ─────────────────────────────────────
function htmlCloture(d: DemandeRow): string {
  const prenom = d.nom_prospect.split(' ')[0]
  const depart = d.depart ?? '—'
  const destination = d.destination ?? '—'
  const devis = d.devis?.[0]
  const today = fmtDate(new Date().toISOString())

  return wrap(`
  ${header('#707a8c')}
    <tr><td style="padding:28px;">
      <div style="display:inline-block;background:#ebedf2;border-radius:20px;padding:6px 14px;margin-bottom:22px;">
        <span style="font-size:11px;font-weight:700;color:#596170;">Dossier clôturé</span>
      </div>
      <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#14141a;line-height:28px;">Merci pour votre intérêt pour NeoTravel</p>
      <p style="margin:0 0 24px;font-size:12px;color:#707a8c;line-height:18px;">Votre dossier a été clôturé, mais nous restons disponibles pour vos futurs projets.</p>
      <div style="border-top:1px solid #e5ebf0;margin-bottom:20px;"></div>
      <p style="margin:0 0 6px;font-size:13px;color:#14141a;line-height:21px;">Bonjour ${prenom},</p>
      <p style="margin:0 0 12px;font-size:13px;color:#14141a;line-height:21px;">Nous n'avons pas eu de retour de votre part concernant notre proposition pour le trajet <strong>${depart} → ${destination}</strong>.</p>
      <p style="margin:0 0 20px;font-size:13px;color:#14141a;line-height:21px;">Nous en prenons bonne note et clôturons votre dossier.</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#ebedf2;border-radius:10px;margin-bottom:24px;">
        <tr><td style="padding:10px 16px 14px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#707a8c;">Dossier ${devis?.id ?? 'N/A'} clôturé le ${today}</p>
          <p style="margin:0;font-size:11px;color:#707a8c;">Aucune relance supplémentaire ne vous sera envoyée.</p>
        </td></tr>
      </table>
      <p style="margin:0 0 12px;font-size:13px;color:#14141a;line-height:21px;">Si votre projet se concrétise à l'avenir ou si vous avez un nouveau besoin de transport de groupe, nous serons heureux de vous accompagner.</p>
      <p style="margin:0 0 24px;font-size:13px;color:#14141a;line-height:21px;">Merci pour votre confiance et à bientôt chez NeoTravel&nbsp;!</p>
      <div style="border-top:1px solid #e5ebf0;margin-bottom:16px;"></div>
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1a2138;">L'équipe Neotravel</p>
      <p style="margin:0 0 32px;font-size:11px;color:#707a8c;">contact@https://neotravel-six.vercel.app&nbsp; | &nbsp;https://neotravel-six.vercel.app&nbsp; | &nbsp;${PHONE}</p>
      <table cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td style="background:#1a2138;border-radius:28px;">
          <a href="${SITE_URL}" style="display:inline-block;padding:13px 24px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;white-space:nowrap;">Faire une nouvelle demande →</a>
        </td>
      </tr></table>
    </td></tr>
  ${footer('Email de courtoisie — Aucune relance supplémentaire — Dossier archivé')}`)
}

// ── Envoi via Resend ─────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend: ${err}`)
  }
}

// Gardé pour compatibilité mais on utilise les constantes directement
function _joursEnMs(jours: number): number {
  return jours * 24 * 60 * 60 * 1000
}

// ── Handler ─────────────────────────────────────────────
Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const now = new Date()

  const resultats = {
    relance_1: 0,
    relance_2: 0,
    clotures:  0,
    erreurs:   [] as string[],
  }

  // Sélection enrichie avec données devis
  const select = 'id, nom_prospect, email, depart, destination, date_depart, devis(id, prix_ttc, created_at, pdf_url)'

  // ── 1. Relance 1 ──────────────────────────────────────
  const cutoff1 = new Date(now.getTime() - DELAI_RELANCE_1_MS).toISOString()
  const { data: aRelancer1 } = await supabase
    .from('demandes')
    .select(select)
    .eq('statut', 'devis_envoye')
    .lte('updated_at', cutoff1)
    .not('email', 'is', null)

  for (const d of ((aRelancer1 as DemandeRow[]) ?? [])) {
    try {
      await sendEmail(
        d.email,
        'Votre devis NeoTravel — Avez-vous pu le consulter ?',
        await htmlRelance1(d),
      )
      const sentAt = new Date().toISOString()
      await Promise.all([
        supabase.from('demandes').update({ statut: 'relance_1', updated_at: sentAt }).eq('id', d.id),
        supabase.from('relances').insert({
          demande_id: d.id, type: 'relance_1',
          date_programmee: cutoff1, envoyee_le: sentAt,
          canal: 'email', statut: 'envoyee',
        }),
        supabase.from('logs').insert({
          demande_id: d.id, action: 'relance_1_envoyee',
          outil_utilise: 'relancer-prospect (edge function)',
        }),
      ])
      resultats.relance_1++
    } catch (e) {
      resultats.erreurs.push(`relance_1 ${d.id}: ${e}`)
    }
  }

  // ── 2. Relance 2 ──────────────────────────────────────
  const cutoff2 = new Date(now.getTime() - DELAI_RELANCE_2_MS).toISOString()
  const { data: aRelancer2 } = await supabase
    .from('demandes')
    .select(select)
    .eq('statut', 'relance_1')
    .lte('updated_at', cutoff2)
    .not('email', 'is', null)

  for (const d of ((aRelancer2 as DemandeRow[]) ?? [])) {
    try {
      await sendEmail(
        d.email,
        'NeoTravel — Dernière relance avant clôture de votre dossier',
        await htmlRelance2(d),
      )
      const sentAt = new Date().toISOString()
      await Promise.all([
        supabase.from('demandes').update({ statut: 'relance_2', updated_at: sentAt }).eq('id', d.id),
        supabase.from('relances').insert({
          demande_id: d.id, type: 'relance_2',
          date_programmee: cutoff2, envoyee_le: sentAt,
          canal: 'email', statut: 'envoyee',
        }),
        supabase.from('logs').insert({
          demande_id: d.id, action: 'relance_2_envoyee',
          outil_utilise: 'relancer-prospect (edge function)',
        }),
      ])
      resultats.relance_2++
    } catch (e) {
      resultats.erreurs.push(`relance_2 ${d.id}: ${e}`)
    }
  }

  // ── 3. Clôture automatique ────────────────────────────
  const cutoff3 = new Date(now.getTime() - DELAI_CLOTURE_MS).toISOString()
  const { data: aCloturer } = await supabase
    .from('demandes')
    .select(select)
    .eq('statut', 'relance_2')
    .lte('updated_at', cutoff3)

  for (const d of ((aCloturer as DemandeRow[]) ?? [])) {
    try {
      if (d.email) {
        await sendEmail(
          d.email,
          'NeoTravel — Votre dossier a été clôturé',
          htmlCloture(d),
        )
      }
      const closedAt = new Date().toISOString()
      await Promise.all([
        supabase.from('demandes').update({ statut: 'cloture', updated_at: closedAt }).eq('id', d.id),
        supabase.from('logs').insert({
          demande_id: d.id, action: 'dossier_cloture',
          outil_utilise: 'relancer-prospect (edge function)',
        }),
      ])
      resultats.clotures++
    } catch (e) {
      resultats.erreurs.push(`cloture ${d.id}: ${e}`)
    }
  }

  return Response.json(resultats)
})
