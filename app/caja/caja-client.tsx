"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { validatePayment, verifyOperation, type PaymentView, type VerifyResult } from "./actions";

const money = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
const time = (d: string) => new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
const dt = (d: string) => new Date(d).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-AR";
  window.speechSynthesis.speak(u);
}

function spoken(p: PaymentView) {
  const pesos = Math.floor(p.amount);
  const cents = Math.round((p.amount - pesos) * 100);
  const amount = `${pesos.toLocaleString("es-AR")} pesos${cents ? ` con ${cents} centavos` : ""}`;
  return `Ingresó una transferencia de ${amount} de ${p.senderName || "un cliente"}`;
}

export function CajaClient({ ocr }: { ocr: boolean }) {
  const [payments, setPayments] = useState<PaymentView[]>([]);
  const [voice, setVoice] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [op, setOp] = useState("");
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [pending, start] = useTransition();

  const seen = useRef<Set<string>>(new Set());
  const first = useRef(true);
  const voiceRef = useRef(false);
  voiceRef.current = voice;

  const tick = useCallback(async () => {
    try {
      const r = await fetch("/api/caja/feed", { cache: "no-store" });
      if (r.status === 401) {
        window.location.href = "/caja/login";
        return;
      }
      if (r.status === 402) {
        const j = await r.json();
        setBlocked(j.error ?? "Servicio suspendido");
        return;
      }
      const j: { payments: PaymentView[] } = await r.json();
      const fresh = j.payments.filter((p) => !seen.current.has(p.id));
      fresh.forEach((p) => seen.current.add(p.id));
      if (!first.current && voiceRef.current) {
        fresh.filter((p) => p.status === "DISPONIBLE").reverse().forEach((p) => speak(spoken(p)));
      }
      first.current = false;
      setPayments(j.payments);
    } catch {
      /* sin conexión: reintenta en el próximo ciclo */
    }
  }, []);

  useEffect(() => {
    tick();
    const t = setInterval(tick, 3000);
    return () => clearInterval(t);
  }, [tick]);

  function validate(id: string) {
    start(async () => {
      const r = await validatePayment(id);
      if (r.ok) setMsg({ type: "ok", text: "Pago validado. Podés entregar." });
      else setMsg({ type: "err", text: r.error + (r.usedAt ? ` (validado ${dt(r.usedAt)})` : "") });
      setVerify(null);
      tick();
    });
  }

  function check() {
    start(async () => {
      setMsg(null);
      setVerify(await verifyOperation(op));
    });
  }

  if (blocked) {
    return <p className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">{blocked} Avisale al dueño del comercio.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-sm text-white/70">Aviso por voz de cada cobro</p>
        <button
          onClick={() => {
            const next = !voice;
            setVoice(next);
            if (next) speak("Aviso por voz activado");
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${voice ? "bg-[#00D6A0] text-[#050B12]" : "border border-white/20"}`}
        >
          {voice ? "Voz activada" : "Activar voz"}
        </button>
      </div>

      {msg && (
        <p className={`rounded-xl p-3 font-semibold ${msg.type === "ok" ? "bg-[#00D6A0]/20 text-[#00D6A0]" : "bg-red-500/20 text-red-300"}`}>
          {msg.text}
        </p>
      )}

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-semibold">Verificar comprobante del cliente</h2>
        <p className="text-xs text-white/60">Pedile el número de operación que figura en su comprobante.</p>
        <div className="mt-2 flex gap-2">
          <input
            value={op}
            onChange={(e) => setOp(e.target.value)}
            inputMode="numeric"
            placeholder="N° de operación"
            className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-mono outline-none focus:border-[#00D6A0]"
          />
          <button onClick={check} disabled={pending || op.trim().length < 6} className="rounded-lg bg-[#00D6A0] px-4 font-semibold text-[#050B12] disabled:opacity-50">
            Verificar
          </button>
        </div>
        {ocr && <p className="mt-2 text-xs text-white/40">Escáner por cámara (OCR): próximamente en esta versión.</p>}

        {verify && "error" in verify && <p className="mt-3 text-red-300">{verify.error}</p>}
        {verify && "found" in verify && !verify.found && (
          <p className="mt-3 rounded-lg bg-red-500/20 p-3 font-semibold text-red-300">
            NO ENCONTRADO: ese pago no figura en tu cuenta. Puede ser un comprobante falso o todavía no llegó. No entregues.
          </p>
        )}
        {verify && "found" in verify && verify.found && verify.payment.status === "VALIDADO" && (
          <p className="mt-3 rounded-lg bg-red-500/20 p-3 font-semibold text-red-300">
            COMPROBANTE YA USADO ({verify.payment.validatedAt ? dt(verify.payment.validatedAt) : "antes"}). No entregues.
          </p>
        )}
        {verify && "found" in verify && verify.found && verify.payment.status === "DISPONIBLE" && (
          <div className="mt-3 rounded-lg bg-[#00D6A0]/15 p-3">
            <p className="font-semibold text-[#00D6A0]">ACREDITADO: {money(verify.payment.amount)} de {verify.payment.senderName}</p>
            <button onClick={() => validate(verify.payment.id)} disabled={pending} className="mt-2 rounded-lg bg-[#00D6A0] px-4 py-2 font-semibold text-[#050B12]">
              Validar y entregar
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Ingresos recientes</h2>
        {payments.length === 0 && <p className="text-white/50">Esperando transferencias...</p>}
        {payments.map((p) => (
          <div
            key={p.id}
            className={`flex items-center justify-between rounded-xl border p-4 ${
              p.status === "DISPONIBLE" ? "border-[#00D6A0]/60 bg-[#00D6A0]/10" : "border-white/10 bg-white/5 opacity-60"
            }`}
          >
            <div>
              <p className="text-2xl font-bold">{money(p.amount)}</p>
              <p className="text-sm text-white/70">{p.senderName || "Remitente no identificado"} · {time(p.receivedAt)}</p>
              <p className="font-mono text-xs text-white/40">Op. {p.externalId}</p>
            </div>
            {p.status === "DISPONIBLE" ? (
              <button onClick={() => validate(p.id)} disabled={pending} className="rounded-lg bg-[#00D6A0] px-4 py-3 font-semibold text-[#050B12] disabled:opacity-60">
                Validar y entregar
              </button>
            ) : (
              <span className="text-sm text-white/60">Validado</span>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
