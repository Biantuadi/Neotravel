import { createHmac } from 'crypto'

const SECRET = process.env.DEVIS_TOKEN_SECRET ?? 'neotravel-devis-secret-change-me'

export function generateDevisToken(devisId: string): string {
  return createHmac('sha256', SECRET).update(devisId).digest('hex').slice(0, 32)
}

export function verifyDevisToken(devisId: string, token: string): boolean {
  const expected = generateDevisToken(devisId)
  // Comparaison à durée constante
  if (token.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  }
  return diff === 0
}

export function buildAcceptUrl(devisId: string, baseUrl: string): string {
  const token = generateDevisToken(devisId)
  return `${baseUrl}/api/devis/${devisId}/accepter?token=${token}`
}

export function buildRefusUrl(devisId: string, baseUrl: string): string {
  const token = generateDevisToken(devisId)
  return `${baseUrl}/devis/refuser?id=${devisId}&token=${token}`
}
