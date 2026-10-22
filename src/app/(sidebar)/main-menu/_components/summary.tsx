import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DailySession } from "@/types/database-type";

import { WaktuRealtime } from "./waktu_realtime";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

const jamFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

const tanggalFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

function formatRupiah(value: number) {
  return `${value < 0 ? "-" : ""}Rp${numberFormatter.format(Math.abs(value))}`;
}

/** Timestamp ISO menjadi jam WIB, mis. "2026-10-22T06:03:50+00:00" -> "13:03 WIB". */
function formatJam(iso: string | null) {
  if (!iso) return null;

  const tanggal = new Date(iso);
  if (Number.isNaN(tanggal.getTime())) return null;

  return `${jamFormatter.format(tanggal)} WIB`;
}

/** Tanggal sesi (YYYY-MM-DD) dibaca sebagai waktu lokal agar label tidak bergeser. */
function formatTanggalSesi(iso: string) {
  const tanggal = new Date(`${iso}T00:00:00+07:00`);
  return Number.isNaN(tanggal.getTime())
    ? iso
    : tanggalFormatter.format(tanggal);
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

/** Outlet yang sedang aktif. Dipakai juga oleh daftar penjualan. */
export const outletAktif = "Batagor";

type SummaryProps = {
  /** Nama outlet dari data pengguna (users.business_name). */
  outlet?: string;
  /** Baris daily_sessions hari ini; null jika sesi belum dibuat. */
  sesi?: DailySession | null;
};

export function Summary({ outlet = outletAktif, sesi = null }: SummaryProps) {
  // Field DailySession ditempatkan sesuai maknanya di kartu ringkasan.
  const omzet = sesi?.total_revenue ?? 0;
  const modal = sesi?.opening_capital ?? 0;
  const labaBersih = omzet - modal;

  // Laba bersih negatif berarti rugi, selain itu dianggap untung.
  const untung = labaBersih >= 0;
  const heroBadgeColor = untung ? "text-emerald-600" : "text-red-500";

  const jamDibuka = formatJam(sesi?.opened_at ?? null);
  const jamDitutup = formatJam(sesi?.closed_at ?? null);
  const sesiDitutup = sesi?.status.toUpperCase() === "CLOSED";

  const keteranganWaktu = sesiDitutup
    ? jamDitutup
      ? `ditutup ${jamDitutup}`
      : null
    : jamDibuka
      ? `dibuka ${jamDibuka}`
      : null;

  const ringkasanSesi = sesi
    ? [
        formatTanggalSesi(sesi.session_date),
        `${sesi.transaction_count} transaksi`,
        keteranganWaktu,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Belum ada sesi hari ini.";

  return (
    <Card className="gap-0 bg-muted/40 py-0">
      {/* Header hero: ringkasan omzet hari ini */}
      <div className="rounded-b-none bg-[#0C3D2F] px-6 pt-6 pb-6">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate text-white/70">{`Hari ini - ${outlet}`}</span>
          <WaktuRealtime />
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-white/70">Omzet terkumpul</p>
            <p className="mt-1 text-3xl font-bold text-white tabular-nums">
              {formatRupiah(omzet)}
            </p>
          </div>

          {sesi && (
            <Badge
              variant="outline"
              className="h-auto shrink-0 rounded-full border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85"
            >
              {labelStatus(sesi.status)}
            </Badge>
          )}
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

        <p className="mt-3 text-xs text-white/60">{ringkasanSesi}</p>

        {sesi?.notes && (
          <p className="mt-1 text-xs text-white/60">{`Catatan: ${sesi.notes}`}</p>
        )}
      </div>
    </Card>
  );
}
