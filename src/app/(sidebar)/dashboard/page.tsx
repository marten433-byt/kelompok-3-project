import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { DailySession } from "@/types/database-type";

import { CardBanding } from "./_components/card-banding";
import {
  ChartLabaBersih,
  type LabaBersihHarian,
} from "./_components/chart-laba-bersih";

export const instant = false;

/** Tanggal ISO (YYYY-MM-DD) digeser sejumlah hari memakai UTC agar aman. */
function geserTanggal(iso: string, jumlahHari: number) {
  const [tahun, bulan, hari] = iso.split("-").map(Number);
  const tanggal = new Date(Date.UTC(tahun, bulan - 1, hari + jumlahHari));
  return tanggal.toISOString().slice(0, 10);
}

/** Laba bersih sesi = omzet - modal awal (field yang tersedia di daily_sessions). */
function labaBersih(sesi: DailySession) {
  return sesi.total_revenue - sesi.opening_capital;
}

export default async function DashboardPage() {
  await connection();

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
  const kemarin = geserTanggal(today, -1);

  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("myomset")
    .from("daily_sessions")
    .select("*")
    .order("session_date", { ascending: true });

  if (error) {
    console.error("Gagal mengambil sesi untuk dashboard:", error);
  }

  const daftarSesi = (data as DailySession[] | null) ?? [];

  // Chart memakai seluruh sesi; komponennya sendiri yang mengambil 7 hari terakhir.
  const labaHarian: LabaBersihHarian[] = daftarSesi.map((sesi) => ({
    tanggal: sesi.session_date,
    labaBersih: labaBersih(sesi),
  }));

  const sesiHariIni = daftarSesi.find((sesi) => sesi.session_date === today);
  const sesiKemarin = daftarSesi.find((sesi) => sesi.session_date === kemarin);

  return (
    <>
      <CardBanding
        labaHariIni={sesiHariIni ? labaBersih(sesiHariIni) : 0}
        labaKemarin={sesiKemarin ? labaBersih(sesiKemarin) : 0}
      />
      <ChartLabaBersih data={labaHarian} />
    </>
  );
}
