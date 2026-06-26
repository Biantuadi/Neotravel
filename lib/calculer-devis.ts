import type { ParamsDevis, ResultatDevis } from '@/types'

// STUB temporaire — sera remplacé par la version de Giovanni avec toutes les matrices
export function calculerDevis(params: ParamsDevis): ResultatDevis {
  const base = params.distance_km * 4.0
  const prix_ht = Math.max(base, 400)
  const tva = prix_ht * 0.10
  return {
    prix_ht: Math.round(prix_ht * 100) / 100,
    tva: Math.round(tva * 100) / 100,
    prix_ttc: Math.round((prix_ht + tva) * 100) / 100,
    lignes: [{ libelle: 'Base trajet (stub)', montant: prix_ht }],
    coefficients: { stub: 1.0 },
    devise: 'EUR',
  }
}
