"use client";

import { useRef, useState } from "react";
import { QrArt } from "./QrArt";

type Op = { id: number; code: string; amount: number; who: string; status: "ACREDITADO" | "VALIDADO" };
type Result = { kind: "ok" | "used" | "missing" | "empty"; text: string };

const SAMPLES = [
  { amount: 15000, who: "María González" },
  { amount: 48500, who: "Carlos Benítez" },
  { amount: 7250.5, who: "Lucía Fernández" },
  { amount: 126000, who: "Distribuidora Del Sur" },
];

const money = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
const fakeCode = () => String(Math.floor(900000000000 + Math.random() * 99999999999));

function speak(op: Op) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const pesos = Math.floor(op.amount);
  const cents = Math.round((op.amount - pesos) * 100);
  const text = `Ingresó una transferencia de ${pesos.toLocaleString("es-AR")} pesos${cents ? ` con ${cents} centavos` : ""} de ${op.who}`;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-AR";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function LiveDemo() {
  const [ops, setOps] = useState<Op[]>([]);
  const [voice, setVoice] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const counter = useRef(0);

  function simulate() {
    const s = SAMPLES[counter.current % SAMPLES.length];
    counter.current += 1;
    const op: Op = { id: counter.current, code: fakeCode(), amount: s.amount, who: s.who, status: "ACREDITADO" };
    setOps((o) => [op, ...o].slice(0, 4));
    setResult(null);
    if (voice) speak(op);
  }

  function validate(id: number) {
    setOps((o) => o.map((x) => (x.id === id ? { ...x, status: "VALIDADO" } : x)));
  }

  function check() {
    const c = code.trim();
    if (c.length < 6) return setResult({ kind: "empty", text: "Ingresá un número de operación." });
    const op = ops.find((x) => x.code === c);
    if (!op) return setResult({ kind: "missing", text: "NO ENCONTRADO: ese pago no figura en tu cuenta. No entregues." });
    if (op.status === "VALIDADO") return setResult({ kind: "used", text: "COMPROBANTE YA USADO. No entregues." });
    setResult({ kind: "ok", text: `ACREDITADO: ${money(op.amount)} de ${op.who}. Podés validar y entregar.` });
  }

  const tone = (k: Result["kind"]) =>
    k === "ok" ? "bg-[#00D6A0]/15 text-[#00D6A0]" : k === "empty" ? "bg-white/10 text-[#A7B4C3]" : "bg-red-500/15 text-red-300";

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="rounded-2xl border border-white/10 bg-[#0A131D] p-5 lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">Caja · ingresos en vivo</h3>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#A7B4C3]">
            <input type="checkbox" checked={voice} onChange={(e) => setVoice(e.target.checked)} className="accent-[#00D6A0]" />
            Aviso por voz
          </label>
        </div>

        <button onClick={simulate} className="mt-4 w-full rounded-lg bg-[#00D6A0] px-4 py-3 font-semibold text-[#050B12] transition-colors hover:bg-[#20E6C0]">
          Simular una transferencia entrante
        </button>

        <div className="mt-4 space-y-3">
          {ops.length === 0 && <p className="py-6 text-center text-sm text-[#A7B4C3]">Esperando transferencias... tocá el botón de arriba.</p>}
          {ops.map((o) => (
            <div key={o.id} className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${o.status === "ACREDITADO" ? "border-[#00D6A0]/50 bg-[#00D6A0]/10" : "border-white/10 bg-white/5 opacity-70"}`}>
              <div>
                <p className="text-xl font-bold">{money(o.amount)}</p>
                <p className="text-sm text-[#A7B4C3]">{o.who}</p>
                <p className="font-mono text-xs text-[#A7B4C3]/70">Op. {o.code}</p>
              </div>
              {o.status === "ACREDITADO" ? (
                <button onClick={() => validate(o.id)} className="shrink-0 rounded-lg bg-[#00D6A0] px-3 py-2 text-sm font-semibold text-[#050B12] hover:bg-[#20E6C0]">
                  Validar y entregar
                </button>
              ) : (
                <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-xs text-[#A7B4C3]">Validado</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5 lg:col-span-2">
        <div className="rounded-2xl border border-white/10 bg-[#0A131D] p-5">
          <h3 className="font-semibold">Verificar un comprobante</h3>
          <p className="mt-1 text-xs text-[#A7B4C3]">Pegá el número de operación que te muestra el cliente.</p>
          <div className="mt-3 flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="N° de operación" inputMode="numeric"
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm outline-none focus:border-[#00D6A0]" />
            <button onClick={check} className="rounded-lg border border-[#00D6A0] px-3 text-sm text-[#00D6A0] hover:bg-[#00D6A0]/10">Verificar</button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <button onClick={() => ops[0] && setCode(ops[0].code)} className="rounded-full border border-white/15 px-2.5 py-1 text-[#A7B4C3] hover:text-white">Usar el último cobro</button>
            <button onClick={() => setCode(fakeCode())} className="rounded-full border border-white/15 px-2.5 py-1 text-[#A7B4C3] hover:text-white">Probar uno inventado</button>
          </div>
          {result && <p className={`mt-3 rounded-lg p-3 text-sm font-semibold ${tone(result.kind)}`}>{result.text}</p>}
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0A131D] p-5">
          <QrArt size={84} />
          <div>
            <h3 className="font-semibold">QR de cobro</h3>
            <p className="mt-1 text-xs text-[#A7B4C3]">Ilustración de cómo se vería el QR del punto de venta.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
