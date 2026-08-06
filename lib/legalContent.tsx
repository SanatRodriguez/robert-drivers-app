import type { ReactNode } from "react";

type Section = { title: string; body: ReactNode };

export const TERMS_UPDATED = "04 de agosto de 2026";
export const PRIVACY_UPDATED = "04 de agosto de 2026";

export const TERMS_SECTIONS: Section[] = [
  {
    title: "1. Sobre el servicio",
    body: "Robert's Drivers es una plataforma para solicitar servicios de transporte privado en Lima, Perú: traslados, chofer de reemplazo, transporte para eventos y días completos. La app facilita la coordinación entre tú y Robert, quien gestiona la asignación de conductores. La confirmación final de cada servicio se realiza por WhatsApp.",
  },
  {
    title: "2. Registro y cuenta",
    body: "Para reservar necesitas crear una cuenta con tu nombre, correo, celular y contraseña. Eres responsable de mantener tu contraseña en privado y de que los datos que registras sean correctos. Debes ser mayor de 18 años para usar la app.",
  },
  {
    title: "3. Reservas",
    body: "Cada reserva genera un código de ticket único, que sirve para verificar que quien te contacta como conductor es realmente quien Robert asignó. Puedes editar o cancelar una reserva mientras esté en estado \"pendiente\"; una vez confirmada, cualquier cambio se coordina directamente por WhatsApp.",
  },
  {
    title: "4. Pagos",
    body: "El pago por adelantado es voluntario. Los métodos disponibles (Yape, efectivo, tarjeta) se coordinan según el servicio. Robert's Drivers no procesa pagos con tarjeta directamente dentro de la app.",
  },
  {
    title: "5. Conductores",
    body: "Los conductores que aparecen en la app son verificados por Robert. La app no garantiza la disponibilidad inmediata de un conductor específico — la asignación depende de la disponibilidad al momento de tu reserva.",
  },
  {
    title: "6. Responsabilidad",
    body: "Robert's Drivers facilita la coordinación del servicio; el transporte lo presta el conductor asignado. Ante cualquier incidente durante el servicio, contáctanos de inmediato por WhatsApp.",
  },
  {
    title: "7. Cambios a estos términos",
    body: "Podemos actualizar estos términos. Si hay cambios importantes, te lo haremos saber dentro de la app.",
  },
];

export const PRIVACY_SECTIONS: Section[] = [
  {
    title: "1. Qué datos recopilamos",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Datos de registro: nombre, correo electrónico, número de celular.</li>
        <li>
          Datos de ubicación: direcciones guardadas y coordenadas de origen/destino que ingresas
          al reservar un servicio (usamos Google Maps para esto).
        </li>
        <li>Datos de uso: historial de reservas y estado de tus viajes.</li>
        <li>
          Si subes un comprobante de pago, esa imagen se guarda de forma privada, visible solo
          para ti y para Robert.
        </li>
      </ul>
    ),
  },
  {
    title: "2. Para qué usamos tus datos",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Coordinar y confirmar tus reservas.</li>
        <li>Verificar la identidad del conductor asignado a través del código de ticket.</li>
        <li>Contactarte por WhatsApp sobre tu servicio.</li>
        <li>
          Proteger tu cuenta — por ejemplo, el bloqueo temporal tras varios intentos fallidos de
          inicio de sesión.
        </li>
      </ul>
    ),
  },
  {
    title: "3. Con quién compartimos tu información",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>
          Con el conductor asignado a tu servicio: solo el detalle necesario para completar el
          viaje (origen, destino y tu nombre).
        </li>
        <li>
          Con Google, al usar el mapa y el autocompletado de direcciones (sujeto a la política de
          privacidad de Google).
        </li>
        <li>No vendemos ni compartimos tu información con terceros con fines publicitarios.</li>
      </ul>
    ),
  },
  {
    title: "4. Dónde se guardan tus datos",
    body: "Tus datos se almacenan de forma segura en Supabase (infraestructura en la nube), con acceso restringido: cada cliente solo puede ver su propia información, y Robert, como administrador, accede solo a lo necesario para operar el servicio.",
  },
  {
    title: "5. Tus derechos",
    body: "De acuerdo con la Ley N° 29733 (Ley de Protección de Datos Personales del Perú), puedes solicitar en cualquier momento acceder a tus datos, corregirlos, cancelarlos u oponerte a su uso. Escríbenos por WhatsApp para ejercer estos derechos.",
  },
  {
    title: "6. Seguridad",
    body: "Tu contraseña se guarda cifrada — nunca la vemos en texto plano. Tu cuenta se bloquea temporalmente después de varios intentos fallidos de inicio de sesión para protegerte de accesos no autorizados.",
  },
  {
    title: "7. Cambios a esta política",
    body: "Podemos actualizar esta política. Si hay cambios importantes, te lo haremos saber dentro de la app.",
  },
];
