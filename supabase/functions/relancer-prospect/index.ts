import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'NeoTravel <onboarding@resend.dev>'

// Délais de relance
const DELAI_RELANCE_1_JOURS = 2  // J+2 après devis_envoye
const DELAI_RELANCE_2_JOURS = 3  // J+3 après relance_1 (= J+5 total)
const DELAI_CLOTURE_JOURS   = 2  // J+2 après relance_2 (= J+7 total)

interface DemandeRow {
  id: string
  nom_prospect: string
  email: string
}

async function envoyerEmailRelance(
  to: string,
  nom: string,
  type: 'relance_1' | 'relance_2',
): Promise<void> {
  const sujet =
    type === 'relance_1'
      ? 'Votre devis NeoTravel — Avez-vous pu le consulter ?'
      : 'NeoTravel — Dernière relance avant clôture de votre dossier'

  const corps =
    type === 'relance_1'
      ? `<p>Bonjour ${nom},</p>
         <p>Nous avons envoyé votre devis NeoTravel il y a quelques jours. Avez-vous eu l'occasion de le consulter ?</p>
         <p>Notre équipe reste disponible pour répondre à vos questions ou ajuster le trajet selon vos besoins.</p>
         <p>Bien cordialement,<br />L'équipe NeoTravel</p>`
      : `<p>Bonjour ${nom},</p>
         <p>Nous revenons vers vous une dernière fois concernant votre demande de transport de groupe.</p>
         <p>Sans retour de votre part dans les prochains jours, nous serons dans l'obligation de clôturer votre dossier.</p>
         <p>Si vous souhaitez maintenir votre demande ou obtenir un nouveau devis adapté, n'hésitez pas à nous contacter.</p>
         <p>Bien cordialement,<br />L'équipe NeoTravel</p>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject: sujet, html: corps }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend: ${err}`)
  }
}

function joursEnMs(jours: number): number {
  return jours * 24 * 60 * 60 * 1000
}

Deno.serve(async (req) => {
  // Sécurité minimale — le cron Supabase passe le service role key
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const now = new Date()

  const resultats = {
    relance_1:  0,
    relance_2:  0,
    clotures:   0,
    erreurs:    [] as string[],
  }

  // ── 1. Relance 1 ─────────────────────────────────────────────────────────────
  // Demandes avec devis_envoye depuis 2+ jours et un email renseigné
  const cutoff1 = new Date(now.getTime() - joursEnMs(DELAI_RELANCE_1_JOURS)).toISOString()
  const { data: aRelancer1 } = await supabase
    .from('demandes')
    .select('id, nom_prospect, email')
    .eq('statut', 'devis_envoye')
    .lte('updated_at', cutoff1)
    .not('email', 'is', null)

  for (const d of (aRelancer1 as DemandeRow[] ?? [])) {
    try {
      await envoyerEmailRelance(d.email, d.nom_prospect, 'relance_1')
      const sentAt = new Date().toISOString()
      await Promise.all([
        supabase
          .from('demandes')
          .update({ statut: 'relance_1', updated_at: sentAt })
          .eq('id', d.id),
        supabase.from('relances').insert({
          demande_id:      d.id,
          type:            'relance_1',
          date_programmee: cutoff1,
          envoyee_le:      sentAt,
          canal:           'email',
          statut:          'envoyee',
        }),
        supabase.from('logs').insert({
          demande_id:    d.id,
          action:        'relance_1_envoyee',
          outil_utilise: 'relancer-prospect (edge function)',
        }),
      ])
      resultats.relance_1++
    } catch (e) {
      resultats.erreurs.push(`relance_1 ${d.id}: ${e}`)
    }
  }

  // ── 2. Relance 2 ─────────────────────────────────────────────────────────────
  // Demandes en relance_1 depuis 3+ jours (= J+5 total)
  const cutoff2 = new Date(now.getTime() - joursEnMs(DELAI_RELANCE_2_JOURS)).toISOString()
  const { data: aRelancer2 } = await supabase
    .from('demandes')
    .select('id, nom_prospect, email')
    .eq('statut', 'relance_1')
    .lte('updated_at', cutoff2)
    .not('email', 'is', null)

  for (const d of (aRelancer2 as DemandeRow[] ?? [])) {
    try {
      await envoyerEmailRelance(d.email, d.nom_prospect, 'relance_2')
      const sentAt = new Date().toISOString()
      await Promise.all([
        supabase
          .from('demandes')
          .update({ statut: 'relance_2', updated_at: sentAt })
          .eq('id', d.id),
        supabase.from('relances').insert({
          demande_id:      d.id,
          type:            'relance_2',
          date_programmee: cutoff2,
          envoyee_le:      sentAt,
          canal:           'email',
          statut:          'envoyee',
        }),
        supabase.from('logs').insert({
          demande_id:    d.id,
          action:        'relance_2_envoyee',
          outil_utilise: 'relancer-prospect (edge function)',
        }),
      ])
      resultats.relance_2++
    } catch (e) {
      resultats.erreurs.push(`relance_2 ${d.id}: ${e}`)
    }
  }

  // ── 3. Clôture automatique ───────────────────────────────────────────────────
  // Demandes en relance_2 depuis 2+ jours sans réponse (= J+7 total)
  const cutoff3 = new Date(now.getTime() - joursEnMs(DELAI_CLOTURE_JOURS)).toISOString()
  const { data: aCloturer } = await supabase
    .from('demandes')
    .select('id')
    .eq('statut', 'relance_2')
    .lte('updated_at', cutoff3)

  for (const d of (aCloturer ?? [])) {
    try {
      const closedAt = new Date().toISOString()
      await Promise.all([
        supabase
          .from('demandes')
          .update({ statut: 'cloture', updated_at: closedAt })
          .eq('id', d.id),
        supabase.from('logs').insert({
          demande_id:    d.id,
          action:        'dossier_cloture',
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
