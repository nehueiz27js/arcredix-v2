import Link from "next/link";
import { Logo } from "@/components/landing/Logo";

export const metadata = { title: "Política de privacidad | ARCREDIX" };

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/" aria-label="Volver al inicio"><Logo /></Link>
      <h1 className="mt-10 text-3xl font-extrabold">Política de privacidad</h1>
      <p className="mt-6 rounded-xl border border-white/10 bg-[#0A131D] p-5 text-[#A7B4C3]">
        Este documento está en preparación. Reemplazá este texto por el contenido legal definitivo de ARCREDIX
        (conviene que lo revise un profesional antes de publicarlo).
      </p>
      <Link href="/" className="mt-8 inline-block text-[#00D6A0] underline">Volver al inicio</Link>
    </main>
  );
}
