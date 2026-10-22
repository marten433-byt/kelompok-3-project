"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { tambahItemPenjualan } from "../action";
import {
  ListPenjualan,
  type Penjualan,
} from "./list_penjualan";
import { outletAktif } from "./summary";
import { TombolHarga, type PenjualanBaru } from "./tombol_harga";

/** Jam lokal saat ini, mis. "16:40". */
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
};

export function MainMenuClient({ penjualanAwal }: MainMenuClientProps) {
  const router = useRouter();
  const [penjualan, setPenjualan] = useState<Penjualan[]>(penjualanAwal);
  const [, startTransition] = useTransition();

  function tambahPenjualan({ nama, nominal }: PenjualanBaru) {
    startTransition(async () => {
      const hasil = await tambahItemPenjualan({ nama, nominal });

      if (!hasil.sukses) {
        toast.error(hasil.pesan);
        return;
      }

      setPenjualan((sebelumnya) => [
        { jam: jamSekarang(), nama, nominal },
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
      />
    </>
  );
}
