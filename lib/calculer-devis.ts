import { ParamsDevis, ResultatDevis, LigneDevis } from "@/types";

// prix/km, prix mini et forfait péages non fournis dans les matrices : à confirmer
const PRIX_PAR_KM = 2.5;
const PRIX_MINIMUM = 350;
const DISTANCE_MAX_KM = 1500;
const PEAGE_PAR_KM = 0.2;
const TVA = 0.1;
const MARGE = 0.15;
const PRIX_GUIDE = 80;
const PRIX_NUIT_CHAUFFEUR = 120;
const CAPACITE_MAX = 85;

const arrondi = (n: number): number => Math.round(n * 100) / 100;
const joursEntre = (a: Date, b: Date): number => Math.floor((b.getTime() - a.getTime()) / 86400000);

export function coefSaison(mois: number) {
  if ([11, 1, 2, 8].includes(mois)) return { niveau: "Basse", valeur: -0.07 };
  if ([12, 10, 9].includes(mois)) return { niveau: "Moyenne", valeur: 0 };
  if ([3, 4, 7].includes(mois)) return { niveau: "Haute", valeur: 0.1 };
  return { niveau: "Très haute", valeur: 0.15 };
}
export function coefUrgence(jours: number) {
  if (jours < 7) return { code: "DD_PRIORITAIRE", valeur: 0.1 };
  if (jours < 30) return { code: "DD_URGENT", valeur: 0.05 };
  if (jours < 90) return { code: "DD_NORMAL", valeur: -0.05 };
  return { code: "DD_3MOISETPLUS", valeur: -0.1 };
}
export function coefCapacite(nb: number) {
  if (nb <= 19) return { tranche: "≤ 19", valeur: -0.05 };
  if (nb <= 53) return { tranche: "20–53", valeur: 0 };
  if (nb <= 63) return { tranche: "54–63", valeur: 0.15 };
  if (nb <= 67) return { tranche: "64–67", valeur: 0.2 };
  return { tranche: "68–85", valeur: 0.4 };
}

export function calculerDevis(p: ParamsDevis): ResultatDevis {
  if (!Number.isFinite(p.nb_passagers) || p.nb_passagers <= 0)
    throw new Error("Nombre de passagers invalide (doit être ≥ 1).");
  if (p.nb_passagers > CAPACITE_MAX)
    throw new Error(`Capacité hors barème (max ${CAPACITE_MAX} passagers).`);
  if (!Number.isFinite(p.distance_km) || p.distance_km <= 0)
    throw new Error("Distance invalide (doit être > 0).");
  if (p.distance_km > DISTANCE_MAX_KM)
    throw new Error("Trajet hors zone desservie.");

  const dDemande = new Date(p.date_demande);
  const dDepart = new Date(p.date_depart);
  if (isNaN(dDemande.getTime()) || isNaN(dDepart.getTime()))
    throw new Error("Date invalide (format AAAA-MM-JJ).");
  if (dDepart < dDemande)
    throw new Error("Dates incohérentes : le départ précède la demande.");

  const base = Math.max(p.distance_km * PRIX_PAR_KM, PRIX_MINIMUM);
  const saison = coefSaison(dDepart.getMonth() + 1);
  const urgence = coefUrgence(joursEntre(dDemande, dDepart));
  const capacite = coefCapacite(p.nb_passagers);
  const transport = base * (1 + saison.valeur) * (1 + urgence.valeur) * (1 + capacite.valeur);

  const options = p.options ?? [];
  const transportR = arrondi(transport);
  const coutGuide = options.includes("guide") ? PRIX_GUIDE : 0;
  const coutNuit = options.includes("nuit_chauffeur") ? PRIX_NUIT_CHAUFFEUR : 0;
  const coutPeages = options.includes("peages") ? arrondi(p.distance_km * PEAGE_PAR_KM) : 0;

  const sousTotal = arrondi(transportR + coutGuide + coutNuit + coutPeages);
  const marge = arrondi(sousTotal * MARGE);
  const prix_ht = arrondi(sousTotal + marge);
  const prix_ttc = arrondi(prix_ht * (1 + TVA));
  const tva = arrondi(prix_ttc - prix_ht);

  const lignes: LigneDevis[] = [
    { libelle: `Transport ${p.distance_km} km (base ${arrondi(base)} €)`, montant: transportR },
  ];
  if (coutGuide) lignes.push({ libelle: "Guide / accompagnateur", montant: coutGuide });
  if (coutNuit) lignes.push({ libelle: "Nuit chauffeur", montant: coutNuit });
  if (coutPeages) lignes.push({ libelle: "Péages (forfait)", montant: coutPeages });
  lignes.push({ libelle: "Marge commerciale (+15 %)", montant: marge });
  lignes.push({ libelle: "TVA (10 %)", montant: tva });

  return {
    prix_ht, tva, prix_ttc, lignes,
    coefficients: { saison: saison.valeur, urgence: urgence.valeur, capacite: capacite.valeur },
    devise: "EUR",
  };
}

export const calculer_devis = calculerDevis;
