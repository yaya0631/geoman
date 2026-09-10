-- GeoMan v4 — Documents, devis, factures et suivi des règlements

CREATE TABLE IF NOT EXISTS documents_bureau (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id TEXT REFERENCES dossiers(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'Autre',
  storage_path TEXT,
  mime_type TEXT,
  taille BIGINT,
  version INTEGER NOT NULL DEFAULT 1,
  statut TEXT NOT NULL DEFAULT 'Actif',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  dossier_id TEXT REFERENCES dossiers(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  date_devis DATE NOT NULL DEFAULT CURRENT_DATE,
  validite_jours INTEGER NOT NULL DEFAULT 30,
  objet TEXT,
  montant_ht NUMERIC(14,2) NOT NULL DEFAULT 0,
  taxe NUMERIC(14,2) NOT NULL DEFAULT 0,
  montant_ttc NUMERIC(14,2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'Brouillon',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL,
  dossier_id TEXT REFERENCES dossiers(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  devis_id UUID REFERENCES devis(id) ON DELETE SET NULL,
  date_facture DATE NOT NULL DEFAULT CURRENT_DATE,
  echeance DATE,
  objet TEXT,
  montant_ht NUMERIC(14,2) NOT NULL DEFAULT 0,
  taxe NUMERIC(14,2) NOT NULL DEFAULT 0,
  montant_ttc NUMERIC(14,2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'Brouillon',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reglements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID REFERENCES factures(id) ON DELETE CASCADE,
  dossier_id TEXT REFERENCES dossiers(id) ON DELETE SET NULL,
  date_reglement DATE NOT NULL DEFAULT CURRENT_DATE,
  montant NUMERIC(14,2) NOT NULL CHECK (montant >= 0),
  mode TEXT NOT NULL DEFAULT 'Espèces',
  reference TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_dossier ON documents_bureau(dossier_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents_bureau(client_id);
CREATE INDEX IF NOT EXISTS idx_factures_dossier ON factures(dossier_id);
CREATE INDEX IF NOT EXISTS idx_factures_echeance ON factures(echeance);
CREATE INDEX IF NOT EXISTS idx_reglements_facture ON reglements(facture_id);

ALTER TABLE documents_bureau ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE reglements ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['documents_bureau','devis','factures','reglements'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_all_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "auth_all_%s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
