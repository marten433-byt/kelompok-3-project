"use client";

import { useEffect, useState } from "react";
import { ClockIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tanggalLengkapFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

// Versi ringkas untuk layar kecil agar badge tidak berdesakan dengan label di kiri.
const tanggalSingkatFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

const jamFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

type WaktuRealtimeProps = {
  className?: string;
};

/**
 * Badge jam realtime: menampilkan hari, tanggal + bulan, dan jam (dengan detik).
 * Nilai awal `null` supaya markup server dan klien sama, lalu diisi setelah
 * komponen terpasang agar tidak memicu hydration mismatch.
 */
export function WaktuRealtime({ className }: Readonly<WaktuRealtimeProps>) {
  const [sekarang, setSekarang] = useState<Date | null>(null);

  useEffect(() => {
    const perbarui = () => setSekarang(new Date());

    // Tick pertama dijadwalkan sebelum paint supaya tidak ada kedipan placeholder,
    // lalu diperbarui tiap detik; tanggal ikut berganti otomatis saat lewat tengah malam.
    const frame = window.requestAnimationFrame(perbarui);
    const interval = window.setInterval(perbarui, 1_000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, []);

  const tanggalLengkap = sekarang
    ? tanggalLengkapFormatter.format(sekarang)
    : undefined;
  const jam = sekarang ? jamFormatter.format(sekarang) : undefined;

  return (
    <Badge
      variant="outline"
      role="timer"
      title={tanggalLengkap && jam ? `${tanggalLengkap} pukul ${jam}` : undefined}
      className={cn(
        "h-auto shrink-0 gap-1.5 rounded-full border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85 backdrop-blur-sm",
        className,
      )}
    >
      <ClockIcon aria-hidden="true" className="size-3 opacity-80" />
      {sekarang ? (
        <>
          <span className="hidden sm:inline">{tanggalLengkap}</span>
          <span className="sm:hidden">
            {tanggalSingkatFormatter.format(sekarang)}
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-white/25" />
          <span className="font-semibold text-white tabular-nums">{jam}</span>
        </>
      ) : (
        <span className="font-semibold tabular-nums">--.--.--</span>
      )}
    </Badge>
  );
}
