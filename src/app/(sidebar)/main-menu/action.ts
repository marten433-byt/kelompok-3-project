"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type {
  DailySession,
  Product,
  SaleItem,
  User,
} from "@/types/database-type";

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
      /** Waktu transaksi dibuat (timestamptz) untuk ditampilkan di daftar. */
      created_at: string;
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

  // 4. Simpan penjualan ke sale_items beserta waktu transaksi dibuat.
  //    created_at diisi eksplisit agar waktu pada daftar penjualan tersimpan
  //    di database, bukan hanya di state klien.
  const dibuatPada = new Date().toISOString();
  const { data: dataItem, error: errorItem } = await supabase
    .schema("myomset")
    .from("sale_items")
    .insert({
      product_id: productId,
      session_id: sesi.session_id,
      unit_price: nominal,
      created_at: dibuatPada,
    })
    .select("sale_item_id, created_at")
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

  const itemTersimpan = dataItem as Pick<
    SaleItem,
    "sale_item_id" | "created_at"
  >;

  return {
    sukses: true,
    sale_item_id: itemTersimpan.sale_item_id,
    product_id: productId,
    session_id: sesi.session_id,
    // Pakai nilai dari database; bila kolomnya kosong, gunakan waktu yang
    // barusan dikirim agar daftar penjualan tetap menampilkan jam.
    created_at: itemTersimpan.created_at ?? dibuatPada,
  };
}

/* -------------------------------------------------------------------------- */
/* Kontrol sesi harian (buka / tutup)                                         */
/* -------------------------------------------------------------------------- */

export type HasilAksiSesi =
  | {
      sukses: true;
      session_id: number;
      status: "OPEN" | "CLOSED";
    }
  | {
      sukses: false;
      pesan: string;
    };

export type BukaSesiInput = {
  /** Modal awal hari ini; wajib diisi saat sesi hari ini belum ada. */
  modalAwal?: number;
  /** Catatan opsional yang disimpan di daily_sessions.notes. */
  catatan?: string;
};

export type TutupSesiInput = {
  /** Catatan opsional saat menutup sesi. */
  catatan?: string;
};

type SesiHariIni = Pick<DailySession, "session_id" | "user_id" | "status">;

/** Batas panjang catatan sesi agar tetap nyaman ditampilkan di kartu ringkasan. */
const MAKS_CATATAN = 500;

function rapikanCatatan(catatan?: string) {
  const nilai = catatan?.trim() ?? "";
  return nilai.length > 0 ? nilai : null;
}

/**
 * Menentukan user pemilik sesi baru.
 *
 * Aplikasi ini belum punya autentikasi, jadi urutan yang dipakai:
 * user pada sesi terakhir -> user pertama pada tabel users.
 */
async function userUntukSesiBaru(supabase: SupabaseServer) {
  const { data: sesiTerakhir, error: errorSesi } = await supabase
    .schema("myomset")
    .from("daily_sessions")
    .select("user_id")
    .order("session_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errorSesi) {
    console.error("Gagal mengambil sesi terakhir:", errorSesi);
  }

  const userSesi = sesiTerakhir as Pick<DailySession, "user_id"> | null;
  if (userSesi?.user_id) return userSesi.user_id;

  const { data: pengguna, error: errorPengguna } = await supabase
    .schema("myomset")
    .from("users")
    .select("user_id")
    .order("user_id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (errorPengguna) {
    console.error("Gagal mengambil pengguna:", errorPengguna);
    return null;
  }

  const profil = pengguna as Pick<User, "user_id"> | null;
  return profil?.user_id ?? null;
}

/**
 * Membuka sesi hari ini.
 *
 * - Sesi belum ada  -> dibuat baru dengan modal awal dari form.
 * - Sesi ditutup    -> dibuka kembali (closed_at dikosongkan).
 * - Sesi sudah buka -> ditolak agar tidak dobel.
 */
