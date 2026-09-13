# GEOMAN v2 — Système de Gestion des Dossiers Fonciers

Application web professionnelle de bureau pour la gestion de dossiers fonciers / topographiques, destinée aux géomètres, notaires et bureaux du cadastre en Algérie.

---

## Stack Technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Base de données | Supabase (PostgreSQL + Realtime) |
| État global | Zustand |
| Requêtes | TanStack Query (React Query) |
| Formulaires | React Hook Form + Zod |
| Graphiques | Recharts |
| Icônes | Lucide React |
| Notifications | React Hot Toast |
| Routing | React Router v6 |
| Fonts | Syne + DM Mono |

---

## Installation

### 1. Cloner et installer les dépendances

```bash
git clone https://github.com/votre-user/geoman.git
cd geoman
npm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **SQL Editor** et exécuter le fichier `supabase-migration.sql`
3. Copier `.env.example` en `.env` et renseigner les clés :

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Lancer en développement

```bash
npm run dev
```

### 4. Build de production

```bash
npm run build
```

---

## Déploiement Vercel

```bash
npm install -g vercel
vercel --prod
```

Ajouter les variables d'environnement dans le dashboard Vercel :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Fonctionnalités

### Gestion des dossiers
- Créer / Modifier / Dupliquer / Archiver / Supprimer
- Corbeille avec restauration ou suppression définitive
- Annulation de la dernière action (Ctrl+Z)

### Tableau de données
- Tri multi-colonnes
- Sélection multiple (Ctrl+Clic, Shift+Clic)
- Colonnes configurables (visibilité persistée)
- Code couleur par statut automatique
- Menu contextuel clic droit
- Double-clic pour édition rapide

### Filtres
- Recherche texte libre (ID, client, endroit, téléphone, observations)
- Filtre par localité (dynamique)
- Filtre par dépôt cadastral
- Vues : Actifs / Archives / Corbeille / En retard / Impayés
- Toggle "Inclure archivés" / "Afficher le reste à payer"

### Paiements
- Enregistrement des versements avec date + montant + note
- Calcul automatique : Encaissé / Reste à payer
- Historique des paiements par dossier

### Fichiers joints
- Upload vers Supabase Storage
- Téléchargement / Suppression
- Icônes par type de fichier

### Tableau de bord
- KPIs : total, actifs, en retard, terminés, archivés
- Financier : montant attendu, encaissé, reste, taux de recouvrement
- Graphiques : par localité (barres), par état (camembert), évolution mensuelle (courbe)
- Liste des dossiers en retard

### Raccourcis clavier
| Touche | Action |
|---|---|
| `Ctrl+N` | Nouveau dossier |
| `F2` | Modifier la sélection |
| `F5` | Ouvrir le dashboard |
| `Ctrl+R` | Rappels / alertes |
| `Ctrl+E` | Import / Export |
| `Ctrl+A` | Archiver la sélection |
| `Suppr` | Mettre en corbeille |
| `Ctrl+Z` | Annuler |
| `Ctrl+K` | Palette de commandes |
| `Échap` | Fermer / Réinitialiser filtres |

---

## Sécurité

- Authentification Supabase (email + mot de passe) avec récupération de mot de passe.
- Row Level Security (RLS) activée sur toutes les tables : seuls les utilisateurs authentifiés accèdent aux données.
- Accès anonyme désactivé (aucune politique `anon` n'est appliquée en production).
- Stockage : bucket privé `dossiers`, accès restreint aux utilisateurs authentifiés.
- Les clés publiques (`anon`) sont les seules exposées au navigateur ; aucune clé secrète ne transite côté client.

## Migrations

Le schéma est géré par migration SQL incrémentale dans le dossier racine :

| Fichier | Contenu |
|---|---|
| `supabase-migration.sql` | Schéma initial : dossiers, paiements, fichiers, historique, RLS, stockage, données de démo |
| `supabase-migration-v3-office.sql` | Extension bureau : clients, tâches, événements, courriers, contacts, journal, paramètres |
| `supabase-migration-v4-finance-documents.sql` | Documents, devis, factures, règlements |
| `supabase-migration-v5-hardening.sql` | **Durcissement sécurité** : suppression de l'accès anonyme, restriction du bucket, index, triggers `updated_at` |

> ⚠️ Avant de déployer : exécutez les migrations dans l'ordre sur votre projet Supabase.

---

## Architecture des fichiers

```
src/
├── components/
│   ├── layout/          # Navbar, CommandBar, FilterBar, StatusBar, Legend
│   ├── table/           # DossierTable, ContextMenu
│   ├── sidebar/         # DetailSidebar
│   ├── modals/          # DossierModal, PaymentModal, FilesModal,
│   │                    # DashboardModal, RemindersModal, HistoryModal,
│   │                    # ExportModal, ColumnsModal, SettingsModal, CommandPalette
│   ├── ui/              # ModalShell (dialog accessible), States (vide/erreur/chargement)
│   └── ui/              # BulkActionsBar
├── hooks/               # useDossiers, useFilters, useKeyboard, useRealtimeSync
├── lib/                 # supabase, status, formatters, utils
├── store/               # appStore (Zustand)
├── pages/               # LoginPage, MainPage, DashboardPage
└── types/               # index.ts (tous les types TypeScript)
```

---

## Schéma de la base de données

- **`dossiers`** — Table principale
- **`paiements`** — Versements liés à chaque dossier
- **`fichiers`** — Métadonnées des fichiers joints (stockage dans Supabase Storage)
- **`historique`** — Journal d'activité par dossier

---

## Statuts des dossiers

| Couleur | Statut | Condition |
|---|---|---|
| 🔴 Rouge | En retard | Date dépassée, non terminé |
| 🟡 Jaune | Échéance proche | ≤ 7 jours avant deadline |
| 🟣 Violet | Soldé partiel | Paiements partiels |
| 🟢 Vert | Terminé | Dossier clôturé |
| ⚪ Gris | En attente | En cours de traitement |
| 🟠 Orange | Bloqué | Bloqué pour raison externe |
| 🔵 Sombre | Archivé | Archivé manuellement |
