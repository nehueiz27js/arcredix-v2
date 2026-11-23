import { Suspense } from "react";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { PLANS, type PlanId } from "@/lib/plans";
import { money } from "@/lib/format";
import { ActionForm, inputCls } from "@/components/ActionForm";
import { createCommerce, logoutAdmin, resetOwnerPassword, setStatus, updateCommerce } from "./actions";

export const metadata = { title: "Super-admin | ARCREDIX", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <Suspense fallback={<main className="p-8 text-white/60">Cargando...</main>}>
      <AdminContent />
    </Suspense>
  );
}

async function AdminContent() {
  await requireAdmin();

  const commerces = await sql`select c.id, c.name, c.owner_email, c.plan, c.status, c.lifetime, c.expires_at, c.code,
      (select count(*)::int from payments p where p.commerce_id = c.id and p.received_at > now() - interval '30 days') as pay30
    from commerces c order by c.created_at desc`;
  const totals = await sql`select count(*)::int as n, coalesce(sum(amount),0) as total from payments
    where received_at > now() - interval '30 days'`;

  const active = commerces.filter((c) => c.status === "active");
  const mrr = active
    .filter((c) => !c.lifetime)
    .reduce((acc, c) => acc + (PLANS[c.plan as PlanId]?.priceMonthly ?? 0), 0);

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Super-admin</h1>
        <form action={logoutAdmin}>
          <button className="text-sm text-white/70 underline">Cerrar sesión</button>
        </form>
      </header>

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          ["Comercios", String(commerces.length)],
          ["Activos", String(active.length)],
          ["Ingreso mensual (USD)", `USD ${mrr}`],
          ["Operaciones 30 días", String(totals[0].n)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/60">{k}</p>
            <p className="mt-1 text-2xl font-bold text-[#00D6A0]">{v}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="mb-3 font-semibold">Alta rápida de cliente</h2>
        <ActionForm action={createCommerce} submit="Crear comercio">
          <input name="name" required placeholder="Razón social / comercio" className={inputCls} />
          <input name="email" type="email" required placeholder="Email del dueño" className={inputCls} />
          <input name="password" required minLength={8} placeholder="Contraseña temporal" className={inputCls} />
          <select name="plan" defaultValue="starter" className={inputCls}>
            {Object.entries(PLANS).map(([id, p]) => (
              <option key={id} value={id} className="text-black">{p.name}</option>
            ))}
          </select>
          <label className="text-xs text-white/60">
            Vence
            <input name="expires" type="date" className={inputCls + " ml-2"} />
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input name="lifetime" type="checkbox" /> Licencia vitalicia
          </label>
        </ActionForm>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Comercios</h2>
        {commerces.length === 0 && <p className="text-white/60">Todavía no hay comercios.</p>}
        {commerces.map((c) => (
          <div key={c.id as string} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{c.name as string}</p>
                <p className="text-sm text-white/60">
                  {c.owner_email as string} · Código de caja: <span className="font-mono">{c.code as string}</span> · {c.pay30 as number} operaciones (30 d)
                </p>
              </div>
              <form action={setStatus.bind(null, c.id as string, c.status === "active" ? "suspended" : "active")}>
                <button
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                    c.status === "active" ? "bg-red-500/20 text-red-300" : "bg-[#00D6A0]/20 text-[#00D6A0]"
                  }`}
                >
                  {c.status === "active" ? "Suspender" : "Reactivar"}
                </button>
              </form>
            </div>

            <form action={updateCommerce} className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <input type="hidden" name="id" value={c.id as string} />
              <select name="plan" defaultValue={c.plan as string} className={inputCls}>
                {Object.entries(PLANS).map(([id, p]) => (
                  <option key={id} value={id} className="text-black">{p.name}</option>
                ))}
              </select>
              <input
                name="expires"
                type="date"
                defaultValue={c.expires_at ? new Date(c.expires_at as string).toISOString().slice(0, 10) : ""}
                className={inputCls}
              />
              <label className="flex items-center gap-1">
                <input name="lifetime" type="checkbox" defaultChecked={Boolean(c.lifetime)} /> Vitalicia
              </label>
              <button className="rounded-lg border border-white/20 px-3 py-1.5">Guardar plan</button>
            </form>

            <form action={resetOwnerPassword} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <input type="hidden" name="id" value={c.id as string} />
              <input name="password" minLength={8} placeholder="Nueva contraseña del dueño" className={inputCls} />
              <button className="rounded-lg border border-white/20 px-3 py-1.5">Cambiar contraseña</button>
            </form>
          </div>
        ))}
        <p className="text-xs text-white/40">Volumen procesado últimos 30 días: {money(totals[0].total as string)}</p>
      </section>
    </main>
  );
}
