-- Ajouter note_commerciale à la table demandes (si pas encore fait)
ALTER TABLE demandes ADD COLUMN IF NOT EXISTS note_commerciale text;
