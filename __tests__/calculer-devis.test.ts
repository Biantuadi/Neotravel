import { calculerDevis, coefSaison, coefUrgence, coefCapacite } from "@/lib/calculer-devis";

describe("calculerDevis — cas nominaux", () => {
  test("cas simple : prix correct et devis auditable", () => {
    const d = calculerDevis({ nbPassagers: 40, distanceKm: 200, dateDemande: "2026-09-01", dateDepart: "2026-10-01" });
    expect(d.prixHT).toBeCloseTo(546.25, 2);
    expect(d.prixTTC).toBeCloseTo(600.88, 2);
    expect(d.tva).toBeCloseTo(54.63, 2);
    expect(d.devise).toBe("EUR");
    expect(d.coefficients.saison.niveau).toBe("Moyenne");
    expect(d.coefficients.capacite.valeur).toBe(0);
    const somme = d.lignes.reduce((s, l) => s + l.montant, 0);
    expect(somme).toBeCloseTo(d.prixTTC, 2);
  });

  test("demande urgente : majoration prioritaire (+10 %)", () => {
    const d = calculerDevis({ nbPassagers: 50, distanceKm: 300, dateDemande: "2026-07-01", dateDepart: "2026-07-04" });
    expect(d.coefficients.urgence.code).toBe("DD_PRIORITAIRE");
    expect(d.coefficients.urgence.valeur).toBe(0.10);
    expect(d.coefficients.saison.niveau).toBe("Haute");
    expect(d.prixTTC).toBeCloseTo(1147.99, 2);
  });

  test("options (nuit + guide + péages) : lignes et total corrects", () => {
    const d = calculerDevis({ nbPassagers: 30, distanceKm: 400, dateDemande: "2026-08-01", dateDepart: "2026-12-10", options: { nuitsChauffeur: 1, guideJours: 2, peages: 60 } });
    expect(d.lignes.find(l => l.libelle.includes("Nuit"))?.montant).toBe(120);
    expect(d.lignes.find(l => l.libelle.includes("Guide"))?.montant).toBe(160);
    expect(d.lignes.find(l => l.libelle.includes("Péages"))?.montant).toBe(60);
    expect(d.prixTTC).toBeCloseTo(1568.60, 2);
  });

  test("gros volume (80 passagers) : +40 % capacité", () => {
    const d = calculerDevis({ nbPassagers: 80, distanceKm: 250, dateDemande: "2026-05-01", dateDepart: "2026-06-01" });
    expect(d.coefficients.capacite.valeur).toBe(0.40);
    expect(d.prixTTC).toBeCloseTo(1209.26, 2);
  });
});

describe("calculerDevis — cas limites (erreur attendue)", () => {
  test("0 passager", () => {
    expect(() => calculerDevis({ nbPassagers: 0, distanceKm: 200, dateDemande: "2026-05-01", dateDepart: "2026-06-01" })).toThrow(/passagers/i);
  });
  test("dépassement de capacité (95)", () => {
    expect(() => calculerDevis({ nbPassagers: 95, distanceKm: 200, dateDemande: "2026-05-01", dateDepart: "2026-06-01" })).toThrow(/capacit|barème/i);
  });
  test("hors zone (distance trop grande)", () => {
    expect(() => calculerDevis({ nbPassagers: 40, distanceKm: 2000, dateDemande: "2026-05-01", dateDepart: "2026-06-01" })).toThrow(/hors zone/i);
  });
  test("dates incohérentes", () => {
    expect(() => calculerDevis({ nbPassagers: 40, distanceKm: 200, dateDemande: "2026-06-10", dateDepart: "2026-06-01" })).toThrow(/incohérent/i);
  });
  test("distance invalide (0 km)", () => {
    expect(() => calculerDevis({ nbPassagers: 40, distanceKm: 0, dateDemande: "2026-05-01", dateDepart: "2026-06-01" })).toThrow(/distance/i);
  });
});

describe("matrices : bornes", () => {
  test("saison", () => {
    expect(coefSaison(6).niveau).toBe("Très haute");
    expect(coefSaison(1).valeur).toBe(-0.07);
    expect(coefSaison(7).valeur).toBe(0.10);
    expect(coefSaison(10).valeur).toBe(0);
  });
  test("urgence", () => {
    expect(coefUrgence(3).code).toBe("DD_PRIORITAIRE");
    expect(coefUrgence(15).code).toBe("DD_URGENT");
    expect(coefUrgence(60).code).toBe("DD_NORMAL");
    expect(coefUrgence(120).code).toBe("DD_3MOISETPLUS");
  });
  test("capacité", () => {
    expect(coefCapacite(19).valeur).toBe(-0.05);
    expect(coefCapacite(53).valeur).toBe(0);
    expect(coefCapacite(63).valeur).toBe(0.15);
    expect(coefCapacite(67).valeur).toBe(0.20);
    expect(coefCapacite(85).valeur).toBe(0.40);
  });
});
