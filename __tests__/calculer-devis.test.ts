import { calculerDevis, coefSaison, coefUrgence, coefCapacite } from "@/lib/calculer-devis";

describe("calculerDevis — cas nominaux", () => {
  test("cas simple", () => {
    const d = calculerDevis({ nb_passagers: 40, distance_km: 200, date_demande: "2026-09-01", date_depart: "2026-10-01", options: [] });
    expect(d.prix_ht).toBeCloseTo(546.25, 2);
    expect(d.prix_ttc).toBeCloseTo(600.88, 2);
    expect(d.tva).toBeCloseTo(54.63, 2);
    expect(d.devise).toBe("EUR");
    expect(d.coefficients.capacite).toBe(0);
    const somme = d.lignes.reduce((s, l) => s + l.montant, 0);
    expect(somme).toBeCloseTo(d.prix_ttc, 2);
  });
  test("demande urgente", () => {
    const d = calculerDevis({ nb_passagers: 50, distance_km: 300, date_demande: "2026-07-01", date_depart: "2026-07-04", options: [] });
    expect(d.coefficients.urgence).toBe(0.1);
    expect(d.coefficients.saison).toBe(0.1);
    expect(d.prix_ttc).toBeCloseTo(1147.99, 2);
  });
  test("toutes les options (guide + nuit + péages)", () => {
    const d = calculerDevis({ nb_passagers: 30, distance_km: 400, date_demande: "2026-08-01", date_depart: "2026-12-10", options: ["guide", "nuit_chauffeur", "peages"] });
    expect(d.lignes.find((l) => l.libelle.includes("Guide"))?.montant).toBe(80);
    expect(d.lignes.find((l) => l.libelle.includes("Nuit"))?.montant).toBe(120);
    expect(d.lignes.find((l) => l.libelle.includes("Péages"))?.montant).toBe(80);
    expect(d.prix_ttc).toBeCloseTo(1492.7, 2);
  });
  test("gros volume 80 passagers", () => {
    const d = calculerDevis({ nb_passagers: 80, distance_km: 250, date_demande: "2026-05-01", date_depart: "2026-06-01", options: [] });
    expect(d.coefficients.capacite).toBe(0.4);
    expect(d.prix_ttc).toBeCloseTo(1209.26, 2);
  });
});

describe("calculerDevis — cas limites", () => {
  test("0 passager", () => {
    expect(() => calculerDevis({ nb_passagers: 0, distance_km: 200, date_demande: "2026-05-01", date_depart: "2026-06-01", options: [] })).toThrow(/passagers/i);
  });
  test("dépassement capacité", () => {
    expect(() => calculerDevis({ nb_passagers: 95, distance_km: 200, date_demande: "2026-05-01", date_depart: "2026-06-01", options: [] })).toThrow(/capacit|barème/i);
  });
  test("hors zone", () => {
    expect(() => calculerDevis({ nb_passagers: 40, distance_km: 2000, date_demande: "2026-05-01", date_depart: "2026-06-01", options: [] })).toThrow(/hors zone/i);
  });
  test("dates incohérentes", () => {
    expect(() => calculerDevis({ nb_passagers: 40, distance_km: 200, date_demande: "2026-06-10", date_depart: "2026-06-01", options: [] })).toThrow(/incohérent/i);
  });
  test("distance invalide", () => {
    expect(() => calculerDevis({ nb_passagers: 40, distance_km: 0, date_demande: "2026-05-01", date_depart: "2026-06-01", options: [] })).toThrow(/distance/i);
  });
});

describe("matrices", () => {
  test("saison", () => {
    expect(coefSaison(6).niveau).toBe("Très haute");
    expect(coefSaison(1).valeur).toBe(-0.07);
    expect(coefSaison(7).valeur).toBe(0.1);
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
    expect(coefCapacite(67).valeur).toBe(0.2);
    expect(coefCapacite(85).valeur).toBe(0.4);
  });
});
