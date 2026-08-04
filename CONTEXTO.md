# Contexto — Robert's Drivers

> Dale este archivo a Claude Code al empezar una sesión nueva. Resume todo lo
> construido hasta ahora en Claude.ai, para que no haya que re-explicar nada.

## Qué es
App de reservas para "Robert's Drivers", negocio de transporte privado en Lima, Perú
(traslados, eventos, chofer de reemplazo, full day). Next.js 14 (App Router) +
Supabase (Postgres + Auth + RLS) + Vercel. Desplegada en:
https://robert-drivers-app.vercel.app

## Estado por fase

**✅ Fase 1 — Cimientos: completa**
Login/registro (correo+contraseña), home con los 4 servicios desde base de datos,
esquema completo con RLS (`supabase/schema.sql`), formularios fijos por servicio.

**🟡 Fase 2 — Reserva y pago: parcial**
- ✅ Flujo de reserva completo con `ticket_code` aleatorio (`RD-XXXXXX`)
- ✅ WhatsApp se abre automático al terminar cada pedido (`lib/whatsapp.ts`)
- ✅ Direcciones guardadas por cliente (`lib/locations.ts`, `components/LocationField.tsx`) — **sin autocompletado de Google Maps todavía**, sigue siendo texto libre + reutilización de direcciones guardadas
- ❌ Comprobante de pago por Yape — falta la pantalla de subir captura
- ❌ Disponibilidad/agenda para Full day — la tabla `availability_blocks` existe pero nada la usa
- ❌ Conductores con cuenta propia

**🟡 Fase 3 — Panel de Robert: arrancado**
- ✅ `/admin` — lista de reservas
- ✅ `/admin/reservas/[id]` — detalle + cambiar estado + asignar conductor
- ❌ CRUD de servicios, precios/zonas, conductores, disponibilidad (todo eso sigue siendo directo por SQL)

**⬜ Fase 4 — Pulido: sin empezar**
Reportes, y evaluar si conviene pasar las preguntas de cada servicio (`service_fields`)
a base de datos en vez de hardcodeadas en cada page.tsx.

## Decisiones de arquitectura ya tomadas
- Roles: `client`, `admin`, `driver` (driver aún sin implementar)
- RLS: cliente solo ve sus propias reservas y direcciones; admin ve todo
- `ticket_code` es aleatorio (no secuencial) a propósito — es el mecanismo con el que
  el cliente verifica que quien lo contacta por WhatsApp es el conductor real asignado
- Pago: voluntario, no obligatorio. Métodos: Yape (con comprobante, no implementado),
  efectivo y tarjeta/POS (informativos, coordinados por WhatsApp)
- `service_fields` (preguntas dinámicas en base de datos) se decidió posponer — ver
  sección 4 del documento de arquitectura para el razonamiento

## Pendiente de decisión con el usuario
- Corte exacto de tiempo para que el cliente pueda editar/cancelar una reserva
- Si Traslados mostrará precio estimado más adelante
- Si el pago adelantado será obligatorio para reservas "importantes"

## Asunciones activas (confirmar si algo falla)
- Número de WhatsApp de destino: `51955377609` (en `lib/whatsapp.ts`, `WHATSAPP_NUMBER`)
- Para hacer admin a un usuario: correr en Supabase SQL Editor
  ```sql
  update public.profiles set role = 'admin'
    where id = (select id from auth.users where email = 'correo@ejemplo.com');
  ```
