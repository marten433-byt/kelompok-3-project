"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import {
  CheckIcon,
  HistoryIcon,
  LockKeyholeIcon,
  LockOpenIcon,
  RotateCcwIcon,
} from "lucide-react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DailySession } from "@/types/database-type";

import { bukaSesi, tutupSesi } from "../action";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

function formatRupiah(value: number) {
  return `Rp${numberFormatter.format(value)}`;
}

const jamFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

/** Timestamp ISO menjadi jam WIB, mis. "2026-10-22T06:03:50+00:00" -> "13:03 WIB". */
function formatJam(iso: string | null) {
  if (!iso) return null;

  const tanggal = new Date(iso);
  if (Number.isNaN(tanggal.getTime())) return null;

  return `${jamFormatter.format(tanggal)} WIB`;
}

/** Mode dialog mengikuti kondisi sesi hari ini. */
type ModeSesi = "buka" | "tutup" | "buka-kembali";

const teksMode: Record<
  ModeSesi,
  {
    tombol: string;
    judul: string;
    deskripsi: string;
    keterangan: string;
    labelCatatan: string;
    placeholderCatatan: string;
  }
> = {
  buka: {
    tombol: "Buka sesi",
    judul: "Buka sesi hari ini",
    deskripsi:
      "Isi modal awal untuk membuka sesi. Setelah sesi terbuka, penjualan bisa dicatat.",
    keterangan: "Buka sesi dulu agar penjualan hari ini bisa dicatat.",
    labelCatatan: "Catatan (opsional)",
    placeholderCatatan: "Contoh: buka pagi di depan pasar",
  },
  tutup: {
    tombol: "Tutup sesi",
    judul: "Tutup sesi hari ini",
    deskripsi:
      "Sesi akan ditutup dan omzet hari ini dikunci. Penjualan baru tidak bisa ditambahkan setelahnya.",
    keterangan: "Penjualan hari ini tercatat pada sesi ini.",
    labelCatatan: "Catatan penutupan (opsional)",
    placeholderCatatan: "Contoh: stok habis, tutup lebih awal",
  },
  "buka-kembali": {
    tombol: "Buka kembali",
    judul: "Buka kembali sesi hari ini",
    deskripsi:
      "Sesi yang sudah ditutup akan dibuka lagi sehingga penjualan bisa dicatat kembali.",
    keterangan: "Sesi sudah ditutup. Buka kembali untuk mencatat penjualan.",
    labelCatatan: "Catatan (opsional)",
    placeholderCatatan: "Contoh: ada pesanan tambahan",
  },
};

/** Modal sesi terakhir sebelum hari ini, dipakai untuk isi cepat modal awal. */
export type ModalSebelumnya = {
  /** Nilai modal pembukaan sesi terakhir. */
  nominal: number;
  /** true bila sesi terakhir jatuh tepat kemarin (WIB). */
  dariKemarin: boolean;
};

type KontrolSesiProps = {
  /** Baris daily_sessions hari ini; null jika sesi belum dibuat. */
  sesi: DailySession | null;
  /** Modal sesi terakhir; null bila belum ada sesi sebelumnya. */
  modalSebelumnya?: ModalSebelumnya | null;
  className?: string;
};

/**
 * Tombol buka/tutup sesi harian untuk halaman main-menu.
 *
 * Tampil sebagai baris aksi di bagian bawah kartu ringkasan (hero hijau),
 * dengan dialog untuk mengisi modal awal atau catatan penutupan.
 */
