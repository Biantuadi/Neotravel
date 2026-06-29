export interface InfosManquantesData {
  prenom: string
  depart: string
  destination: string
  dateDepart: string
  champsManquants: string[]
  ctaUrl?: string
}

export function emailInfosManquantes(data: InfosManquantesData): string {
  const { prenom, depart, destination, dateDepart, champsManquants, ctaUrl = 'https://neotravel.fr' } = data

  const champsHtml = champsManquants
    .map(c => `<tr><td style="padding:2px 0;font-size:12px;color:#1a2138;line-height:20px;">→ ${c}</td></tr>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Votre demande est presque prête !</title>
</head>
<body style="margin:0;padding:32px 0;background:#f4f6fb;font-family:Inter,Arial,sans-serif;">
  <table width="560" align="center" cellpadding="0" cellspacing="0" role="presentation"
    style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">

    <!-- Barre bleue top -->
    <tr>
      <td style="background:#2e57c7;height:5px;line-height:5px;font-size:0;">&nbsp;</td>
    </tr>

    <!-- Header navy -->
    <tr>
      <td style="background:#1a2138;padding:28px;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="vertical-align:middle;">
              <div style="width:22px;height:22px;border-radius:50%;background:#e5534b;display:inline-block;"></div>
            </td>
            <td style="vertical-align:middle;padding-left:12px;">
              <span style="font-size:15px;font-weight:700;color:#ffffff;">Neotravel</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Corps -->
    <tr>
      <td style="padding:28px;">

        <!-- Tag -->
        <div style="display:inline-block;background:#e5edfc;border-radius:20px;padding:6px 14px;margin-bottom:22px;">
          <span style="font-size:11px;font-weight:700;color:#2e57c7;">Infos manquantes</span>
        </div>

        <!-- Titre -->
        <p style="margin:0 0 8px;font-size:20px;font-weight:800;color:#14141a;line-height:28px;">
          Votre demande est presque prête&nbsp;!
        </p>

        <!-- Sous-titre -->
        <p style="margin:0 0 24px;font-size:12px;font-weight:400;color:#707a8c;line-height:18px;">
          Quelques informations manquantes pour générer votre devis
        </p>

        <!-- Séparateur -->
        <div style="border-top:1px solid #e5ebf0;margin-bottom:24px;"></div>

        <!-- Bonjour -->
        <p style="margin:0 0 16px;font-size:13px;font-weight:500;color:#14141a;line-height:20px;">
          Bonjour ${prenom},
        </p>

        <!-- Intro -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:400;color:#14141a;line-height:21px;">
          Nous avons bien reçu votre demande de transport pour le trajet <strong>${depart} → ${destination}</strong>, prévue le <strong>${dateDepart}</strong>.
        </p>
        <p style="margin:0 0 24px;font-size:13px;font-weight:400;color:#14141a;line-height:21px;">
          Afin de générer votre devis, il nous manque les éléments suivants&nbsp;:
        </p>

        <!-- Bloc champs manquants -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
          style="background:#e5edfc;border-radius:10px;padding:12px 16px;margin-bottom:24px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#2e57c7;">Champs manquants :</p>
              <table cellpadding="0" cellspacing="0" role="presentation">
                ${champsHtml}
              </table>
            </td>
          </tr>
        </table>

        <!-- Suite -->
        <p style="margin:0 0 12px;font-size:13px;font-weight:400;color:#14141a;line-height:21px;">
          Vous pouvez répondre directement à cet email ou compléter votre demande en ligne en moins de 2 minutes.
        </p>
        <p style="margin:0 0 32px;font-size:12px;font-weight:400;color:#707a8c;line-height:19px;">
          Notre assistant traitera votre dossier dans les minutes suivant votre réponse.
        </p>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="background:#2e57c7;border-radius:28px;">
              <a href="${ctaUrl}"
                style="display:inline-block;padding:13px 24px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;white-space:nowrap;">
                Compléter ma demande →
              </a>
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- Séparateur footer -->
    <tr>
      <td style="border-top:1px solid #e5ebf0;"></td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:14px 28px 20px;">
        <p style="margin:0 0 4px;font-size:11px;color:#707a8c;">Neotravel — Transport de groupe | neotravel.fr</p>
        <p style="margin:0;font-size:10px;color:#a6adb8;line-height:16px;">
          Vous recevez cet email suite à une demande sur neotravel.fr — Se désabonner
        </p>
      </td>
    </tr>

  </table>
</body>
</html>`
}

export interface EmailGeneriquData {
  prenom: string
  contenu: string
}

export function emailGenerique(data: EmailGeneriquData): string {
  const { prenom, contenu } = data
  const paragraphes = contenu
    .trim()
    .split('\n')
    .map(l => l.trim() ? `<p style="margin:0 0 12px;font-size:13px;color:#14141a;line-height:21px;">${l}</p>` : '<br/>')
    .join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:32px 0;background:#f4f6fb;font-family:Inter,Arial,sans-serif;">
  <table width="560" align="center" cellpadding="0" cellspacing="0" role="presentation"
    style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">

    <!-- Barre bleue top -->
    <tr>
      <td style="background:#2e57c7;height:5px;line-height:5px;font-size:0;">&nbsp;</td>
    </tr>

    <!-- Header navy -->
    <tr>
      <td style="background:#1a2138;padding:28px;">
        <table cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="vertical-align:middle;">
              <div style="width:22px;height:22px;border-radius:50%;background:#e5534b;display:inline-block;"></div>
            </td>
            <td style="vertical-align:middle;padding-left:12px;">
              <span style="font-size:15px;font-weight:700;color:#ffffff;">Neotravel</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Corps -->
    <tr>
      <td style="padding:28px;">
        <div style="border-top:1px solid #e5ebf0;margin-bottom:24px;"></div>
        <p style="margin:0 0 16px;font-size:13px;font-weight:500;color:#14141a;">Bonjour ${prenom},</p>
        ${paragraphes}
        <p style="margin:16px 0 0;font-size:12px;color:#707a8c;">— L'équipe Neotravel</p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="border-top:1px solid #e5ebf0;padding:14px 28px 20px;">
        <p style="margin:0 0 4px;font-size:11px;color:#707a8c;">Neotravel — Transport de groupe | neotravel.fr</p>
        <p style="margin:0;font-size:10px;color:#a6adb8;line-height:16px;">
          Vous recevez cet email suite à une demande sur neotravel.fr
        </p>
      </td>
    </tr>

  </table>
</body>
</html>`
}