export async function bukaSesi(
  input: BukaSesiInput = {},
): Promise<HasilAksiSesi> {
  const catatan = rapikanCatatan(input.catatan);

  if (catatan && catatan.length > MAKS_CATATAN) {
    return {
      sukses: false,
      pesan: `Catatan terlalu panjang (maksimal ${MAKS_CATATAN} karakter).`,
    };
  }

  const supabase = await createClient();
  const hariIni = hariIniWib();

  const { data: dataSesi, error: errorSesi } = await supabase
    .schema("myomset")
    .from("daily_sessions")
    .select("session_id, user_id, status")
    .eq("session_date", hariIni)
    .maybeSingle();

  if (errorSesi) {
    console.error("Gagal mengambil sesi hari ini:", errorSesi);
    return { sukses: false, pesan: "Gagal mengambil sesi hari ini." };
  }

  const sesi = dataSesi as SesiHariIni | null;

  // Sesi hari ini sudah dibuat: hanya perlu dibuka kembali bila sudah ditutup.
  if (sesi) {
    if (sesi.status.trim().toUpperCase() === "OPEN") {
      return { sukses: false, pesan: "Sesi hari ini sudah terbuka." };
    }

    const { error: errorUpdate } = await supabase
      .schema("myomset")
      .from("daily_sessions")
      .update({
        status: "OPEN",
        closed_at: null,
        // Catatan lama dipertahankan bila form tidak mengirim catatan baru.
        ...(catatan ? { notes: catatan } : {}),
      })
      .eq("session_id", sesi.session_id);

    if (errorUpdate) {
      console.error("Gagal membuka kembali sesi:", errorUpdate);
      return { sukses: false, pesan: "Gagal membuka kembali sesi hari ini." };
    }

    revalidatePath("/main-menu");
    revalidatePath("/dashboard");
    revalidatePath("/riwayat");

    return { sukses: true, session_id: sesi.session_id, status: "OPEN" };
  }

  // Sesi baru: modal awal wajib berupa angka 0 atau lebih.
  const modalAwal = Number(input.modalAwal);

  if (!Number.isFinite(modalAwal) || modalAwal < 0) {
    return {
      sukses: false,
      pesan: "Modal awal harus berupa angka 0 atau lebih.",
    };
  }

  const userId = await userUntukSesiBaru(supabase);

  if (!userId) {
    return {
      sukses: false,
      pesan: "Data pengguna belum tersedia. Sesi tidak bisa dibuka.",
    };
  }

  const { data: dataBaru, error: errorInsert } = await supabase
    .schema("myomset")
    .from("daily_sessions")
    .insert({
      user_id: userId,
      session_date: hariIni,
      opening_capital: modalAwal,
      total_revenue: 0,
      transaction_count: 0,
      status: "OPEN",
      opened_at: new Date().toISOString(),
      closed_at: null,
      notes: catatan,
    })
    .select("session_id")
    .single();

  if (errorInsert) {
    console.error("Gagal membuka sesi:", errorInsert);
    return { sukses: false, pesan: "Gagal membuka sesi hari ini." };
  }

  const sesiBaru = dataBaru as Pick<DailySession, "session_id">;

  revalidatePath("/main-menu");
  revalidatePath("/dashboard");
  revalidatePath("/riwayat");

  return { sukses: true, session_id: sesiBaru.session_id, status: "OPEN" };
}

/**
 * Menutup sesi hari ini.
 *
 * Omzet dan jumlah transaksi dihitung ulang lebih dulu supaya angka yang
 * tersimpan di riwayat sudah final saat status berubah menjadi CLOSED.
 */
export async function tutupSesi(
  input: TutupSesiInput = {},
): Promise<HasilAksiSesi> {
  const catatan = rapikanCatatan(input.catatan);

  if (catatan && catatan.length > MAKS_CATATAN) {
    return {
      sukses: false,
      pesan: `Catatan terlalu panjang (maksimal ${MAKS_CATATAN} karakter).`,
    };
  }

  const supabase = await createClient();

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

  const sesi = dataSesi as SesiHariIni | null;

  if (!sesi) {
    return {
      sukses: false,
      pesan: "Belum ada sesi hari ini. Buka sesi terlebih dahulu.",
    };
  }

  if (sesi.status.trim().toUpperCase() === "CLOSED") {
    return { sukses: false, pesan: "Sesi hari ini sudah ditutup." };
  }

  await sinkronkanTotalSesi(supabase, sesi.session_id);

  const { error: errorUpdate } = await supabase
    .schema("myomset")
    .from("daily_sessions")
    .update({
      status: "CLOSED",
      closed_at: new Date().toISOString(),
      // Catatan lama dipertahankan bila form tidak mengirim catatan baru.
      ...(catatan ? { notes: catatan } : {}),
    })
    .eq("session_id", sesi.session_id);

  if (errorUpdate) {
    console.error("Gagal menutup sesi:", errorUpdate);
    return { sukses: false, pesan: "Gagal menutup sesi hari ini." };
  }

  revalidatePath("/main-menu");
  revalidatePath("/dashboard");
  revalidatePath("/riwayat");

  return { sukses: true, session_id: sesi.session_id, status: "CLOSED" };
}

