"use client";

import { useActionState, useRef, type ReactNode } from "react";

export type FormResult = { ok?: string; error?: string } | undefined;

export function ActionForm({
  action,
  children,
  submit,
  resetOnOk = true,
  className = "",
}: {
  action: (prev: FormResult, fd: FormData) => Promise<FormResult>;
  children: ReactNode;
  submit: string;
  resetOnOk?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: FormResult, fd: FormData) => {
    const r = await action(prev, fd);
    if (r?.ok && resetOnOk) ref.current?.reset();
    return r;
  }, undefined);

  return (
    <form ref={ref} action={formAction} className={className}>
      <div className="flex flex-wrap items-end gap-2">
        {children}
        <button disabled={pending} className="rounded-lg bg-[#00D6A0] px-4 py-2 font-semibold text-[#050B12] disabled:opacity-60">
          {pending ? "..." : submit}
        </button>
      </div>
      {state?.error && <p className="mt-2 text-sm text-red-400">{state.error}</p>}
      {state?.ok && <p className="mt-2 text-sm text-[#00D6A0]">{state.ok}</p>}
    </form>
  );
}

export const inputCls =
  "rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 outline-none focus:border-[#00D6A0]";
