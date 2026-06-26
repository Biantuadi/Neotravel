

// a définir les prix (prix/km, prix mini, limite de zone non fournis)
const PRIX_PAR_KM = 2.5;        // € par km          (hypothèse)
const PRIX_MINIMUM = 350;       // € plancher / trajet (hypothèse)
const DISTANCE_MAX_KM = 1500;   // au-delà = hors zone (hypothèse)

const TVA = 0.10;
const MARGE = 0.15;
const PRIX_GUIDE_JOUR = 80;
const PRIX_NUIT_CHAUFFEUR = 120;
const CAPACITE_MAX = 85;

export interface ParamsDevis {
  nbPassagers: number;
  distanceKm: number;
  dateDemande: string;   
  dateDepart: string;    
  typeVehicule?: string;
  options?: { guideJours?: number; nuitsChauffeur?: number; peages?: number };
}
export interface LigneDevis { libelle: string; montant: number; }
export interface Devis {
  prixHT: number; tva: number; prixTTC: number; devise: "EUR";
  lignes: LigneDevis[];
  coefficients: {
    saison: { niveau: string; valeur: number };
    urgence: { code: string; valeur: number };
    capacite: { tranche: string; valeur: number };
  };
}

function arrondi(n: number): number { return Math.round(n * 100) / 100; }
function joursEntre(debut: Date, fin: Date): number {
  return Math.floor((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24));
}

export function coefSaison(mois: number): { niveau: string; valeur: number } {
  if ([11, 1, 2, 8].includes(mois)) return { niveau: "Basse", valeur: -0.07 };
  if ([12, 10, 9].includes(mois)) return { niveau: "Moyenne", valeur: 0 };
  if ([3, 4, 7].includes(mois)) return { niveau: "Haute", valeur: 0.10 };
  return { niveau: "Très haute", valeur: 0.15 };
}
export function coefUrgence(jours: number): { code: string; valeur: number } {
  if (jours < 7) return { code: "DD_PRIORITAIRE", valeur: 0.10 };
  if (jours < 30) return { code: "DD_URGENT", valeur: 0.05 };
  if (jours < 90) return { code: "DD_NORMAL", valeur: -0.05 };
  return { code: "DD_3MOISETPLUS", valeur: -0.10 };
}
export function coefCapacite(nb: number): { tranche: string; valeur: number } {
  if (nb <= 19) return { tranche: "≤ 19", valeur: -0.05 };
  if (nb <= 53) return { tranche: "20–53", valeur: 0 };
  if (nb <= 63) return { tranche: "54–63", valeur: 0.15 };
  if (nb <= 67) return { tranche: "64–67", valeur: 0.20 };
  return { tranche: "68–85", valeur: 0.40 };
}

export function calculerDevis(p: ParamsDevis): Devis {
  if (!Number.isFinite(p.nbPassagers) || p.nbPassagers <= 0)
    throw new Error("Nombre de passagers invalide (doit être ≥ 1).");
  if (p.nbPassagers > CAPACITE_MAX)
    throw new Error(`Capacité hors barème (max ${CAPACITE_MAX} passagers) — à transmettre à un commercial.`);
  if (!Number.isFinite(p.distanceKm) || p.distanceKm <= 0)
    throw new Error("Distance invalide (doit être > 0).");
  if (p.distanceKm > DISTANCE_MAX_KM)
    throw new Error("Trajet hors zone desservie — à transmettre à un commercial.");

  const dDemande = new Date(p.dateDemande);
  const dDepart = new Date(p.dateDepart);
  if (isNaN(dDemande.getTime()) || isNaN(dDepart.getTime()))
    throw new Error("Date invalide (format attendu : AAAA-MM-JJ).");
  if (dDepart < dDemande)
    throw new Error("Dates incohérentes : le départ précède la demande.");

  const base = Math.max(p.distanceKm * PRIX_PAR_KM, PRIX_MINIMUM);
  const saison = coefSaison(dDepart.getMonth() + 1);
  const urgence = coefUrgence(joursEntre(dDemande, dDepart));
  const capacite = coefCapacite(p.nbPassagers);
  const transport = base * (1 + saison.valeur) * (1 + urgence.valeur) * (1 + capacite.valeur);

  const o = p.options ?? {};
  const coutGuide = (o.guideJours ?? 0) * PRIX_GUIDE_JOUR;
  const coutNuits = (o.nuitsChauffeur ?? 0) * PRIX_NUIT_CHAUFFEUR;
  const peages = o.peages ?? 0;

  const transportR = arrondi(transport);
  const coutGuideR = arrondi(coutGuide);
  const coutNuitsR = arrondi(coutNuits);
  const peagesR = arrondi(peages);
  const sousTotal = arrondi(transportR + coutGuideR + coutNuitsR + peagesR);
  const marge = arrondi(sousTotal * MARGE);
  const prixHT = arrondi(sousTotal + marge);
  const prixTTC = arrondi(prixHT * (1 + TVA));
  const tva = arrondi(prixTTC - prixHT);

  const lignes: LigneDevis[] = [
    { libelle: `Transport ${p.distanceKm} km (base ${arrondi(base)} €)`, montant: transportR },
  ];
  if (coutGuideR) lignes.push({ libelle: `Guide / accompagnateur (${o.guideJours} j × ${PRIX_GUIDE_JOUR} €)`, montant: coutGuideR });
  if (coutNuitsR) lignes.push({ libelle: `Nuit(s) chauffeur (${o.nuitsChauffeur} × ${PRIX_NUIT_CHAUFFEUR} €)`, montant: coutNuitsR });
  if (peagesR) lignes.push({ libelle: "Péages (forfait)", montant: peagesR });
  lignes.push({ libelle: "Marge commerciale (+15 %)", montant: marge });
  lignes.push({ libelle: "TVA (10 %)", montant: tva });

  return { prixHT, tva, prixTTC, devise: "EUR", lignes, coefficients: { saison, urgence, capacite } };
}


export const calculer_devis = calculerDevis;
