-- GeoMan v3 — Extension bureau complet
-- Clients, tâches, agenda, courriers, contacts administratifs, journal et paramètres.

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nom TEXT NOT NULL, telephone TEXT, email TEXT,
  adresse TEXT, wilaya TEXT, commune TEXT, nif TEXT, observation TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS taches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), dossier_id TEXT REFERENCES dossiers(id) ON DELETE CASCADE,
  titre TEXT NOT NULL, description TEXT, responsable TEXT, priorite TEXT NOT NULL DEFAULT 'Normale',
  statut TEXT NOT NULL DEFAULT 'À faire', echeance DATE, terminee_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS evenements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), dossier_id TEXT REFERENCES dossiers(id) ON DELETE SET NULL,
  titre TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'Rendez-vous', date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ, lieu TEXT, description TEXT, rappel_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS courriers_modeles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nom TEXT NOT NULL, categorie TEXT NOT NULL DEFAULT 'Général',
  objet TEXT, contenu TEXT NOT NULL DEFAULT '', actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS courriers_envoyes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), dossier_id TEXT REFERENCES dossiers(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL, modele_id UUID REFERENCES courriers_modeles(id) ON DELETE SET NULL,
  destinataire TEXT, objet TEXT NOT NULL, contenu TEXT NOT NULL, date_envoi TIMESTAMPTZ DEFAULT now(), moyen TEXT DEFAULT 'Courrier'
);
CREATE TABLE IF NOT EXISTS contacts_administrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organisme TEXT NOT NULL, service TEXT, wilaya TEXT,
  telephone TEXT, email TEXT, adresse TEXT, observation TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS journal_bureau (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), utilisateur TEXT, action TEXT NOT NULL, module TEXT NOT NULL,
  reference_id TEXT, details JSONB DEFAULT '{}', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS parametres_bureau (
  cle TEXT PRIMARY KEY, valeur JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
CREATE INDEX IF NOT EXISTS idx_taches_echeance ON taches(echeance);
CREATE INDEX IF NOT EXISTS idx_taches_dossier ON taches(dossier_id);
CREATE INDEX IF NOT EXISTS idx_evenements_date ON evenements(date_debut);
CREATE INDEX IF NOT EXISTS idx_courriers_dossier ON courriers_envoyes(dossier_id);
CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_bureau(created_at DESC);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE taches ENABLE ROW LEVEL SECURITY;
ALTER TABLE evenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE courriers_modeles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courriers_envoyes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts_administrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_bureau ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametres_bureau ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','taches','evenements','courriers_modeles','courriers_envoyes','contacts_administrations','journal_bureau','parametres_bureau'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_all_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "auth_all_%s" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

INSERT INTO courriers_modeles (nom,categorie,objet,contenu) VALUES
('Demande de pièces complémentaires','Dossier','Pièces complémentaires – {DOSSIER}','Madame, Monsieur,\n\nDans le cadre du dossier {DOSSIER}, nous vous prions de bien vouloir nous transmettre les pièces suivantes :\n\n{LISTE_PIECES}\n\nCordialement,\nLe Bureau de Géomètre-Expert.'),
('Convocation client','Rendez-vous','Convocation – {DATE_RDV}','Madame, Monsieur {CLIENT},\n\nNous vous invitons à vous présenter au bureau le {DATE_RDV} concernant le dossier {DOSSIER}.\n\nCordialement.'),
('Lettre de dépôt cadastral','Administration','Dépôt cadastral – {DOSSIER}','Objet : Dépôt du dossier {DOSSIER}\n\nMadame, Monsieur,\n\nVeuillez trouver ci-joint les éléments nécessaires au traitement du dossier mentionné en objet.\n\nCordialement,\nLe Bureau de Géomètre-Expert.')
ON CONFLICT DO NOTHING;

INSERT INTO parametres_bureau (cle,valeur) VALUES
('cabinet','{"nom":"Bureau de Géomètre-Expert","adresse":"","telephone":"","email":"","nif":""}'),
('workflow','{"delai_alerte":7,"devise":"DZD","confirmation_suppression":true}'),
('notifications','{"echeances":true,"paiements":true,"taches":true}')
ON CONFLICT (cle) DO NOTHING;