export function KontrolSesi({
  sesi,
  modalSebelumnya = null,
  className,
}: KontrolSesiProps) {
  const router = useRouter();
  const [dialogTerbuka, setDialogTerbuka] = React.useState(false);
  const [modalAwal, setModalAwal] = React.useState("");
  const [catatan, setCatatan] = React.useState("");
  const [errorModal, setErrorModal] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const terbuka = sesi?.status.trim().toUpperCase() === "OPEN";
  const mode: ModeSesi = !sesi ? "buka" : terbuka ? "tutup" : "buka-kembali";
  const teks = teksMode[mode];
  const jamDitutup = formatJam(sesi?.closed_at ?? null);

  // Modal sesi terakhir dipakai sebagai isian awal agar tidak perlu ketik ulang.
  const nominalSebelumnya =
    modalSebelumnya !== null ? Math.round(modalSebelumnya.nominal) : null;
  const memakaiModalSebelumnya =
    nominalSebelumnya !== null &&
    modalAwal !== "" &&
    Number(modalAwal) === nominalSebelumnya;

  const Ikon =
    mode === "tutup"
      ? LockKeyholeIcon
      : mode === "buka-kembali"
        ? RotateCcwIcon
        : LockOpenIcon;

  // Form dimulai dari modal sesi terakhir, sisanya kosong.
  function bukaForm() {
    setModalAwal(nominalSebelumnya !== null ? String(nominalSebelumnya) : "");
    setCatatan("");
    setErrorModal(null);
    setDialogTerbuka(true);
  }

  /** Kembalikan isian ke modal sesi terakhir setelah diubah pengguna. */
  function pakaiModalSebelumnya() {
    if (nominalSebelumnya === null) return;
    setModalAwal(String(nominalSebelumnya));
    setErrorModal(null);
  }

  function simpan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "buka") {
      const nilai = Number(modalAwal);

      if (modalAwal.trim() === "") {
        setErrorModal("Modal awal wajib diisi.");
        return;
      }

      if (!Number.isFinite(nilai) || nilai < 0) {
        setErrorModal("Modal awal harus berupa angka 0 atau lebih.");
        return;
      }
    }

    startTransition(async () => {
      const hasil =
        mode === "tutup"
          ? await tutupSesi({ catatan })
          : await bukaSesi(
              mode === "buka"
                ? { modalAwal: Number(modalAwal), catatan }
                : { catatan },
            );

      if (!hasil.sukses) {
        toast.error(hasil.pesan);
        return;
      }

      toast.success(
        hasil.status === "OPEN"
          ? "Sesi hari ini dibuka."
          : "Sesi hari ini ditutup.",
      );
      setDialogTerbuka(false);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "mt-4 flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-xs text-white/60">{teks.keterangan}</p>

      <Dialog open={dialogTerbuka} onOpenChange={setDialogTerbuka}>
        <DialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            onClick={bukaForm}
            className={cn(
              "h-8 shrink-0 gap-1.5 rounded-lg px-3 text-xs font-semibold",
              mode === "tutup"
                ? "border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                : "bg-white text-[#0C3D2F] hover:bg-white/90",
            )}
          >
            <Ikon aria-hidden="true" />
            {teks.tombol}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{teks.judul}</DialogTitle>
            <DialogDescription>{teks.deskripsi}</DialogDescription>
          </DialogHeader>

          <form onSubmit={simpan} className="flex flex-col gap-4" noValidate>
            {mode === "buka" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="modal-awal">Modal awal</Label>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
                  >
                    Rp
                  </span>
                  <Input
                    id="modal-awal"
                    name="modal-awal"
                    inputMode="numeric"
                    placeholder="200000"
                    value={modalAwal}
                    onChange={(event) => {
                      setModalAwal(
                        event.target.value.replace(/\D/g, "").slice(0, 12),
                      );
                      if (errorModal) setErrorModal(null);
                    }}
                    aria-invalid={errorModal !== null}
                    aria-describedby={
                      errorModal ? "modal-awal-error" : "modal-awal-hint"
                    }
                    autoComplete="off"
                    className="h-10 pl-9 tabular-nums"
                  />
                </div>
                <p
                  id="modal-awal-hint"
                  className="text-xs text-muted-foreground"
                >
                  {modalAwal
                    ? formatRupiah(Number(modalAwal))
                    : "Masukkan angka tanpa titik atau koma."}
                </p>
                {errorModal && (
                  <p
                    id="modal-awal-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {errorModal}
                  </p>
                )}

                {/* Isian cepat: pakai modal sesi terakhir tanpa mengetik ulang. */}
                {modalSebelumnya &&
                  (memakaiModalSebelumnya ? (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <CheckIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0"
                      />
                      {modalSebelumnya.dariKemarin
                        ? "Terisi otomatis dari modal kemarin."
                        : "Terisi otomatis dari modal sesi terakhir."}
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={pakaiModalSebelumnya}
                      className="h-9 w-full justify-start gap-2 rounded-lg border border-[#F3E2B6] bg-[#FEF6E4] px-2.5 text-xs font-semibold text-[#A16207] shadow-none hover:bg-[#FBEACB] hover:text-[#854D0E]"
                    >
                      <HistoryIcon
                        aria-hidden="true"
                        className="size-3.5 shrink-0"
                      />
                      <span className="truncate">
                        {modalSebelumnya.dariKemarin
                          ? "Sama seperti kemarin"
                          : "Pakai modal sesi terakhir"}
                      </span>
                      <span className="ml-auto shrink-0 tabular-nums">
                        {formatRupiah(modalSebelumnya.nominal)}
                      </span>
                    </Button>
                  ))}
              </div>
            )}

            {mode === "tutup" && sesi && (
              <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">
                  {`Omzet ${formatRupiah(sesi.total_revenue)} dari ${sesi.transaction_count} transaksi`}
                </p>
                <p className="mt-1">
                  Angka di atas akan dikunci dan tidak bisa ditambah lagi.
                </p>
              </div>
            )}

            {mode === "buka-kembali" && (
              <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                {jamDitutup
                  ? `Sesi ini ditutup pada ${jamDitutup}. Melanjutkan sesi akan memakai data yang sama.`
                  : "Sesi ini sudah ditutup. Melanjutkan sesi akan memakai data yang sama."}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="catatan-sesi">{teks.labelCatatan}</Label>
              <Textarea
                id="catatan-sesi"
                name="catatan-sesi"
                rows={3}
                maxLength={500}
                value={catatan}
                onChange={(event) => setCatatan(event.target.value)}
                placeholder={teks.placeholderCatatan}
                className="min-h-16"
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={pending}>
                  Batal
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={pending}
                className="bg-[#0C3D2F] text-white hover:bg-[#0A3328]"
              >
                {pending ? "Menyimpan…" : teks.tombol}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
