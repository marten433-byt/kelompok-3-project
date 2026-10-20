import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

const persenFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
});

const tanggalFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatRupiah(value: number) {
  return `${value < 0 ? "-" : ""}Rp${numberFormatter.format(Math.abs(value))}`;
}

// Tanggal ISO (YYYY-MM-DD) dibaca sebagai waktu lokal agar label tidak bergeser.
function keTanggal(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

export type TransaksiHarian = {
  /** Tanggal dalam format ISO `YYYY-MM-DD`. */
  tanggal: string;
  omzet: number;
  modal: number;
  beban: number;
};

// Data dummy 7 hari. Laba bersihnya sama dengan chart laba bersih di dashboard.
const transaksiContoh: TransaksiHarian[] = [
  { tanggal: "2026-10-14", omzet: 460_000, modal: 185_000, beban: 35_000 },
  { tanggal: "2026-10-15", omzet: 610_000, modal: 220_000, beban: 35_000 },
  { tanggal: "2026-10-16", omzet: 565_000, modal: 210_000, beban: 45_000 },
  { tanggal: "2026-10-17", omzet: 700_000, modal: 235_000, beban: 45_000 },
  { tanggal: "2026-10-18", omzet: 655_000, modal: 225_000, beban: 45_000 },
  { tanggal: "2026-10-19", omzet: 520_000, modal: 195_000, beban: 30_000 },
  { tanggal: "2026-10-20", omzet: 760_000, modal: 250_000, beban: 45_000 },
];

/** Laba kotor = omzet - modal, laba bersih = laba kotor - beban operasional. */
function hitungLaba({ omzet, modal, beban }: TransaksiHarian) {
  const labaKotor = omzet - modal;
  return { labaKotor, labaBersih: labaKotor - beban };
}

// Laba negatif berarti rugi, selain itu dianggap untung.
function warnaLaba(value: number) {
  return value >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-500 dark:text-red-400";
}

/** Riwayat ditampilkan dari tanggal terbaru. */
function urutkanTerbaru(data: TransaksiHarian[]) {
  return [...data].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}

function KartuTransaksi({ transaksi }: { transaksi: TransaksiHarian }) {
  const { tanggal, omzet, modal, beban } = transaksi;
  const { labaKotor, labaBersih } = hitungLaba(transaksi);

  // Omzet nol membuat persentase tidak terdefinisi.
  const margin = omzet === 0 ? null : (labaBersih / omzet) * 100;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">
          {tanggalFormatter.format(keTanggal(tanggal))}
        </CardTitle>
        <CardAction>
          <Badge
            variant="outline"
            className={`gap-1 ${warnaLaba(labaBersih)}`}
          >
            {margin === null
              ? "—"
              : `Margin ${persenFormatter.format(margin)}%`}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <dl className="grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Modal
            </dt>
            <dd className="mt-1 text-base font-semibold tabular-nums">
              {formatRupiah(modal)}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Laba kotor
            </dt>
            <dd
              className={`mt-1 text-base font-semibold tabular-nums ${warnaLaba(
                labaKotor,
              )}`}
            >
              {formatRupiah(labaKotor)}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Laba bersih
            </dt>
            <dd
              className={`mt-1 text-base font-semibold tabular-nums ${warnaLaba(
                labaBersih,
              )}`}
            >
              {formatRupiah(labaBersih)}
            </dd>
          </div>
        </dl>

        <p className="text-xs text-muted-foreground">
          {`Omzet ${formatRupiah(omzet)} · Beban ${formatRupiah(beban)}`}
        </p>
      </CardContent>
    </Card>
  );
}

type ListTransaksiProps = {
  transaksi?: TransaksiHarian[];
};

export function ListTransaksi({
  transaksi = transaksiContoh,
}: ListTransaksiProps) {
  const daftar = urutkanTerbaru(transaksi);

  return (
    <section aria-labelledby="riwayat-transaksi" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2
          id="riwayat-transaksi"
          className="text-xs font-bold tracking-wider text-muted-foreground"
        >
          RIWAYAT TRANSAKSI HARIAN
        </h2>
        <Badge variant="secondary">{`${daftar.length} hari`}</Badge>
      </div>

      {daftar.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">
          Belum ada transaksi.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {daftar.map((item) => (
            <KartuTransaksi key={item.tanggal} transaksi={item} />
          ))}
        </div>
      )}
    </section>
  );
}

