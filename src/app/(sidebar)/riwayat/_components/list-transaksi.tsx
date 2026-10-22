import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DailySession } from "@/types/database-type";

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
  timeZone: "Asia/Jakarta",
});

const jamFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

function formatRupiah(value: number) {
  return `${value < 0 ? "-" : ""}Rp${numberFormatter.format(Math.abs(value))}`;
}

/** Tanggal ISO (YYYY-MM-DD) dibaca sebagai tanggal WIB agar label tidak bergeser. */
function keTanggal(iso: string) {
  return new Date(`${iso}T00:00:00+07:00`);
}

/** Timestamp ISO menjadi jam WIB, mis. "2026-10-22T06:03:50+00:00" -> "13:03 WIB". */
function formatJam(iso: string | null) {
  if (!iso) return null;

  const tanggal = new Date(iso);
  if (Number.isNaN(tanggal.getTime())) return null;

  return `${jamFormatter.format(tanggal)} WIB`;
}

/** Laba bersih sesi = omzet - modal awal. */
function hitungLabaBersih(sesi: DailySession) {
  return sesi.total_revenue - sesi.opening_capital;
}

// Laba negatif berarti rugi, selain itu dianggap untung.
function warnaLaba(value: number) {
  return value >= 0
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-500 dark:text-red-400";
}

/** Label yang ramah untuk nilai status pada daily_sessions. */
function labelStatus(status: string) {
  switch (status.toUpperCase()) {
    case "OPEN":
      return "Sesi buka";
    case "CLOSED":
      return "Sesi tutup";
    default:
      return status;
  }
}

/** Riwayat ditampilkan dari tanggal terbaru. */
function urutkanTerbaru(data: DailySession[]) {
  return [...data].sort((a, b) =>
    b.session_date.localeCompare(a.session_date),
  );
}

function KartuTransaksi({ sesi }: { sesi: DailySession }) {
  const {
    session_date,
    opening_capital,
    total_revenue,
    transaction_count,
    status,
    opened_at,
    closed_at,
    notes,
  } = sesi;

  const labaBersih = hitungLabaBersih(sesi);

  // Omzet nol membuat persentase tidak terdefinisi.
  const margin =
    total_revenue === 0 ? null : (labaBersih / total_revenue) * 100;

  const jamDibuka = formatJam(opened_at);
  const jamDitutup = formatJam(closed_at);
  const keteranganWaktu =
    status.toUpperCase() === "CLOSED"
      ? jamDitutup
        ? `ditutup ${jamDitutup}`
        : null
      : jamDibuka
        ? `dibuka ${jamDibuka}`
        : null;

  const ringkasanSesi = [
    `${transaction_count} transaksi`,
    labelStatus(status),
    keteranganWaktu,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">
          {tanggalFormatter.format(keTanggal(session_date))}
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
              {formatRupiah(opening_capital)}
            </dd>
          </div>

          <div>
            <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Omzet
            </dt>
            <dd className="mt-1 text-base font-semibold tabular-nums">
              {formatRupiah(total_revenue)}
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

        <p className="text-xs text-muted-foreground">{ringkasanSesi}</p>

        {notes && (
          <p className="text-xs text-muted-foreground">{`Catatan: ${notes}`}</p>
        )}
      </CardContent>
    </Card>
  );
}

type ListTransaksiProps = {
  sesi: DailySession[];
};

export function ListTransaksi({ sesi }: ListTransaksiProps) {
  const daftar = urutkanTerbaru(sesi);

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
            <KartuTransaksi key={item.session_id} sesi={item} />
          ))}
        </div>
      )}
    </section>
  );
}

