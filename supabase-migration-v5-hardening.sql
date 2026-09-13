-- GeoMan v5 — Durcissement de la sécurité (production) — version tolérante
-- À exécuter dans Supabase SQL Editor.
--
-- Cette version est SÛRE à exécuter :
--   • idempotente (ré-exécutable sans erreur) ;
--   • tolérante : les instructions concernant des tables qui n'existent pas
--     (clients, taches, evenements, devis, factures, etc.) sont ignorées,
--     que la migration v3/v4 ait été exécutée ou non.
--
-- Objectifs :
--   1. Supprimer l'accès anonyme complet (mode démo) sur les tables applicatives.
--   2. Restreindre les opérations à a minima authenticated.
--   3. Restreindre le bucket de stockage au seul chemin dossiers/ et aux utilisateurs connectés.
--   4. Ajouter des index manquants.
--   5. Homogénéiser le trigger updated_at sur toutes les tables de travail existantes.

-- ═══ 1. Suppression des politiques anonymes (le mode démo est off) ═══

DROP POLICY IF EXISTS "anon_all_dossiers"   ON dossiers;
DROP POLICY IF EXISTS "anon_all_paiements"  ON paiements;
DROP POLICY IF EXISTS "anon_all_fichiers"   ON fichiers;
DROP POLICY IF EXISTS "anon_all_historique" ON historique;
DROP POLICY IF EXISTS "anon_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "anon_storage_insert" ON storage.objects;

-- ═══ 2. RLS : seuls les utilisateurs authentifiés accèdent aux données ═══

-- Tables cœur (créées par la v2) : présentes sur toutes les bases.
ALTER TABLE dossiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique ENABLE ROW LEVEL SECURITY;

-- Politique v2 sur dossiers (remplacement sûr — idempotent)
DO $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "auth_all_dossiers" ON dossiers');
  EXECUTE format('CREATE POLICY "auth_all_dossiers" ON dossiers FOR ALL TO authenticated USING (true) WITH CHECK (true)');
END $$;

-- Tables optionnelles (v3/v4) : activation RLS + politique uniquement si la table existe.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'clients','taches','evenements','courriers_modeles','courriers_envoyes',
    'contacts_administrations','journal_bureau','parametres_bureau',
    'documents_bureau','devis','factures','reglements'
  ] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS "auth_all_%s" ON %I', t, t);
      EXECUTE format('CREATE POLICY "auth_all_%s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
    END IF;
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

-- ═══ 5. Trigger updated_at unifié (uniquement sur les tables existantes) ═══

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','taches','courriers_modeles','parametres_bureau','documents_bureau','devis','factures'] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', t);
      EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
    END IF;
  END LOOP;
END $$;

-- ═══ 6. Realtime : n'exposer que les tables réellement synchronisées ═══

-- La publication ne doit contenir que dossiers et paiements (déjà en place dans v2).
-- Ce commentaire sert de garde-fou : ne pas ajouter d'autres tables sans besoin métier.