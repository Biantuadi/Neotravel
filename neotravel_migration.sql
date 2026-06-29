-- Migration NeoTravel - Modèle de données complet
-- À exécuter dans Supabase > SQL Editor

-- Extensions utiles
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type statut_demande as enum (
  'nouveau_lead',
  'incomplet',
  'qualifie',
  'devis_envoye',
  'relance_1',
  'relance_2',
  'accepte',
  'refuse',
  'cas_complexe',
  'cloture'
);

create type urgence_level as enum ('faible', 'normale', 'urgente');

create type statut_devis as enum ('brouillon', 'envoye', 'accepte', 'refuse', 'expire');

create type statut_relance as enum ('programmee', 'envoyee', 'echec');

create type canal_relance as enum ('email', 'sms', 'whatsapp');

create type type_client as enum ('particulier', 'entreprise', 'collectivite');

-- ============================================================
-- TABLE CLIENTS
-- ============================================================

create table clients (
  id                  uuid primary key default uuid_generate_v4(),
  nom                 text not null,
  email               text,
  telephone           text,
  type_client         type_client not null default 'particulier',
  nb_demandes         integer not null default 0,
  derniere_demande    timestamptz,
  date_consentement   timestamptz,
  canal_acquisition   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- TABLE DEMANDES
-- ============================================================

create table demandes (
  id                  uuid primary key default uuid_generate_v4(),
  client_id           uuid references clients(id) on delete set null,
  nom_prospect        text not null,
  email               text,
  telephone           text,
  nb_passagers        integer,
  depart              text,
  destination         text,
  date_depart         date,
  date_retour         date,
  statut              statut_demande not null default 'nouveau_lead',
  urgence             urgence_level not null default 'normale',
  score_completude    integer default 0 check (score_completude between 0 and 100),
  budget_estime       numeric(10,2),
  commentaire_client  text,
  note_commerciale    text,
  date_creation       timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- TABLE MATRICES (règles tarifaires)
-- ============================================================

create table matrices (
  id                        uuid primary key default uuid_generate_v4(),
  nom_vehicule              text not null,
  capacite_min              integer not null,
  capacite_max              integer not null,
  prix_par_km               numeric(10,2),
  prix_minimum              numeric(10,2),
  coefficient_saison        numeric(5,4) not null default 1.0,
  coefficient_urgence       numeric(5,4) not null default 1.0,
  options_supplementaires   jsonb default '{}',
  tva                       numeric(5,4) not null default 0.10,
  actif                     boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ============================================================
-- TABLE DEVIS
-- ============================================================

create table devis (
  id                uuid primary key default uuid_generate_v4(),
  demande_id        uuid not null references demandes(id) on delete cascade,
  prix_ht           numeric(10,2) not null,
  tva               numeric(10,2) not null,
  prix_ttc          numeric(10,2) not null,
  devise            text not null default 'EUR',
  lignes            jsonb default '[]',
  created_at        timestamptz not null default now(),
  envoye_le         timestamptz,
  statut            statut_devis not null default 'brouillon',
  pdf_url           text,
  valide_par_humain boolean not null default false,
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- TABLE RELANCES
-- ============================================================

create table relances (
  id                uuid primary key default uuid_generate_v4(),
  demande_id        uuid not null references demandes(id) on delete cascade,
  type              text not null check (type in ('relance_1', 'relance_2')),
  date_programmee   timestamptz not null,
  envoyee_le        timestamptz,
  canal             canal_relance not null default 'email',
  template          text,
  statut            statut_relance not null default 'programmee',
  created_at        timestamptz not null default now()
);

-- ============================================================
-- TABLE LOGS (observabilité agent IA)
-- ============================================================

create table logs (
  id            uuid primary key default uuid_generate_v4(),
  demande_id    uuid references demandes(id) on delete set null,
  action        text not null,
  outil_utilise text,
  tokens_in     integer default 0,
  tokens_out    integer default 0,
  cout_eur      numeric(10,6) default 0,
  erreur        text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INDEX utiles
-- ============================================================

create index idx_demandes_statut       on demandes(statut);
create index idx_demandes_client_id    on demandes(client_id);
create index idx_devis_demande_id      on devis(demande_id);
create index idx_relances_demande_id   on relances(demande_id);
create index idx_relances_programmee   on relances(date_programmee) where statut = 'programmee';
create index idx_logs_demande_id       on logs(demande_id);
create index idx_logs_created_at       on logs(created_at);

-- ============================================================
-- Row Level Security (RLS) - à activer pour la prod
-- ============================================================

alter table clients  enable row level security;
alter table demandes enable row level security;
alter table matrices enable row level security;
alter table devis    enable row level security;
alter table relances enable row level security;
alter table logs     enable row level security;

-- Politique permissive pour le service role (agent IA / backend)
-- Le frontend public n'a pas accès direct

create policy "service_role_all" on clients  for all using (auth.role() = 'service_role');
create policy "service_role_all" on demandes for all using (auth.role() = 'service_role');
create policy "service_role_all" on matrices for all using (auth.role() = 'service_role');
create policy "service_role_all" on devis    for all using (auth.role() = 'service_role');
create policy "service_role_all" on relances for all using (auth.role() = 'service_role');
create policy "service_role_all" on logs     for all using (auth.role() = 'service_role');

-- ============================================================
-- Données de test : matrices tarifaires de base
-- ============================================================

insert into matrices (nom_vehicule, capacite_min, capacite_max, prix_par_km, prix_minimum, coefficient_saison, coefficient_urgence, tva) values
  ('Minibus 9 places',   1,  9,  2.50, 150.00, 1.00, 1.00, 0.10),
  ('Car 30 places',     10, 30,  3.80, 400.00, 1.00, 1.00, 0.10),
  ('Car 50 places',     31, 50,  5.20, 600.00, 1.00, 1.00, 0.10),
  ('Grand car 70 places', 51, 70, 6.50, 800.00, 1.00, 1.00, 0.10);
