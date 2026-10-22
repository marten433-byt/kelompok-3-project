import { connection } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type {
  DailySession,
  Product,
  SaleItem,
  User,
} from "@/types/database-type";

import { type Penjualan } from "./_components/list_penjualan";
import { MainMenuClient } from "./_components/main_menu_client";
import { outletAktif, Summary } from "./_components/summary";

export const instant = false;

/** sale_items + relasi products(name) untuk daftar penjualan terakhir. */
type SaleItemDenganProduk = Pick<SaleItem, "sale_item_id" | "unit_price"> & {
  // Relasi ke products bisa berbentuk objek (many-to-one) atau array,
  // tergantung bagaimana PostgREST mengembalikannya.
  products: Pick<Product, "name"> | Pick<Product, "name">[] | null;
};

function namaProduk(products: SaleItemDenganProduk["products"]) {
  if (!products) return "Produk";
  return Array.isArray(products)
    ? (products[0]?.name ?? "Produk")
    : products.name;
}

export default async function MainMenuPage() {
  await connection();

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("myomset")
    .from("daily_sessions")
    .select("*")
    .eq("session_date", today)
    .maybeSingle();

  if (error) {
    console.error("Gagal mengambil sesi hari ini:", error);
  }

  // Data daily_sessions dipetakan ke tipe DailySession agar field yang dipakai
  // komponen sesuai dengan yang ada di src/types/database-type.d.ts.
  const sesiHariIni = (data as DailySession | null) ?? null;

  let outlet = outletAktif;
  let penjualan: Penjualan[] = [];

  if (sesiHariIni) {
    const [pengguna, itemPenjualan] = await Promise.all([
      supabase
        .schema("myomset")
        .from("users")
        .select("business_name")
        .eq("user_id", sesiHariIni.user_id)
        .maybeSingle(),
      supabase
        .schema("myomset")
        .from("sale_items")
        .select("sale_item_id, unit_price, products(name)")
        .eq("session_id", sesiHariIni.session_id)
        .order("sale_item_id", { ascending: false }),
    ]);

    if (pengguna.error) {
      console.error("Gagal mengambil data pengguna:", pengguna.error);
    } else {
      const profil = pengguna.data as Pick<User, "business_name"> | null;
      if (profil?.business_name) {
        outlet = profil.business_name;
      }
    }

    if (itemPenjualan.error) {
      console.error("Gagal mengambil item penjualan:", itemPenjualan.error);
    } else {
      penjualan = (
        (itemPenjualan.data ?? []) as SaleItemDenganProduk[]
      ).map((item) => ({
        nama: namaProduk(item.products),
        nominal: item.unit_price,
      }));
    }
  }

  return (
    <>
      <Summary outlet={outlet} sesi={sesiHariIni} />
      <MainMenuClient penjualanAwal={penjualan} />
    </>
  );
}
