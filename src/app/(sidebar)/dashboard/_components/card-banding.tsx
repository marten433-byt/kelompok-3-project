import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

const persenFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
});

function formatRupiah(value: number) {
  return `${value < 0 ? "-" : ""}Rp${numberFormatter.format(Math.abs(value))}`;
}

// Data dummy: sama dengan dua hari terakhir pada chart laba bersih.
const labaHariIniDummy = 465_000;
const labaKemarinDummy = 295_000;

type CardBandingProps = {
  labaHariIni?: number;
  labaKemarin?: number;
};

export function CardBanding({
  labaHariIni = labaHariIniDummy,
  labaKemarin = labaKemarinDummy,
}: CardBandingProps) {
  const selisih = labaHariIni - labaKemarin;
  const untung = labaHariIni >= 0;
  const naik = selisih > 0;

  // Hijau saat untung, merah saat rugi (mengikuti Summary di main-menu).
  const warnaLaba = untung
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-500 dark:text-red-400";

  const warnaSelisih =
    selisih === 0
      ? "text-muted-foreground"
      : naik
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-red-500 dark:text-red-400";

  // Kemarin nol membuat persentase tidak terdefinisi, jadi hanya tampilkan nominal.
  const persen =
    labaKemarin === 0 ? null : (selisih / Math.abs(labaKemarin)) * 100;

  const DeltaIcon =
    selisih === 0 ? MinusIcon : naik ? ArrowUpRightIcon : ArrowDownRightIcon;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perbandingan Laba</CardTitle>
        <CardDescription>
          Laba bersih hari ini dibanding kemarin.
        </CardDescription>
        <CardAction>
          <Badge variant="outline" className={`gap-1 ${warnaSelisih}`}>
            <DeltaIcon aria-hidden="true" />
            {persen === null
              ? "—"
              : `${persen > 0 ? "+" : ""}${persenFormatter.format(persen)}%`}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/40 p-4 ring-1 ring-foreground/10">
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Hari ini
            </p>
            <p
              className={`mt-1 text-2xl font-bold tabular-nums ${warnaLaba}`}
            >
              {formatRupiah(labaHariIni)}
            </p>
            <p className={`mt-1 text-xs font-semibold ${warnaLaba}`}>
              {untung ? "Untung" : "Rugi"}
            </p>
          </div>

          <div className="rounded-lg p-4 ring-1 ring-foreground/10">
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Kemarin
            </p>
            <p className="mt-1 text-2xl font-bold text-muted-foreground tabular-nums">
              {formatRupiah(labaKemarin)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Laba bersih</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {selisih === 0
            ? "Laba hari ini sama dengan kemarin."
            : `${naik ? "Naik" : "Turun"} ${formatRupiah(
                Math.abs(selisih),
              )}${
                persen === null
                  ? ""
                  : ` (${persenFormatter.format(Math.abs(persen))}%)`
              } dari kemarin.`}
        </p>
      </CardContent>
    </Card>
  );
}

