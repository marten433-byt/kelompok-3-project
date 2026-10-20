"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  ListPenjualan,
  penjualanContoh,
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
export function MainMenuClient() {
  const [penjualan, setPenjualan] = useState<Penjualan[]>(() => [
    ...penjualanContoh,
  ]);

  function tambahPenjualan({ nama, nominal }: PenjualanBaru) {
    setPenjualan((sebelumnya) => [
      { jam: jamSekarang(), nama, nominal },
      ...sebelumnya,
    ]);
    toast.success(`${nama} ditambahkan ke penjualan.`);
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
