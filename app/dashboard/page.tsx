import { Suspense } from "react";
import { headers } from "next/headers";
import { sql } from "@/lib/db";
import { requireOwner } from "@/lib/session";
import { money, dateTime } from "@/lib/format";
import { ActionForm, inputCls } from "@/components/ActionForm";
import {
  addAccount, addCashier, changePassword, deleteAccount, deleteCashier, logoutOwner,
  removeMpToken, saveMpToken, setCashierActive, simulatePayment,
} from "./actions";

export const metadata = { title: "Mi comercio | ARCREDIX", robots: { index: false, follow: false } };

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="p-8 text-white/60">Cargando...</main>}>
      <DashboardContent />
    </Suspense>
  );
}

const card = "rounded-xl border border-white/10 bg-white/5 p-4";

async function DashboardContent() {
  const c = await requireOwner();

  if (c.blocked) {
    return (
      <main className="mx-auto max-w-xl p-8 pt-24 text-center">
        <h1 className="text-2xl font-bold">{c.name}</h1>
        <p className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">
          {c.blockReason} Contactanos para renovar y reactivar tu acceso y el de tus cajas.
        </p>
        <form action={logoutOwner} className="mt-6">
          <button className="text-sm text-white/70 underline">Cerrar sesión</button>
        </form>
      </main>
    );
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "tu-dominio.com";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = `${proto}://${host}`;

  const [accounts, cashiers, payments] = await Promise.all([
    sql`select id, label, alias_cvu, provider from accounts where commerce_id = ${c.id} order by created_at`,
    sql`select id, name, active from cashiers where commerce_id = ${c.id} order by created_at`,
    sql`select external_id, amount, sender_name, source, status, received_at, validated_at
      from payments where commerce_id = ${c.id}
        and (${c.plan.historyDays}::int is null or received_at > now() - (${c.plan.historyDays}::int * interval '1 day'))
      order by received_at desc limit 100`,
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{c.name}</h1>
          <p className="text-sm text-white/60">
            Plan {c.plan.name}
            {c.lifetime ? " · licencia vitalicia" : c.expiresAt ? ` · vence ${c.expiresAt.toLocaleDateString("es-AR")}` : ""}
          </p>
        </div>
        <form action={logoutOwner}>
          <button className="text-sm text-white/70 underline">Cerrar sesión</button>
        </form>
      </header>

      <section className={card}>
        <h2 className="font-semibold">Acceso de tus cajeros</h2>
        <p className="mt-1 text-sm text-white/70">
          Código de comercio: <span className="font-mono text-lg text-[#00D6A0]">{c.code}</span> · entran en{" "}
          <span className="font-mono">{base}/caja/login</span> con ese código y su PIN de 4 dígitos.
        </p>
      </section>

      <section className={card}>
        <h2 className="font-semibold">Cuentas / alias vinculados ({accounts.length}/{c.plan.accounts})</h2>
        <ul className="my-3 space-y-1 text-sm">
          {accounts.map((a) => (
            <li key={a.id as string} className="flex items-center justify-between rounded bg-black/30 px-3 py-2">
              <span>{a.label as string} · <span className="font-mono">{a.alias_cvu as string}</span> ({a.provider as string})</span>
              <form action={deleteAccount.bind(null, a.id as string)}>
                <button className="text-red-300 underline">Quitar</button>
              </form>
            </li>
          ))}
          {accounts.length === 0 && <li className="text-white/50">Todavía no cargaste ninguna.</li>}
        </ul>
        <ActionForm action={addAccount} submit="Agregar">
          <input name="label" required placeholder="Nombre (ej. Mercado Pago)" className={inputCls} />
          <input name="alias" required placeholder="Alias o CVU" className={inputCls} />
          <select name="provider" className={inputCls} defaultValue="mercadopago">
            <option value="mercadopago" className="text-black">Mercado Pago</option>
            <option value="banco" className="text-black">Banco</option>
            <option value="otra" className="text-black">Otra billetera</option>
          </select>
        </ActionForm>
      </section>

      <section className={card}>
        <h2 className="font-semibold">Cajeros con PIN ({cashiers.filter((x) => x.active).length}/{c.plan.cajas} activos)</h2>
        <ul className="my-3 space-y-1 text-sm">
          {cashiers.map((x) => (
            <li key={x.id as string} className="flex items-center justify-between rounded bg-black/30 px-3 py-2">
              <span>{x.name as string} {x.active ? "" : <em className="text-white/50">(desactivado)</em>}</span>
              <span className="flex gap-3">
                <form action={setCashierActive.bind(null, x.id as string, !x.active)}>
                  <button className="underline">{x.active ? "Desactivar" : "Activar"}</button>
                </form>
                <form action={deleteCashier.bind(null, x.id as string)}>
                  <button className="text-red-300 underline">Eliminar</button>
                </form>
              </span>
            </li>
          ))}
          {cashiers.length === 0 && <li className="text-white/50">Todavía no creaste cajeros.</li>}
        </ul>
        <ActionForm action={addCashier} submit="Crear cajero">
          <input name="name" required placeholder="Nombre del cajero" className={inputCls} />
          <input name="pin" required inputMode="numeric" maxLength={4} placeholder="PIN (4 dígitos)" className={inputCls + " w-40"} />
        </ActionForm>
      </section>

      <section className={card}>
        <h2 className="font-semibold">Cómo llegan tus cobros</h2>
        <div className="mt-2 space-y-3 text-sm text-white/80">
          <div>
            <p className="font-medium text-white">1) Mercado Pago {c.hasMp && <span className="text-[#00D6A0]">· vinculado</span>}</p>
            <p>Webhook (Notificaciones &gt; Webhooks, evento &quot;Pagos&quot;):</p>
            <p className="break-all rounded bg-black/40 p-2 font-mono text-xs">{base}/api/webhooks/mercadopago/{c.webhookToken}</p>
            <a href="/api/integrations/mercadopago/connect" className="mt-2 inline-flex rounded-lg bg-[#009ee3] px-4 py-2 font-semibold text-white hover:opacity-90">Vincular cuenta con Mercado Pago</a>
            {c.hasMp ? (
              <form action={removeMpToken} className="mt-2"><button className="text-red-300 underline">Desvincular Mercado Pago</button></form>
            ) : (
              <details className="mt-3"><summary className="cursor-pointer text-xs text-white/50">Vinculación manual (método anterior)</summary><ActionForm action={saveMpToken} submit="Vincular con Access Token" className="mt-2">
                <input name="token" required placeholder="Access Token de producción" className={inputCls + " min-w-72"} />
              </ActionForm></details>
            )}
          </div>
          <div>
            <p className="font-medium text-white">2) Correos del banco (reenvío)</p>
            <p>Configurá el reenvío de las notificaciones bancarias a un servicio de correo entrante que haga POST a:</p>
            <p className="break-all rounded bg-black/40 p-2 font-mono text-xs">{base}/api/inbound/email/{c.webhookToken}</p>
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold">Probar el sistema</h2>
        <p className="mb-2 text-sm text-white/70">Creá una transferencia de prueba: debería aparecer y sonar en la pantalla de caja.</p>
        <ActionForm action={simulatePayment} submit="Simular transferencia">
          <input name="amount" required placeholder="Monto (ej. 15000)" className={inputCls} />
          <input name="sender" placeholder="Remitente (opcional)" className={inputCls} />
        </ActionForm>
      </section>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Historial de comprobantes{c.plan.historyDays ? ` (últimos ${c.plan.historyDays} días)` : ""}</h2>
          <a href="/dashboard/export" className="rounded-lg border border-white/20 px-3 py-1.5 text-sm">Exportar a Excel (CSV)</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-white/60">
              <tr><th className="py-1">Fecha</th><th>N° operación</th><th>Monto</th><th>Remitente</th><th>Origen</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.external_id as string} className="border-t border-white/10">
                  <td className="py-1.5">{dateTime(p.received_at as string)}</td>
                  <td className="font-mono">{p.external_id as string}</td>
                  <td>{money(p.amount as string)}</td>
                  <td>{p.sender_name as string}</td>
                  <td>{p.source as string}</td>
                  <td>
                    <span className={p.status === "VALIDADO" ? "text-white/60" : "font-semibold text-[#00D6A0]"}>{p.status as string}</span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={6} className="py-3 text-white/50">Todavía no hay comprobantes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card}>
        <h2 className="mb-2 font-semibold">Cambiar contraseña</h2>
        <ActionForm action={changePassword} submit="Actualizar">
          <input name="current" type="password" required placeholder="Contraseña actual" className={inputCls} />
          <input name="next" type="password" required minLength={8} placeholder="Nueva contraseña" className={inputCls} />
        </ActionForm>
      </section>
    </main>
  );
}
