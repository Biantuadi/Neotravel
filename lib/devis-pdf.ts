import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Devis } from '@/lib/calculer-devis'

export interface CoordonneesProspect {
  nom: string
  email?: string
  telephone?: string
  depart?: string
  destination?: string
  dateDepart?: string
}

export interface GenererDevisPdfParams {
  devis: Devis
  prospect: CoordonneesProspect
  reference?: string
  generatedAt?: Date
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 48

const money = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)

const safeText = (value: string) =>
  value
    .replaceAll('\u202f', ' ')
    .replaceAll('\u00a0', ' ')
    .replaceAll('\u20ac', 'EUR')
    .replaceAll('\u2264', '<=')
    .replaceAll('\u2013', '-')
    .replaceAll('\u2014', '-')
    .replaceAll('\u00d7', 'x')

export async function genererDevisPdf({
  devis,
  prospect,
  reference = `NEO-${Date.now()}`,
  generatedAt = new Date(),
}: GenererDevisPdfParams): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  let y = PAGE_HEIGHT - MARGIN

  const draw = (
    text: string,
    x: number,
    size = 10,
    options?: { bold?: boolean; color?: ReturnType<typeof rgb> }
  ) => {
    page.drawText(safeText(text), {
      x,
      y,
      size,
      font: options?.bold ? bold : font,
      color: options?.color ?? rgb(0.12, 0.12, 0.12),
    })
  }

  const move = (amount: number) => {
    y -= amount
  }

  draw('NEOTRAVEL', MARGIN, 22, { bold: true, color: rgb(0.02, 0.28, 0.35) })
  draw('Devis transport de groupe', MARGIN, 12)
  draw(`Reference : ${reference}`, 380, 10)
  move(18)
  draw(`Date : ${generatedAt.toLocaleDateString('fr-FR')}`, 380, 10)

  move(42)
  draw('Coordonnees prospect', MARGIN, 13, { bold: true })
  move(20)
  draw(`Nom : ${prospect.nom}`, MARGIN)
  move(16)
  if (prospect.email) {
    draw(`Email : ${prospect.email}`, MARGIN)
    move(16)
  }
  if (prospect.telephone) {
    draw(`Telephone : ${prospect.telephone}`, MARGIN)
    move(16)
  }
  if (prospect.depart || prospect.destination) {
    draw(`Trajet : ${prospect.depart ?? 'A definir'} -> ${prospect.destination ?? 'A definir'}`, MARGIN)
    move(16)
  }
  if (prospect.dateDepart) {
    draw(`Date de depart : ${prospect.dateDepart}`, MARGIN)
    move(16)
  }

  move(18)
  draw('Detail du devis', MARGIN, 13, { bold: true })
  move(22)
  devis.lignes.forEach((ligne) => {
    draw(ligne.libelle, MARGIN)
    draw(money(ligne.montant), 455, 10, { bold: true })
    move(18)
  })

  move(16)
  page.drawLine({
    start: { x: MARGIN, y: y + 8 },
    end: { x: PAGE_WIDTH - MARGIN, y: y + 8 },
    thickness: 1,
    color: rgb(0.82, 0.86, 0.88),
  })
  draw('Montant HT', 345, 11, { bold: true })
  draw(money(devis.prixHT), 455, 11, { bold: true })
  move(18)
  draw('TVA', 345, 11)
  draw(money(devis.tva), 455, 11)
  move(18)
  draw('Montant TTC', 345, 14, { bold: true, color: rgb(0.02, 0.28, 0.35) })
  draw(money(devis.prixTTC), 455, 14, { bold: true, color: rgb(0.02, 0.28, 0.35) })

  move(44)
  draw('Coefficients appliques', MARGIN, 13, { bold: true })
  move(20)
  draw(`Saisonnalite : ${devis.coefficients.saison.niveau} (${devis.coefficients.saison.valeur})`, MARGIN)
  move(16)
  draw(`Urgence : ${devis.coefficients.urgence.code} (${devis.coefficients.urgence.valeur})`, MARGIN)
  move(16)
  draw(`Capacite : ${devis.coefficients.capacite.tranche} (${devis.coefficients.capacite.valeur})`, MARGIN)

  move(42)
  draw('Document genere automatiquement par NeoTravel. Validation humaine requise pour les cas complexes.', MARGIN, 9, {
    color: rgb(0.4, 0.4, 0.4),
  })

  return pdf.save()
}
