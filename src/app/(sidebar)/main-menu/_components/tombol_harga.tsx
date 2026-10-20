"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

function formatRupiah(value: number) {
  return `Rp${numberFormatter.format(value)}`;
}

// 5000 -> "+5k", 15000 -> "+15k"
function formatLabelNominal(nominal: number) {
  return `+${nominal / 1_000}k`;
}

/** Nominal cepat yang paling sering dipakai kasir. */
const nominalCepat = [5_000, 10_000, 15_000, 20_000, 25_000] as const;

export type PenjualanBaru = {
  nama: string;
  nominal: number;
};

type TombolHargaProps = {
  /** Daftar nominal cepat yang ditampilkan. */
  nominal?: readonly number[];
  /** Dipanggil saat salah satu tombol nominal ditekan. */
  onPilihNominal?: (nominal: number) => void;
  /** Dipanggil saat form "Lainnya" disimpan. */
  onTambahPenjualan?: (penjualan: PenjualanBaru) => void;
  className?: string;
};

export function TombolHarga({
  nominal = nominalCepat,
  onPilihNominal,
  onTambahPenjualan,
  className,
}: TombolHargaProps) {
  const [buka, setBuka] = React.useState(false);
  const [nama, setNama] = React.useState("");
  const [harga, setHarga] = React.useState("");
  const [errorNama, setErrorNama] = React.useState<string | null>(null);
  const [errorHarga, setErrorHarga] = React.useState<string | null>(null);

  // Form selalu dimulai kosong agar sisa input sebelumnya tidak terbawa.
  function bukaDialog() {
    setNama("");
    setHarga("");
    setErrorNama(null);
    setErrorHarga(null);
    setBuka(true);
  }

  function simpan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const namaBarang = nama.trim();
    const nominalBarang = Number(harga);
    const namaKosong = namaBarang.length === 0;
    const hargaTidakValid = !Number.isFinite(nominalBarang) || nominalBarang <= 0;

    setErrorNama(namaKosong ? "Nama barang wajib diisi." : null);
    setErrorHarga(hargaTidakValid ? "Harga harus lebih dari 0." : null);

    if (namaKosong || hargaTidakValid) return;

    onTambahPenjualan?.({ nama: namaBarang, nominal: nominalBarang });
    setBuka(false);
  }

  return (
    <div className={cn("grid grid-cols-3 gap-3 px-4 pb-6 mt-auto", className)}>
      {nominal.map((nilai) => (
        <Button
          key={nilai}
          type="button"
          variant="secondary"
          onClick={() => onPilihNominal?.(nilai)}
          aria-label={`Tambah penjualan ${formatRupiah(nilai)}`}
          className="h-12 w-full rounded-xl border border-[#F3E2B6] bg-[#FEF6E4] text-sm font-semibold text-[#A16207] shadow-none transition-colors hover:bg-[#FBEACB] hover:text-[#854D0E] focus-visible:border-[#A16207]/40 focus-visible:ring-[#A16207]/30"
        >
          {formatLabelNominal(nilai)}
        </Button>
      ))}

      <Dialog open={buka} onOpenChange={setBuka}>
        <DialogTrigger asChild>
          <Button
            type="button"
            onClick={bukaDialog}
            aria-label="Input nama barang dan harga lainnya"
            className="h-12 w-full rounded-xl bg-[#0C3D2F] text-sm font-bold text-white shadow-none transition-colors hover:bg-[#0A3328] focus-visible:border-[#0C3D2F] focus-visible:ring-[#0C3D2F]/30"
          >
            Lainnya
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah penjualan</DialogTitle>
            <DialogDescription>
              Isi nama barang dan harga, lalu simpan agar masuk ke daftar
              penjualan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={simpan} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="nama-barang">Nama barang</Label>
              <Input
                id="nama-barang"
                name="nama-barang"
                placeholder="Contoh: Batagor"
                value={nama}
                onChange={(event) => {
                  setNama(event.target.value);
                  if (errorNama) setErrorNama(null);
                }}
                aria-invalid={errorNama !== null}
                aria-describedby={errorNama ? "nama-barang-error" : undefined}
                autoComplete="off"
                className="h-10"
              />
              {errorNama && (
                <p
                  id="nama-barang-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errorNama}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="harga-barang">Harga</Label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
                >
                  Rp
                </span>
                <Input
                  id="harga-barang"
                  name="harga-barang"
                  inputMode="numeric"
                  placeholder="15000"
                  value={harga}
                  onChange={(event) => {
                    setHarga(event.target.value.replace(/\D/g, "").slice(0, 12));
                    if (errorHarga) setErrorHarga(null);
                  }}
                  aria-invalid={errorHarga !== null}
                  aria-describedby={
                    errorHarga ? "harga-barang-error" : "harga-barang-hint"
                  }
                  autoComplete="off"
                  className="h-10 pl-9 tabular-nums"
                />
              </div>
              <p id="harga-barang-hint" className="text-xs text-muted-foreground">
                {harga
                  ? formatRupiah(Number(harga))
                  : "Masukkan angka tanpa titik atau koma."}
              </p>
              {errorHarga && (
                <p
                  id="harga-barang-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {errorHarga}
                </p>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-[#0C3D2F] text-white hover:bg-[#0A3328]"
              >
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

