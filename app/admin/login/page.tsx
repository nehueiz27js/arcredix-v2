"use client";

import { useActionState } from "react";
import { loginAdmin } from "./actions";
import { inputCls } from "@/components/ActionForm";

export default function AdminLogin() {
  const [state, action, pending] = useActionState(loginAdmin, undefined);
  return (
    <main className="mx-auto max-w-sm p-8 pt-24">
      <h1 className="text-2xl font-bold">Super-admin</h1>
      <form action={action} className="mt-6 space-y-3">
        <input name="email" type="email" required placeholder="Email" className={inputCls + " w-full"} />
        <input name="password" type="password" required placeholder="Contraseña" className={inputCls + " w-full"} />
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <button disabled={pending} className="w-full rounded-lg bg-[#00D6A0] p-3 font-semibold text-[#050B12] disabled:opacity-60">
          {pending ? "Verificando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
