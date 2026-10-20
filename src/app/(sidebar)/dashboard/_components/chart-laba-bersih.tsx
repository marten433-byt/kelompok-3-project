"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// Chart hanya menampilkan 7 hari terakhir, walau data yang masuk lebih banyak.
const JUMLAH_HARI_DITAMPILKAN = 7;

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

// Versi ringkas untuk label sumbu Y, mis. 465000 -> "Rp465 rb".
const ringkasanNumberFormatter = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const tanggalSingkatFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

const tanggalLengkapFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatRupiah(value: number) {
  return `${value < 0 ? "-" : ""}Rp${numberFormatter.format(Math.abs(value))}`;
}

function formatRupiahRingkas(value: number) {
  return `Rp${ringkasanNumberFormatter.format(value)}`;
}

// Tanggal ISO (YYYY-MM-DD) dibaca sebagai waktu lokal agar label tidak bergeser.
function keTanggal(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

export type LabaBersihHarian = {
  /** Tanggal dalam format ISO `YYYY-MM-DD`. */
  tanggal: string;
  labaBersih: number;
};

// Data dummy 12 hari. Ganti dengan data asli dari API/penyimpanan saat tersedia.
const dataDummy: LabaBersihHarian[] = [
  { tanggal: "2026-10-09", labaBersih: 210_000 },
  { tanggal: "2026-10-10", labaBersih: 265_000 },
  { tanggal: "2026-10-11", labaBersih: 180_000 },
  { tanggal: "2026-10-12", labaBersih: 320_000 },
  { tanggal: "2026-10-13", labaBersih: 275_000 },
  { tanggal: "2026-10-14", labaBersih: 240_000 },
  { tanggal: "2026-10-15", labaBersih: 355_000 },
  { tanggal: "2026-10-16", labaBersih: 310_000 },
  { tanggal: "2026-10-17", labaBersih: 420_000 },
  { tanggal: "2026-10-18", labaBersih: 385_000 },
  { tanggal: "2026-10-19", labaBersih: 295_000 },
  { tanggal: "2026-10-20", labaBersih: 465_000 },
];

/** Urutkan berdasarkan tanggal, lalu ambil 7 hari terakhir saja. */
export function ambilTujuhHariTerakhir(data: LabaBersihHarian[]) {
  return [...data]
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    .slice(-JUMLAH_HARI_DITAMPILKAN);
}

const chartConfig = {
  labaBersih: {
    label: "Laba bersih",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type ChartLabaBersihProps = {
  data?: LabaBersihHarian[];
};

export function ChartLabaBersih({ data = dataDummy }: ChartLabaBersihProps) {
  const dataTujuhHari = ambilTujuhHariTerakhir(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laba Bersih</CardTitle>
        <CardDescription>
          Laba bersih per tanggal selama 7 hari terakhir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dataTujuhHari.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Belum ada data laba bersih.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-64 w-full sm:h-72"
          >
            <LineChart
              accessibilityLayer
              data={dataTujuhHari}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="tanggal"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                  tanggalSingkatFormatter.format(keTanggal(String(value)))
                }
              />
              <YAxis
                width={64}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => formatRupiahRingkas(Number(value))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      tanggalLengkapFormatter.format(keTanggal(String(value)))
                    }
                    formatter={(value) => (
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          Laba bersih
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatRupiah(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Line
                dataKey="labaBersih"
                type="monotone"
                stroke="var(--color-labaBersih)"
                strokeWidth={2}
                dot={{ fill: "var(--color-labaBersih)", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

