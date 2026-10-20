import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

function formatRupiah(value: number) {
  return `${value < 0 ? "-" : ""}Rp${numberFormatter.format(Math.abs(value))}`;
}

type SummaryProps = {
  outlet?: string;
  waktu?: string;
  omzet?: number;
  modal?: number;
  labaKotor?: number;
  labaBersih?: number;
  catatan?: string;
};

export function Summary({
  outlet = "Batagor",
  waktu = "16:42",
  omzet = 180_000,
  modal = 200_000,
  labaKotor = omzet - modal,
  labaBersih = omzet - modal,
  catatan,
}: SummaryProps) {
  // Laba bersih negatif berarti rugi, selain itu dianggap untung.
  const untung = labaBersih >= 0;

  const catatanHasil =
    catatan ??
    `Omzet ${formatRupiah(omzet)} dikurangi modal ${formatRupiah(modal)}; hasil ${formatRupiah(labaBersih)}.`;

  const labaBersihColor = untung
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";

  const statusColor = untung
    ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-400"
    : "border-red-600/30 bg-red-600/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-400";

  const heroBadgeColor = untung ? "text-emerald-600" : "text-red-500";

  return (
    <Card className="gap-0 bg-muted/40 py-0">
      {/* Header hero: ringkasan omzet hari ini */}
      <div className="rounded-b-none bg-[#0C3D2F] px-6 pt-6 pb-6">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-white/70">{`Hari ini - ${outlet}`}</span>
          <span className="tabular-nums text-white/70">{waktu}</span>
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

      <CardContent className="flex flex-col gap-4 py-4">
        {/* Bagian pertama: modal, laba kotor, dan catatan hasil */}
        <section
          aria-label="Ringkasan modal dan laba kotor"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Card size="sm" className="h-full">
            <CardHeader>
              <CardDescription>Modal</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {formatRupiah(modal)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card size="sm" className="h-full">
            <CardHeader>
              <CardDescription>Laba Kotor</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">
                {formatRupiah(labaKotor)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card size="sm" className="h-full">
            <CardHeader>
              <CardTitle>Catatan Hasil</CardTitle>
              <CardDescription>{catatanHasil}</CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Bagian kedua: laba bersih dengan warna sesuai untung/rugi */}
        <section aria-label="Ringkasan laba bersih">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardDescription>Laba Bersih</CardDescription>
                <Badge variant="outline" className={statusColor}>
                  {untung ? "Untung" : "Rugi"}
                </Badge>
              </div>
              <CardTitle
                className={`text-2xl font-semibold tabular-nums ${labaBersihColor}`}
              >
                {formatRupiah(labaBersih)}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>
      </CardContent>
    </Card>
  );
}

