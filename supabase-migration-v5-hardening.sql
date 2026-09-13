-- GeoMan v5 — Durcissement de la sécurité (production)
-- À exécuter dans Supabase SQL Editor.
--
-- Objectifs :
--   1. Supprimer l'accès anonyme complet (mode démo) sur les tables applicatives.
--   2. Restreindre les opérations à a minima authenticated.
--   3. Restreindre le bucket de stockage au seul chemin dossiers/ et aux utilisateurs connectés.
--   4. Ajouter des index manquants (fichiers.storage_path, recherches courantes).
--   5. Homogénéiser le trigger updated_at sur toutes les tables de travail.

-- ═══ 1. Suppression des politiques anonymes (le mode démo est off) ═══

DROP POLICY IF EXISTS "anon_all_dossiers"   ON dossiers;
DROP POLICY IF EXISTS "anon_all_paiements"  ON paiements;
DROP POLICY IF EXISTS "anon_all_fichiers"   ON fichiers;
DROP POLICY IF EXISTS "anon_all_historique" ON historique;
DROP POLICY IF EXISTS "anon_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "anon_storage_insert" ON storage.objects;

-- ═══ 2. RLS : seuls les utilisateurs authentifiés accèdent aux données ═══

-- Les politiques "auth_all_*" existantes couvrent déjà l'essentiel.
-- On s'assure qu'aucune politique vide ne laisse passer anon :

ALTER TABLE dossiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE courriers_modeles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE courriers_envoyes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_bureau      ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres_bureau   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents_bureau    ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis      ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglements ENABLE ROW LEVEL SECURITY;

-- Politiques par défaut pour les tables créées par les migrations v3/v4
-- (créées via "FOR ALL TO authenticated USING(true) WITH CHECK(true)").
-- On les recrée proprement pour être explicite :

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients','taches','evenements','courriers_modeles','courriers_envoyes',
    'contacts_administrations','journal_bureau','parametres_bureau',
    'documents_bureau','devis','factures','reglements'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_all_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "auth_all_%s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

-- ═══ 3. Stockage : protection du bucket "dossiers" ═══

-- Supprimer les politiques trop larges puis restreindre aux utilisateurs connectés
-- ET au chemin du dossier (dossier_id/...).
DROP POLICY IF EXISTS "auth_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "auth_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "auth_storage_delete" ON storage.objects;

CREATE POLICY "storage_select_authed" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'dossiers');

CREATE POLICY "storage_insert_authed" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dossiers' AND (storage.foldername(name))[1] IS NOT NULL);

CREATE POLICY "storage_delete_authed" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'dossiers' AND (storage.foldername(name))[1] IS NOT NULL);

-- ═══ 4. Index manquants ═══

CREATE INDEX IF NOT EXISTS idx_fichiers_storage_path ON fichiers(storage_path);
CREATE INDEX IF NOT EXISTS idx_fichiers_uploaded    ON fichiers(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_dossiers_nom         ON dossiers(nom);
CREATE INDEX IF NOT EXISTS idx_dossiers_date_finale ON dossiers(date_finale);
CREATE INDEX IF NOT EXISTS idx_dossiers_depot_cad   ON dossiers(depot_cad);
CREATE INDEX IF NOT EXISTS idx_paiements_date       ON paiements(date DESC);

-- ═══ 5. Trigger updated_at unifié ═══

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliqué sur dossiers (déjà existant dans v2) + tables v3/v4
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','taches','courriers_modeles','parametres_bureau','documents_bureau','devis','factures'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
  END LOOP;
END $$;

-- ═══ 6. Realtime : n'exposer que les tables réellement synchronisées ═══

-- La publication ne doit contenir que dossiers et paiements (déjà en place dans v2).
-- Ce commentaire sert de garde-fou : ne pas ajouter d'autres tables sans besoin métier.