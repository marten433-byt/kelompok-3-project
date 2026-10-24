"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { formatJamWib } from "@/lib/waktu";

import { tambahItemPenjualan } from "../action";
import {
  ListPenjualan,
  type Penjualan,
} from "./list_penjualan";
import { outletAktif } from "./summary";
import { TombolHarga, type PenjualanBaru } from "./tombol_harga";

/** Jam lokal saat ini, mis. "16:40". Cadangan bila created_at tidak ada. */
function jamSekarang() {
  const sekarang = new Date();
  const jam = String(sekarang.getHours()).padStart(2, "0");
  const menit = String(sekarang.getMinutes()).padStart(2, "0");
  return `${jam}:${menit}`;
}

/**
 * Menyimpan penjualan hari ini di state, sehingga item dari form "Lainnya"
 * langsung muncul di bagian atas daftar penjualan.
 */
type MainMenuClientProps = {
  /** Penjualan hari ini dari tabel sale_items. */
  penjualanAwal: Penjualan[];
  /** Status sesi hari ini; null berarti sesi belum dibuat. */
  statusSesi: "OPEN" | "CLOSED" | null;
};

export function MainMenuClient({
  penjualanAwal,
  statusSesi,
}: MainMenuClientProps) {
  const router = useRouter();
  const [penjualan, setPenjualan] = useState<Penjualan[]>(penjualanAwal);
  const [, startTransition] = useTransition();
  const sesiTerbuka = statusSesi === "OPEN";

  function tambahPenjualan({ nama, nominal }: PenjualanBaru) {
    startTransition(async () => {
      const hasil = await tambahItemPenjualan({ nama, nominal });

      if (!hasil.sukses) {
        toast.error(hasil.pesan);
        return;
      }

      setPenjualan((sebelumnya) => [
        // Jam diambil dari created_at yang baru disimpan ke database.
        {
          jam: formatJamWib(hasil.created_at) ?? jamSekarang(),
          nama,
          nominal,
        },
        ...sebelumnya,
      ]);
      toast.success(`${nama} ditambahkan ke penjualan.`);

      // Ambil ulang data server agar ringkasan omzet/transaksi ikut berubah.
      router.refresh();
    });
  }

  /** Tombol nominal cepat mencatat penjualan atas nama outlet yang aktif. */
  function tambahNominal(nominal: number) {
    tambahPenjualan({ nama: outletAktif, nominal });
  }

  return (
    <>
      <ListPenjualan penjualan={penjualan} />
      <TombolHarga
        onPilihNominal={tambahNominal}
        onTambahPenjualan={tambahPenjualan}
        nonaktif={!sesiTerbuka}
        alasanNonaktif={
          statusSesi === "CLOSED"
            ? "Sesi hari ini sudah ditutup. Buka kembali sesi untuk mencatat penjualan."
            : statusSesi === null
              ? "Sesi hari ini belum dibuka. Buka sesi dulu untuk mencatat penjualan."
              : undefined
        }
      />
    </>
  );
}
