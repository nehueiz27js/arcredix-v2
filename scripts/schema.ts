export const statements = [
  `create table if not exists admins (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    password_hash text not null,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists commerces (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    owner_email text not null unique,
    owner_password_hash text not null,
    plan text not null default 'starter',
    status text not null default 'active',
    lifetime boolean not null default false,
    expires_at timestamptz,
    code text not null unique,
    webhook_token text not null unique,
    mp_access_token_enc text,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists accounts (
    id uuid primary key default gen_random_uuid(),
    commerce_id uuid not null references commerces(id) on delete cascade,
    label text not null,
    alias_cvu text not null,
    provider text not null default 'otro',
    created_at timestamptz not null default now()
  )`,
  `create table if not exists cashiers (
    id uuid primary key default gen_random_uuid(),
    commerce_id uuid not null references commerces(id) on delete cascade,
    name text not null,
    pin_hash text not null,
    active boolean not null default true,
    created_at timestamptz not null default now()
  )`,
  `create table if not exists payments (
    id uuid primary key default gen_random_uuid(),
    commerce_id uuid not null references commerces(id) on delete cascade,
    external_id text not null,
    amount numeric(14,2) not null,
    sender_name text not null default '',
    source text not null,
    status text not null default 'DISPONIBLE',
    received_at timestamptz not null default now(),
    validated_at timestamptz,
    validated_by uuid references cashiers(id) on delete set null,
    unique (commerce_id, external_id)
  )`,
  `create index if not exists idx_payments_commerce on payments (commerce_id, received_at desc)`,
  `create table if not exists login_attempts (
    id bigserial primary key,
    ip text not null,
    scope text not null,
    success boolean not null default false,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists idx_attempts on login_attempts (scope, ip, created_at)`,
];
