import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { WaktuRealtime } from "./waktu_realtime";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

function formatRupiah(value: number) {
  return `${value < 0 ? "-" : ""}Rp${numberFormatter.format(Math.abs(value))}`;
}

type SummaryProps = {
  outlet?: string;
  omzet?: number;
  modal?: number;
  labaBersih?: number;
};

export function Summary({
  outlet = "Batagor",
  omzet = 180_000,
  modal = 200_000,
  labaBersih = omzet - modal,
}: SummaryProps) {
  // Laba bersih negatif berarti rugi, selain itu dianggap untung.
  const untung = labaBersih >= 0;

  const heroBadgeColor = untung ? "text-emerald-600" : "text-red-500";

  return (
    <Card className="gap-0 bg-muted/40 py-0">
      {/* Header hero: ringkasan omzet hari ini */}
      <div className="rounded-b-none bg-[#0C3D2F] px-6 pt-6 pb-6">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate text-white/70">{`Hari ini - ${outlet}`}</span>
          <WaktuRealtime />
        </div>

        <div className="mt-4">
          <p className="text-sm text-white/70">Omzet terkumpul</p>
          <p className="mt-1 text-3xl font-bold text-white tabular-nums">
            {formatRupiah(omzet)}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm text-white/80">
            {`Modal ${formatRupiah(modal)}`}
          </span>
          <Badge
            className={`h-auto rounded-full bg-white px-3 py-1 text-xs font-semibold hover:bg-white ${heroBadgeColor}`}
          >
            {formatRupiah(labaBersih)}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
