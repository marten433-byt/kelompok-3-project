/** Formatter jam 24 jam pada zona waktu WIB. */
const jamFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

/**
 * Timestamp ISO (mis. created_at pada sale_items) menjadi jam WIB "HH:mm".
 * Mengembalikan null bila nilainya kosong atau tidak valid.
 */
export function formatJamWib(iso: string | null | undefined): string | null {
  if (!iso) return null;

  const tanggal = new Date(iso);
  if (Number.isNaN(tanggal.getTime())) return null;

  return jamFormatter.format(tanggal);
}
