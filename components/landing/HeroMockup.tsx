import { QrArt } from "./QrArt";

export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-6 rounded-[2rem] bg-[#00D6A0]/10 blur-3xl" aria-hidden />
      <div className="relative rounded-2xl border border-white/10 bg-[#0A131D] p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          </div>
          <span className="rounded-full bg-[#00D6A0]/15 px-2.5 py-1 text-xs text-[#00D6A0]">Caja 1 · activa</span>
        </div>

        <div className="rounded-xl border border-[#00D6A0]/40 bg-[#00D6A0]/10 p-4">
          <p className="text-xs text-[#A7B4C3]">Pago acreditado</p>
          <p className="mt-1 text-3xl font-extrabold text-white">$ 48.500,00</p>
          <p className="mt-1 text-sm text-[#A7B4C3]">Carlos Benítez · Op. 928374650192</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-[#00D6A0] px-2.5 py-1 font-semibold text-[#050B12]">✓ Verificado</span>
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-white">Comprobante único</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-5 gap-3">
          <div className="col-span-3 space-y-2">
            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-xs text-[#A7B4C3]">Estado de operación</p>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#A7B4C3]">
                <span className="rounded bg-[#00D6A0] px-1.5 py-0.5 font-semibold text-[#050B12]">Recibido</span>
                <span className="h-px flex-1 bg-[#00D6A0]" />
                <span className="rounded bg-[#00D6A0] px-1.5 py-0.5 font-semibold text-[#050B12]">Acreditado</span>
                <span className="h-px flex-1 bg-white/20" />
                <span className="rounded border border-white/20 px-1.5 py-0.5">Entregado</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-xs text-[#A7B4C3]">Seguridad</p>
              <p className="mt-1 text-sm text-white">Reuso de comprobante: <span className="text-[#00D6A0]">bloqueado</span></p>
            </div>
          </div>
          <div className="col-span-2 flex flex-col items-center justify-center rounded-xl border border-white/10 p-3">
            <QrArt size={84} />
            <p className="mt-2 text-center text-[10px] text-[#A7B4C3]">QR de cobro</p>
          </div>
        </div>
      </div>
    </div>
  );
}
