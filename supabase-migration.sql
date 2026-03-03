-- GeoMan v2 — Supabase Database Schema
-- Exécuter dans Supabase SQL Editor (Dashboard → SQL Editor)

-- ═══════════════════════════ TABLES ═══════════════════════════

CREATE TABLE IF NOT EXISTS dossiers (
  id           TEXT PRIMARY KEY,
  nom          TEXT NOT NULL,
  endroit      TEXT,
  telephone    TEXT,
  date_finale  DATE,
  montant      NUMERIC DEFAULT 0,
  acte         BOOLEAN DEFAULT false,
  regul        BOOLEAN DEFAULT false,
  agricole     BOOLEAN DEFAULT false,
  depot_cad    TEXT DEFAULT '',
  depot_domain TEXT DEFAULT '',
  etat         TEXT DEFAULT 'actif',
  observations TEXT,
  archived     BOOLEAN DEFAULT false,
  in_trash     BOOLEAN DEFAULT false,
  date_archive TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paiements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id   TEXT REFERENCES dossiers(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  montant      NUMERIC NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fichiers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id     TEXT REFERENCES dossiers(id) ON DELETE CASCADE,
  nom_fichier    TEXT NOT NULL,
  storage_path   TEXT NOT NULL,
  taille         BIGINT,
  type_mime      TEXT,
  uploaded_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS historique (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id   TEXT REFERENCES dossiers(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  details      JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════ INDEXES ═══════════════════════════

CREATE INDEX IF NOT EXISTS idx_dossiers_archived  ON dossiers(archived);
CREATE INDEX IF NOT EXISTS idx_dossiers_in_trash  ON dossiers(in_trash);
CREATE INDEX IF NOT EXISTS idx_dossiers_etat      ON dossiers(etat);
CREATE INDEX IF NOT EXISTS idx_dossiers_created   ON dossiers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paiements_dossier  ON paiements(dossier_id);
CREATE INDEX IF NOT EXISTS idx_fichiers_dossier   ON fichiers(dossier_id);
CREATE INDEX IF NOT EXISTS idx_historique_dossier ON historique(dossier_id);

-- ═══════════════════════════ TRIGGER updated_at ═══════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON dossiers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON dossiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════ ROW LEVEL SECURITY ═══════════════════════════

ALTER TABLE dossiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE fichiers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique ENABLE ROW LEVEL SECURITY;

-- Utilisateurs authentifiés : accès complet
CREATE POLICY "auth_all_dossiers"   ON dossiers   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_paiements"  ON paiements  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_fichiers"   ON fichiers   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_historique" ON historique FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Accès anonyme pour le mode démo (à supprimer en production)
CREATE POLICY "anon_all_dossiers"   ON dossiers   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_paiements"  ON paiements  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_fichiers"   ON fichiers   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_historique" ON historique FOR ALL TO anon USING (true) WITH CHECK (true);

-- ═══════════════════════════ REALTIME ═══════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE dossiers;
ALTER PUBLICATION supabase_realtime ADD TABLE paiements;

-- ═══════════════════════════ STORAGE ═══════════════════════════

-- Créer le bucket pour les fichiers joints
INSERT INTO storage.buckets (id, name, public)
VALUES ('dossiers', 'dossiers', false)
ON CONFLICT (id) DO NOTHING;

-- Politiques de stockage
CREATE POLICY "auth_storage_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'dossiers');

CREATE POLICY "auth_storage_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dossiers');

CREATE POLICY "auth_storage_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'dossiers');

-- Accès anonyme pour le mode démo
CREATE POLICY "anon_storage_select" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'dossiers');

CREATE POLICY "anon_storage_insert" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'dossiers');

-- ═══════════════════════════ DONNÉES DE DÉMO ═══════════════════════════

INSERT INTO dossiers (id, nom, endroit, telephone, date_finale, montant, acte, regul, agricole, depot_cad, depot_domain, etat, observations)
VALUES
  ('D-2024-001', 'Mohammed BENSALAH',  'Oran - Bir El Djir',  '0555 12 34 56', '2024-06-15', 45000,  true,  false, false, 'Depose',        'Non depose', 'actif',     'Parcelle 120m² zone résidentielle'),
  ('D-2024-002', 'Fatima HADJ AHMED',  'Tlemcen',             '0661 23 45 67', '2024-03-01', 80000,  false, true,  true,  'Non depose',    'Non depose', 'En attente','Terrain agricole — système d''irrigation'),
  ('D-2024-003', 'Karim MEBARKI',      'Oran - Sidi Chahmi',  '0770 11 22 33', '2024-01-15', 120000, true,  true,  false, 'Depose',        'Depose',     'Termine',   null),
  ('D-2024-004', 'Amina BOUZIDI',      'Mascara',             '0551 12 23 34', '2024-07-30', 35000,  false, false, false, 'Non depose',    'Non depose', 'Bloque',    'Litige voisinage — en attente décision tribunal'),
  ('D-2024-005', 'Omar CHABANE',       'Oran - Centre',       '0662 23 34 45', '2024-02-28', 95000,  true,  false, false, 'Depose 2eme fois','Depose',   'actif',     null),
  ('D-2024-006', 'Yacine BOUKHELIFA', 'Sidi Bel Abbès',      '0773 44 55 66', '2024-08-20', 55000,  false, true,  false, 'Depose',        'Non depose', 'actif',     'Dossier urgent — client pressé'),
  ('D-2024-007', 'Nadia MERZOUK',      'Oran - Es Senia',     '0550 98 76 54', '2024-04-10', 70000,  true,  false, false, 'Non depose',    'Non depose', 'Bloque',    null),
  ('D-2025-001', 'Rachid TALBI',       'Mostaganem',          '0664 33 22 11', '2025-12-31', 60000,  false, false, false, 'Non depose',    'Non depose', 'actif',     'Nouveau dossier 2025 — priorité haute'),
  ('D-2025-002', 'Samira BENALI',      'Relizane',            '0771 55 44 33', '2025-06-30', 90000,  false, false, true,  'Non depose',    'Non depose', 'En attente','Parcelle agricole 2 hectares')
ON CONFLICT (id) DO NOTHING;

INSERT INTO paiements (dossier_id, date, montant, note) VALUES
  ('D-2024-001', '2024-01-10', 20000, 'Acompte initial'),
  ('D-2024-001', '2024-03-15', 15000, 'Deuxième versement'),
  ('D-2024-003', '2024-01-05', 60000, 'Premier versement'),
  ('D-2024-003', '2024-01-20', 60000, 'Solde final — dossier clôturé'),
  ('D-2024-005', '2024-02-01', 50000, 'Acompte 50%'),
  ('D-2024-006', '2024-05-10', 30000, 'Versement partiel')
ON CONFLICT DO NOTHING;

INSERT INTO historique (dossier_id, action, details) VALUES
  ('D-2024-001', 'created',  '{"nom": "Mohammed BENSALAH"}'),
  ('D-2024-001', 'modified', '{"fields": ["depot_cad"]}'),
  ('D-2024-003', 'created',  '{"nom": "Karim MEBARKI"}'),
  ('D-2024-003', 'modified', '{"fields": ["etat"]}'),
  ('D-2024-004', 'created',  '{"nom": "Amina BOUZIDI"}'),
  ('D-2024-004', 'modified', '{"fields": ["etat", "observations"]}')
ON CONFLICT DO NOTHING;
