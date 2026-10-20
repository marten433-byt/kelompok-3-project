import { ListPenjualan } from "./_components/list_penjualan";
import { Summary } from "./_components/summary";
import { TombolHarga } from "./_components/tombol_harga";

export default function DashboardPage() {
  return (
    <>
      <Summary />
      <ListPenjualan />
      <TombolHarga />
    </>
  );
}
