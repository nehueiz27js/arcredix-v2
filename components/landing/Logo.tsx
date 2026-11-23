import Image from "next/image";

export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image src="/arcredix-isotipo.png" alt="" width={size} height={size} priority />
      <span className="text-xl font-extrabold italic tracking-tight text-white">
        ARCREDI<span className="text-[#00D6A0]">X</span>
      </span>
    </span>
  );
}
