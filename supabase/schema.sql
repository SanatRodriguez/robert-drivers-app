-- ============================================================
-- Robert's Drivers — Schema Fase 1
-- Pegar completo en Supabase → SQL Editor → Run
-- ============================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client','admin','driver')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

-- Crea el profile automáticamente cuando alguien se registra
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Función helper para políticas RLS (evita recursión)
create function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ---------- SERVICES ----------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- ---------- SERVICE ITEMS (paquetes / eventos / zonas) ----------
create table public.service_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  name text not null,
  description text,
  price numeric,
  event_date timestamptz,
  is_active boolean not null default true,
  sort_order int not null default 0
);

-- ---------- AVAILABILITY ----------
create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  managed_by uuid references public.profiles(id),
  date date not null,
  is_available boolean not null default true,
  note text
);

-- ---------- CLIENT LOCATIONS ----------
create table public.client_locations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  address_text text not null,
  lat numeric,
  lng numeric,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- DRIVERS ----------
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id), -- se llena en Fase 2
  full_name text not null,
  car_model text,
  car_color text,
  plate text,
  phone text,
  photo_url text,
  is_active boolean not null default true
);

-- Vista pública segura: sin teléfono del conductor
create view public.driver_public_info as
  select id, full_name, car_model, car_color, plate, photo_url
  from public.drivers
  where is_active = true;

-- ---------- BOOKINGS ----------
create sequence public.booking_ticket_seq start 1; -- ya no se usa para el ticket_code, ver más abajo

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique default ('RD-' || upper(substring(md5(gen_random_uuid()::text) from 1 for 6))),
  client_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id),
  service_item_id uuid references public.service_items(id),
  form_data jsonb not null default '{}'::jsonb,
  origin_location jsonb,
  destination_location jsonb,
  scheduled_for timestamptz,
  wants_advance_payment boolean not null default false,
  payment_method text check (payment_method in ('yape','efectivo','tarjeta_pos')),
  payment_proof_url text,
  status text not null default 'pending'
    check (status in ('pending','payment_uploaded','confirmed','assigned','completed','cancelled')),
  driver_id uuid references public.drivers(id),
  can_edit_until timestamptz,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- BOOKING EVENTS ----------
create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.service_items enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.client_locations enable row level security;
alter table public.drivers enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;

-- PROFILES
create policy "profiles: ver la propia o admin ve todas"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles: editar la propia"
  on public.profiles for update
  using (auth.uid() = id);

-- SERVICES (lectura pública, escritura admin)
create policy "services: lectura publica"
  on public.services for select
  using (true);

create policy "services: solo admin escribe"
  on public.services for all
  using (public.is_admin())
  with check (public.is_admin());

-- SERVICE ITEMS
create policy "service_items: lectura publica"
  on public.service_items for select
  using (true);

create policy "service_items: solo admin escribe"
  on public.service_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- AVAILABILITY
create policy "availability: lectura publica"
  on public.availability_blocks for select
  using (true);

create policy "availability: solo admin escribe"
  on public.availability_blocks for all
  using (public.is_admin())
  with check (public.is_admin());

-- CLIENT LOCATIONS (solo el dueño)
create policy "client_locations: solo el dueño"
  on public.client_locations for all
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- DRIVERS (solo admin ve la tabla completa; el resto usa driver_public_info)
create policy "drivers: solo admin"
  on public.drivers for all
  using (public.is_admin())
  with check (public.is_admin());

-- BOOKINGS
create policy "bookings: cliente ve las propias, admin ve todas"
  on public.bookings for select
  using (client_id = auth.uid() or public.is_admin());

create policy "bookings: cliente crea las propias"
  on public.bookings for insert
  with check (client_id = auth.uid());

create policy "bookings: cliente edita mientras esta pending, admin siempre"
  on public.bookings for update
  using (
    public.is_admin()
    or (client_id = auth.uid() and status = 'pending')
  )
  with check (
    public.is_admin()
    or (client_id = auth.uid() and status in ('pending','cancelled'))
  );

-- BOOKING EVENTS
create policy "booking_events: ver si es dueño de la reserva o admin"
  on public.booking_events for select
  using (
    public.is_admin()
    or exists (select 1 from public.bookings b where b.id = booking_id and b.client_id = auth.uid())
  );

create policy "booking_events: insertar si es dueño o admin"
  on public.booking_events for insert
  with check (
    public.is_admin()
    or exists (select 1 from public.bookings b where b.id = booking_id and b.client_id = auth.uid())
  );

-- ============================================================
-- DATOS INICIALES — los 4 servicios
-- ============================================================
insert into public.services (name, slug, description, icon, sort_order) values
  ('Traslados', 'traslados', 'Aeropuerto, playas del sur, distritos de Lima.', '📍', 1),
  ('Eventos', 'eventos', 'Transporte oficial para conciertos y fiestas.', '🎫', 2),
  ('Chofer de reemplazo', 'chofer-reemplazo', 'Tú y tu auto, seguros a casa.', '🔑', 3),
  ('Full day', 'full-day', 'Un chofer todo el día, a tu ritmo.', '☀️', 4);

-- Zonas de Chofer de reemplazo (con precio)
insert into public.service_items (service_id, name, price)
  select id, 'Lima', 150 from public.services where slug = 'chofer-reemplazo'
  union all
  select id, 'Miraflores y Callao', 250 from public.services where slug = 'chofer-reemplazo'
  union all
  select id, 'Playas Sur Chico', 100 from public.services where slug = 'chofer-reemplazo';

-- Evento inicial
insert into public.service_items (service_id, name, price, event_date)
  select id, 'Cochinola — El Regreso a la Tierra Prometida', null, '2026-08-22 18:00:00-05'
  from public.services where slug = 'eventos';

-- ============================================================
-- PARA CONVERTIR TU USUARIO EN ADMIN (correr después de registrarte
-- una vez en la app con tu correo):
-- update public.profiles set role = 'admin' where id =
--   (select id from auth.users where email = 'TU_CORREO_AQUI');
-- ============================================================
