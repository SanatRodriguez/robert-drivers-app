import Link from "next/link";
import { TERMS_SECTIONS, TERMS_UPDATED } from "@/lib/legalContent";

export const metadata = { title: "Términos y Condiciones — Robert's Drivers" };

export default function TerminosPage() {
  return (
    <div className="flex-1 flex flex-col py-4">
      <Link href="/" className="text-sm text-muted mb-4 w-fit">
        ← Volver al inicio
      </Link>
      <p className="text-sm font-mono text-muted mb-1">ROBERT'S DRIVERS</p>
      <h1 className="text-2xl font-extrabold mb-1">Términos y Condiciones</h1>
      <p className="text-[13px] text-muted mb-6">Última actualización: {TERMS_UPDATED}</p>

      <div className="space-y-5">
        {TERMS_SECTIONS.map((s) => (
          <div key={s.title}>
            <h3 className="font-bold text-sm mb-1.5">{s.title}</h3>
            <div className="text-sm text-muted leading-relaxed">{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
