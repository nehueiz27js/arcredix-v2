import { Suspense } from "react";
import { requireCashier } from "@/lib/session";
import { logoutCashier } from "./actions";
import { CajaClient } from "./caja-client";

export const metadata = { title: "Caja | ARCREDIX", robots: { index: false, follow: false } };

export default function CajaPage() {
  return (
    <Suspense fallback={<main className="p-8 text-white/60">Cargando...</main>}>
      <CajaContent />
    </Suspense>
  );
}

async function CajaContent() {
  const { cashier, commerce } = await requireCashier();

  if (commerce.blocked) {
    return (
      <main className="mx-auto max-w-xl p-8 pt-24 text-center">
        <h1 className="text-2xl font-bold">{commerce.name}</h1>
        <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">
          {commerce.blockReason} Avisale al dueño del comercio para renovar el servicio.
        </p>
        <form action={logoutCashier} className="mt-6">
          <button className="text-sm text-white/70 underline">Salir</button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{commerce.name}</h1>
          <p className="text-xs text-white/60">Cajero: {cashier.name}</p>
        </div>
        <form action={logoutCashier}>
          <button className="text-sm text-white/70 underline">Salir</button>
        </form>
      </header>
      <CajaClient ocr={commerce.plan.ocr} />
    </main>
  );
}
