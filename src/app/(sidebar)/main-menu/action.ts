"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { DailySession, Product, SaleItem } from "@/types/database-type";

/** Input dari form penjualan di main-menu. */
export type ItemPenjualanInput = {
  /** Nama produk; dipakai untuk mencari atau membuat baris di tabel products. */
  nama: string;
  /** Harga satuan yang dibayar pelanggan. */
  nominal: number;
};

export type HasilTambahItemPenjualan =
  | {
      sukses: true;
      sale_item_id: number;
      product_id: number;
      session_id: number;
    }
  | {
      sukses: false;
      pesan: string;
    };

type SesiRingkas = Pick<DailySession, "session_id" | "user_id" | "status">;
type ProdukRingkas = Pick<Product, "product_id">;
type ItemSesi = Pick<SaleItem, "unit_price">;
type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

/** Tanggal hari ini di zona waktu WIB dengan format YYYY-MM-DD. */
function hariIniWib() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

/**
 * Menghitung ulang omzet dan jumlah transaksi dari seluruh sale_items
 * pada sesi tersebut, lalu menyimpannya ke daily_sessions.
 *
 * Nilai dihitung ulang (bukan ditambah) agar tetap benar meskipun ada
 * trigger database yang sudah memperbarui daily_sessions.
 */
async function sinkronkanTotalSesi(
  supabase: SupabaseServer,
  sessionId: number,
) {
  const { data, error } = await supabase
    .schema("myomset")
    .from("sale_items")
    .select("unit_price")
    .eq("session_id", sessionId);

  if (error) {
    console.error("Gagal menghitung total sesi:", error);
    return;
  }

  const daftarItem = (data ?? []) as ItemSesi[];
  const totalOmzet = daftarItem.reduce(
    (jumlah, item) => jumlah + Number(item.unit_price),
    0,
  );

  const { error: errorUpdate } = await supabase
    .schema("myomset")
    .from("daily_sessions")
    .update({
      total_revenue: totalOmzet,
      transaction_count: daftarItem.length,
    })
    .eq("session_id", sessionId);

  if (errorUpdate) {
    console.error("Gagal memperbarui total sesi:", errorUpdate);
  }
}

/**
 * Menyimpan satu penjualan ke tabel sale_items.
 *
 * Karena sale_items mewajibkan product_id, nama produk dicari dulu di tabel
 * products milik user pada sesi hari ini. Jika belum ada, produk baru dibuat.
 * Setelah item tersimpan, omzet dan jumlah transaksi sesi ikut diperbarui.
 */
export async function tambahItemPenjualan(
  input: ItemPenjualanInput,
): Promise<HasilTambahItemPenjualan> {
  const nama = input.nama?.trim() ?? "";
  const nominal = Number(input.nominal);

  if (!nama) {
    return { sukses: false, pesan: "Nama produk wajib diisi." };
  }

  if (nama.length > 100) {
    return {
      sukses: false,
      pesan: "Nama produk terlalu panjang (maksimal 100 karakter).",
    };
  }

  if (!Number.isFinite(nominal) || nominal <= 0) {
    return { sukses: false, pesan: "Harga produk harus lebih dari 0." };
  }

  const supabase = await createClient();

  // 1. Penjualan harus masuk ke sesi hari ini.
  const { data: dataSesi, error: errorSesi } = await supabase
    .schema("myomset")
    .from("daily_sessions")
    .select("session_id, user_id, status")
    .eq("session_date", hariIniWib())
    .maybeSingle();

  if (errorSesi) {
    console.error("Gagal mengambil sesi hari ini:", errorSesi);
    return { sukses: false, pesan: "Gagal mengambil sesi hari ini." };
  }

  const sesi = dataSesi as SesiRingkas | null;

  if (!sesi) {
    return {
      sukses: false,
      pesan:
        "Belum ada sesi hari ini. Buka sesi terlebih dahulu sebelum mencatat penjualan.",
    };
  }

  if (sesi.status.trim().toUpperCase() !== "OPEN") {
    return {
      sukses: false,
      pesan: "Sesi hari ini sudah ditutup, penjualan tidak bisa ditambahkan.",
    };
  }

  // 2. Cari produk milik user pada sesi ini (nama harus sama persis).
  const { data: dataProduk, error: errorCariProduk } = await supabase
    .schema("myomset")
    .from("products")
    .select("product_id")
    .eq("user_id", sesi.user_id)
    .eq("name", nama)
    .limit(1)
    .maybeSingle();

  if (errorCariProduk) {
    console.error("Gagal mencari produk:", errorCariProduk);
    return { sukses: false, pesan: "Gagal memeriksa data produk." };
  }

  let productId = (dataProduk as ProdukRingkas | null)?.product_id ?? null;

  // 3. Buat produk baru bila nama tersebut belum pernah dijual.
  if (productId === null) {
    const { data: dataProdukBaru, error: errorTambahProduk } = await supabase
      .schema("myomset")
      .from("products")
      .insert({ user_id: sesi.user_id, name: nama })
      .select("product_id")
      .single();

    if (errorTambahProduk) {
      console.error("Gagal menambah produk:", errorTambahProduk);
      return { sukses: false, pesan: "Gagal menyimpan produk baru." };
    }

    productId = (dataProdukBaru as ProdukRingkas).product_id;
  }

  // 4. Simpan penjualan ke sale_items.
  const { data: dataItem, error: errorItem } = await supabase
    .schema("myomset")
    .from("sale_items")
    .insert({
      product_id: productId,
      session_id: sesi.session_id,
      unit_price: nominal,
    })
    .select("sale_item_id")
    .single();

  if (errorItem) {
    console.error("Gagal menyimpan item penjualan:", errorItem);
    return { sukses: false, pesan: "Gagal menyimpan penjualan." };
  }

  // 5. Pastikan ringkasan sesi (omzet & jumlah transaksi) ikut terbarui.
  await sinkronkanTotalSesi(supabase, sesi.session_id);

  revalidatePath("/main-menu");
  revalidatePath("/dashboard");
  revalidatePath("/riwayat");

  return {
    sukses: true,
    sale_item_id: (dataItem as Pick<SaleItem, "sale_item_id">).sale_item_id,
    product_id: productId,
    session_id: sesi.session_id,
  };
}

