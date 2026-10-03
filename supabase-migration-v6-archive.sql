-- GeoMan v6 — Suivi d'archive : n° de classement, boîte, code client, sorties / retours
-- À exécuter une fois dans Supabase SQL Editor. Idempotente (ré-exécutable sans erreur).

-- ═══ 1. Nouveaux champs sur clients ═══
ALTER TABLE clients ADD COLUMN IF NOT EXISTS code           TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS numero         INTEGER;  -- n° de classement (ex « N°Archive »)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS boite          INTEGER;  -- n° de boîte, NULL ou 0 = non rangé
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_archivage DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS en_archive     BOOLEAN NOT NULL DEFAULT TRUE;

-- Unicité (les valeurs NULL restent autorisées en plusieurs exemplaires)
CREATE UNIQUE INDEX IF NOT EXISTS clients_numero_key ON clients(numero);
CREATE UNIQUE INDEX IF NOT EXISTS clients_code_key   ON clients(code);
CREATE INDEX        IF NOT EXISTS idx_clients_boite  ON clients(boite);

-- ═══ 2. Historique des mouvements ═══
CREATE TABLE IF NOT EXISTS client_mouvements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('sortie', 'retour')),
  motif      TEXT,
  par        TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_mouvements_client ON client_mouvements(client_id, created_at DESC);
-- Dernières sorties (alerte « sorti depuis plus de 30 jours »)
CREATE INDEX IF NOT EXISTS idx_client_mouvements_type   ON client_mouvements(type, created_at DESC);

-- ═══ 3. RLS : même règle que les autres tables (utilisateurs connectés uniquement) ═══
ALTER TABLE client_mouvements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_all_client_mouvements" ON client_mouvements;
CREATE POLICY "auth_all_client_mouvements" ON client_mouvements
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
