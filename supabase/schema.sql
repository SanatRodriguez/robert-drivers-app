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
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone');
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
  is_active boolean not null default true,
  seats integer
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

-- ============================================================
-- MIGRACIÓN — galería (Eventos/Full day), servicio bloqueado y
-- bloqueo de login por intentos fallidos. Ya corrida en Supabase.
-- ============================================================
alter table public.service_items add column if not exists image_url text;
alter table public.service_items add column if not exists location text;

alter table public.services add column if not exists coming_soon boolean not null default false;

insert into public.services (name, slug, description, icon, is_active, sort_order, coming_soon)
select 'Traslado Exclusivo', 'traslado-exclusivo', 'Servicio premium — disponible pronto.', '⭐', true, 5, true
where not exists (select 1 from public.services where slug = 'traslado-exclusivo');

-- Bloqueo de cuenta tras 5 intentos fallidos de login, por 1 hora.
-- Solo se toca via las funciones SECURITY DEFINER de abajo — sin RLS
-- de acceso directo para clientes.
create table if not exists public.login_attempts (
  email text primary key,
  failed_count int not null default 0,
  locked_until timestamptz
);
alter table public.login_attempts enable row level security;

create or replace function public.check_login_lock(p_email text)
returns timestamptz
language sql
security definer
set search_path = public
as $$
  select locked_until from public.login_attempts
  where email = lower(p_email) and locked_until > now();
$$;

create or replace function public.register_failed_login(p_email text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_locked_until timestamptz;
begin
  insert into public.login_attempts (email, failed_count)
  values (lower(p_email), 1)
  on conflict (email) do update
    set failed_count = case
          when public.login_attempts.locked_until is not null and public.login_attempts.locked_until <= now()
            then 1
          else public.login_attempts.failed_count + 1
        end,
        locked_until = case
          when public.login_attempts.locked_until is not null and public.login_attempts.locked_until <= now()
            then null
          else public.login_attempts.locked_until
        end
  returning failed_count into v_count;

  if v_count >= 5 then
    update public.login_attempts
      set locked_until = now() + interval '1 hour'
      where email = lower(p_email)
      returning locked_until into v_locked_until;
  end if;

  return v_locked_until;
end;
$$;

create or replace function public.clear_login_attempts(p_email text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.login_attempts where email = lower(p_email);
$$;

grant execute on function public.check_login_lock(text) to anon, authenticated;
grant execute on function public.register_failed_login(text) to anon, authenticated;
grant execute on function public.clear_login_attempts(text) to anon, authenticated;

-- Bucket de Storage para las fotos de eventos/paquetes (lectura pública,
-- escritura solo admin).
insert into storage.buckets (id, name, public)
select 'service-images', 'service-images', true
where not exists (select 1 from storage.buckets where id = 'service-images');

create policy "service-images: lectura publica"
  on storage.objects for select
  using (bucket_id = 'service-images');

create policy "service-images: solo admin escribe"
  on storage.objects for insert
  with check (bucket_id = 'service-images' and public.is_admin());

create policy "service-images: solo admin actualiza"
  on storage.objects for update
  using (bucket_id = 'service-images' and public.is_admin());

create policy "service-images: solo admin borra"
  on storage.objects for delete
  using (bucket_id = 'service-images' and public.is_admin());

-- ============================================================
-- Notificaciones push al admin cuando llega una reserva nueva.
-- Llaves VAPID generadas aparte, guardadas en el Edge Function
-- "notify-new-booking" (Supabase no permite ver secrets de funciones
-- desde aqui, asi que no se repiten en este archivo).
-- ============================================================
create extension if not exists pg_net;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: admin gestiona las propias"
  on public.push_subscriptions for all
  using (admin_id = auth.uid() and public.is_admin())
  with check (admin_id = auth.uid() and public.is_admin());

-- Dispara el Edge Function via pg_net cada vez que se crea una reserva.
create or replace function public.notify_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service_name text;
  v_client_name text;
begin
  select name into v_service_name from public.services where id = new.service_id;
  select full_name into v_client_name from public.profiles where id = new.client_id;

  perform net.http_post(
    url := 'https://ovsnugnxayytlomrvyvz.supabase.co/functions/v1/notify-new-booking',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'TU_ANON_KEY_AQUI' -- ver .env.local
    ),
    body := jsonb_build_object(
      'ticket_code', new.ticket_code,
      'service_name', v_service_name,
      'client_name', v_client_name
    )
  );
  return new;
end;
$$;

create trigger trg_notify_new_booking
  after insert on public.bookings
  for each row execute procedure public.notify_new_booking();

-- ============================================================
-- Aceptacion de Terminos y Politica de Privacidad al registrarse
-- (solo aplica a registros nuevos, no retroactivo).
-- ============================================================
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, terms_accepted_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    case
      when new.raw_user_meta_data ->> 'terms_accepted_at' is not null
        then (new.raw_user_meta_data ->> 'terms_accepted_at')::timestamptz
      else null
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Cola de conductores por evento (gestion manual desde el admin).
-- Cada evento crea su propia cola con nombre; queue_entries guarda
-- tanto el "pool" de participantes del evento como el orden en vivo
-- de la fila (position solo se usa cuando status = 'waiting').
-- ============================================================
create table public.driver_queues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.driver_queues(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  status text not null default 'pool' check (status in ('pool','waiting','completed','removed')),
  position integer,
  created_at timestamptz not null default now(),
  unique (queue_id, driver_id)
);

alter table public.driver_queues enable row level security;
alter table public.queue_entries enable row level security;

create policy "driver_queues: solo admin"
  on public.driver_queues for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "queue_entries: solo admin"
  on public.queue_entries for all
  using (public.is_admin())
  with check (public.is_admin());
