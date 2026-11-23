"use client";

import { useState } from "react";

const SAMPLES = [
  { amount: 15000, who: "María González" },
  { amount: 48500, who: "Carlos Benítez" },
  { amount: 7250.5, who: "Lucía Fernández" },
  { amount: 126000, who: "Distribuidora Del Sur" },
];

export function VoiceDemo() {
  const [n, setN] = useState<number | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  function play() {
    const i = n === null ? 0 : (n + 1) % SAMPLES.length;
    setN(i);
    const s = SAMPLES[i];
    if (!("speechSynthesis" in window)) {
      setUnsupported(true);
      return;
    }
    const pesos = Math.floor(s.amount);
    const cents = Math.round((s.amount - pesos) * 100);
    const text = `Ingresó una transferencia de ${pesos.toLocaleString("es-AR")} pesos${cents ? ` con ${cents} centavos` : ""} de ${s.who}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-AR";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  const s = n === null ? null : SAMPLES[n];
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[#00D6A0]/30 bg-white/5 p-5 text-center">
      <p className="text-sm text-white/60">Simulador de caja</p>
      <div className="my-4 min-h-24 rounded-xl border border-[#00D6A0]/50 bg-[#00D6A0]/10 p-4">
        {s ? (
          <>
            <p className="text-3xl font-bold text-[#00D6A0]">
              {s.amount.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
            </p>
            <p className="mt-1 text-white/80">{s.who} · acreditado</p>
          </>
        ) : (
          <p className="pt-5 text-white/50">Tocá el botón para escuchar un cobro</p>
        )}
      </div>
      <button onClick={play} className="w-full rounded-lg bg-[#00D6A0] px-4 py-3 font-semibold text-[#050B12]">
        Escuchar cómo suena un cobro
      </button>
      {unsupported && <p className="mt-2 text-xs text-white/50">Tu navegador no soporta voz. Probá con Chrome o Safari.</p>}
    </div>
  );
}
