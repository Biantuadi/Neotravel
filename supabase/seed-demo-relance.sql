-- ── Seed démo : simule un prospect avec devis envoyé il y a 3 jours ──────────
-- À exécuter dans Supabase SQL Editor avant une démo
-- Le prospect passera en relance_1 au prochain déclenchement de la fonction

-- 1. Créer le prospect dans la table demandes
INSERT INTO demandes (
  nom_prospect,
  email,
  telephone,
  depart,
  destination,
  date_depart,
  nb_passagers,
  statut,
  updated_at,
  created_at
) VALUES (
  'Jean Durand Demo',
  'biantuadikevin@gmail.com',   -- remplace par l'email de test
  '+33 6 12 34 56 78',
  'Paris',
  'Lyon',
  NOW() + INTERVAL '15 days',
  8,
  'devis_envoye',
  NOW() - INTERVAL '3 days',   -- simuler J-3 → déclenche relance_1 immédiatement
  NOW() - INTERVAL '3 days'
)
RETURNING id, nom_prospect, statut, updated_at;

-- 2. Vérifier
SELECT id, nom_prospect, statut, updated_at
FROM demandes
WHERE nom_prospect = 'Jean Durand Demo'
ORDER BY created_at DESC
LIMIT 1;
