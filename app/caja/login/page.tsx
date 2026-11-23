"use client";

import { useActionState } from "react";
import { loginCashier } from "./actions";
import { inputCls } from "@/components/ActionForm";

export default function CashierLogin() {
  const [state, action, pending] = useActionState(loginCashier, undefined);
  return (
    <main className="mx-auto max-w-sm p-8 pt-24">
      <h1 className="text-2xl font-bold">Caja</h1>
      <p className="mt-1 text-sm text-white/60">Ingresá el código de tu comercio y tu PIN.</p>
      <form action={action} className="mt-6 space-y-3">
        <input name="code" required autoComplete="off" placeholder="Código del comercio" className={inputCls + " w-full font-mono uppercase"} />
        <input name="pin" required inputMode="numeric" maxLength={4} type="password" placeholder="PIN (4 dígitos)" className={inputCls + " w-full"} />
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <button disabled={pending} className="w-full rounded-lg bg-[#00D6A0] p-3 font-semibold text-[#050B12] disabled:opacity-60">
          {pending ? "Verificando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
