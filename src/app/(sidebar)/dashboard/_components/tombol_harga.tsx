"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

function formatRupiah(value: number) {
  return `Rp${numberFormatter.format(value)}`;
}

// 5000 -> "+5k", 15000 -> "+15k"
function formatLabelNominal(nominal: number) {
  return `+${nominal / 1_000}k`;
}

/** Nominal cepat yang paling sering dipakai kasir. */
const nominalCepat = [5_000, 10_000, 15_000, 20_000, 25_000] as const;

type TombolHargaProps = {
  /** Daftar nominal cepat yang ditampilkan. */
  nominal?: readonly number[];
  /** Dipanggil saat salah satu tombol nominal ditekan. */
  onPilihNominal?: (nominal: number) => void;
  /** Dipanggil saat tombol "Lainnya" ditekan, mis. untuk membuka input nominal manual. */
  onLainnya?: () => void;
  className?: string;
};

export function TombolHarga({
  nominal = nominalCepat,
  onPilihNominal,
  onLainnya,
  className,
}: TombolHargaProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3 px-4 pb-6 mt-auto", className)}>
      {nominal.map((nilai) => (
        <Button
          key={nilai}
          type="button"
          variant="secondary"
          onClick={() => onPilihNominal?.(nilai)}
          aria-label={`Tambah penjualan ${formatRupiah(nilai)}`}
          className="h-12 w-full rounded-xl border border-[#F3E2B6] bg-[#FEF6E4] text-sm font-semibold text-[#A16207] shadow-none transition-colors hover:bg-[#FBEACB] hover:text-[#854D0E] focus-visible:border-[#A16207]/40 focus-visible:ring-[#A16207]/30"
        >
          {formatLabelNominal(nilai)}
        </Button>
      ))}

      <Button
        type="button"
        onClick={onLainnya}
        aria-label="Input nominal lainnya"
        className="h-12 w-full rounded-xl bg-[#0C3D2F] text-sm font-bold text-white shadow-none transition-colors hover:bg-[#0A3328] focus-visible:border-[#0C3D2F] focus-visible:ring-[#0C3D2F]/30"
      >
        Lainnya
      </Button>
    </div>
  );
}

