import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { DailySession } from "@/types/database-type";

import { ListTransaksi } from "./_components/list-transaksi";

export const instant = false;

export default async function RiwayatPage() {
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("myomset")
    .from("daily_sessions")
    .select("*")
    .order("session_date", { ascending: false });

  if (error) {
    console.error("Gagal mengambil riwayat sesi:", error);
  }

  const sesi = (data as DailySession[] | null) ?? [];

  return <ListTransaksi sesi={sesi} />;
}
