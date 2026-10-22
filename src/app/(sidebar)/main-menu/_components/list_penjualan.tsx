const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

function formatRupiah(value: number) {
  return `Rp${numberFormatter.format(value)}`;
}

export type Penjualan = {
  /** Jam transaksi dari kolom created_at sale_items, mis. "16:40". */
  jam?: string;
  nama: string;
  nominal: number;
};

type ListPenjualanProps = {
  penjualan: Penjualan[];
};

export function ListPenjualan({ penjualan }: ListPenjualanProps) {
  return (
    <section aria-labelledby="penjualan-terakhir">
      <h2
        id="penjualan-terakhir"
        className="px-4 mt-6 mb-2 text-xs text-muted-foreground font-bold tracking-wider"
      >
        PENJUALAN TERAKHIR
      </h2>

      {penjualan.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">
          Belum ada penjualan hari ini.
        </p>
      ) : (
        <ul>
          {penjualan.map((item, index) => (
            <li
              key={`${item.nama}-${index}`}
              className="flex justify-between items-center py-3 px-4 text-sm font-medium border-b border-gray-100 last:border-b-0"
            >
              <span className="truncate">
                {item.jam ? `${item.jam} · ${item.nama}` : item.nama}
              </span>
              <span className="ml-4 shrink-0 tabular-nums">
                {formatRupiah(item.nominal)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

