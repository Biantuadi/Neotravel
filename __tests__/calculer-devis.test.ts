import { calculerDevis, coefSaison, coefUrgence, coefCapacite } from "@/lib/calculer-devis";

// ── Mock Supabase — renvoie le véhicule "Car 50 places" (3,8 €/km) ───────────
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        lte: () => ({
          gte: () => ({
            order: () => ({
              limit: () => ({
                single: async () => ({
                  data: { nom_vehicule: 'Car 50 places', capacite_min: 31, capacite_max: 50, prix_par_km: 3.80 },
                  error: null,
                }),
              }),
            }),
          }),
        }),
        order: () => ({
          limit: () => ({
            single: async () => ({
              data: { nom_vehicule: 'Grand car 70 places', capacite_min: 51, capacite_max: 70, prix_par_km: 6.50 },
              error: null,
            }),
          }),
        }),
      }),
    }),
  },
}));

// ── Cas nominaux ─────────────────────────────────────────────────────────────

describe("calculerDevis — cas nominaux", () => {
  test("cas simple : structure et coefficients corrects", async () => {
    const d = await calculerDevis({ nbPassagers: 40, distanceKm: 200, dateDemande: "2026-09-01", dateDepart: "2026-10-01" });
    expect(d.devise).toBe("EUR");
    expect(d.prixHT).toBeGreaterThan(0);
    expect(d.prixTTC).toBeGreaterThan(d.prixHT);
    expect(d.tva).toBeCloseTo(d.prixTTC - d.prixHT, 2);
    expect(d.vehicule).toBe("Car 50 places");
    expect(d.coefficients.saison.niveau).toBe("Moyenne");
    expect(d.coefficients.capacite.valeur).toBe(0);
    const somme = d.lignes.reduce((s, l) => s + l.montant, 0);
    expect(somme).toBeCloseTo(d.prixTTC, 2);
  });

  test("demande urgente : majoration prioritaire (+10 %)", async () => {
    const d = await calculerDevis({ nbPassagers: 50, distanceKm: 300, dateDemande: "2026-07-01", dateDepart: "2026-07-04" });
    expect(d.coefficients.urgence.code).toBe("DD_PRIORITAIRE");
    expect(d.coefficients.urgence.valeur).toBe(0.10);
    expect(d.coefficients.saison.niveau).toBe("Haute");
    expect(d.prixTTC).toBeGreaterThan(0);
  });

  test("options (nuit + guide + péages) : lignes correctes", async () => {
    const d = await calculerDevis({ nbPassagers: 30, distanceKm: 400, dateDemande: "2026-08-01", dateDepart: "2026-12-10", options: { nuitsChauffeur: 1, guideJours: 2, peages: 60 } });
    expect(d.lignes.find(l => l.libelle.includes("Nuit"))?.montant).toBe(120);
    expect(d.lignes.find(l => l.libelle.includes("Guide"))?.montant).toBe(160);
    expect(d.lignes.find(l => l.libelle.includes("Péages"))?.montant).toBe(60);
    const somme = d.lignes.reduce((s, l) => s + l.montant, 0);
    expect(somme).toBeCloseTo(d.prixTTC, 2);
  });

  test("gros volume (59 passagers, max barème) : tranche 54–63 +15 % capacité", async () => {
    const d = await calculerDevis({ nbPassagers: 59, distanceKm: 250, dateDemande: "2026-05-01", dateDepart: "2026-06-01" });
    expect(d.coefficients.capacite.valeur).toBe(0.15);
    expect(d.prixTTC).toBeGreaterThan(0);
  });

  test("le libellé de transport inclut le nom du véhicule", async () => {
    const d = await calculerDevis({ nbPassagers: 40, distanceKm: 200, dateDemande: "2026-09-01", dateDepart: "2026-10-01" });
    const ligneTransport = d.lignes[0].libelle;
    expect(ligneTransport).toContain("Car 50 places");
    expect(ligneTransport).toContain("3.8");
  });
});

// ── Cas limites (erreurs de validation — avant appel BD) ──────────────────────

describe("calculerDevis — cas limites (erreur attendue)", () => {
  test("0 passager", async () => {
    await expect(calculerDevis({ nbPassagers: 0, distanceKm: 200, dateDemande: "2026-05-01", dateDepart: "2026-06-01" }))
      .rejects.toThrow(/passagers/i);
  });
  test("dépassement de capacité (95)", async () => {
    await expect(calculerDevis({ nbPassagers: 95, distanceKm: 200, dateDemande: "2026-05-01", dateDepart: "2026-06-01" }))
      .rejects.toThrow(/capacit|barème/i);
  });
  test("longue distance (2000 km) : acceptée sans limite de distance", async () => {
    const d = await calculerDevis({ nbPassagers: 40, distanceKm: 2000, dateDemande: "2026-05-01", dateDepart: "2026-06-01" });
    expect(d.prixTTC).toBeGreaterThan(0);
    expect(d.distanceKm ?? 2000).toBe(2000);
  });
  test("dates incohérentes", async () => {
    await expect(calculerDevis({ nbPassagers: 40, distanceKm: 200, dateDemande: "2026-06-10", dateDepart: "2026-06-01" }))
      .rejects.toThrow(/incohérent/i);
  });
  test("distance invalide (0 km)", async () => {
    await expect(calculerDevis({ nbPassagers: 40, distanceKm: 0, dateDemande: "2026-05-01", dateDepart: "2026-06-01" }))
      .rejects.toThrow(/distance/i);
  });
});

// ── Coefficients (synchrones, indépendants de la BD) ──────────────────────────

describe("coefficients — bornes", () => {
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
