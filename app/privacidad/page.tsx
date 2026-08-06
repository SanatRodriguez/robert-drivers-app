import Link from "next/link";
import { PRIVACY_SECTIONS, PRIVACY_UPDATED } from "@/lib/legalContent";

export const metadata = { title: "Política de Privacidad — Robert's Drivers" };

export default function PrivacidadPage() {
  return (
    <div className="flex-1 flex flex-col py-4">
      <Link href="/" className="text-sm text-muted mb-4 w-fit">
        ← Volver al inicio
      </Link>
      <p className="text-sm font-mono text-muted mb-1">ROBERT'S DRIVERS</p>
      <h1 className="text-2xl font-extrabold mb-1">Política de Privacidad</h1>
      <p className="text-[13px] text-muted mb-6">Última actualización: {PRIVACY_UPDATED}</p>

      <div className="space-y-5">
        {PRIVACY_SECTIONS.map((s) => (
          <div key={s.title}>
            <h3 className="font-bold text-sm mb-1.5">{s.title}</h3>
            <div className="text-sm text-muted leading-relaxed">{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
