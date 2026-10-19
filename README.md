# SDFDBas

Proyek kosong Next.js yang sudah terpasang **shadcn/ui**, siap dipakai untuk mulai membangun aplikasi.

## Stack

| Bagian | Versi / Keterangan |
| --- | --- |
| Next.js | 16 (App Router, `src/` directory, Turbopack) |
| React | 19 + TypeScript |
| Tailwind CSS | v4 (`@tailwindcss/turbopack`) |
| Komponen UI | shadcn/ui (preset `nova`, library `radix`) |
| Ikon | lucide-react |
| Toast | sonner (terpasang di root layout) |
| Font | Geist lokal lewat paket `geist` (tanpa request ke Google Fonts) |

## Menjalankan

```bash
npm install     # jika node_modules belum ada
npm run dev     # http://localhost:3000
```

Perintah lain:

```bash
npm run build   # build produksi
npm run start   # jalankan hasil build
npm run lint    # cek ESLint
```

## Struktur

```
src/
├─ app/
│  ├─ globals.css     # Tailwind v4 + design token shadcn (light/dark)
│  ├─ layout.tsx      # font, TooltipProvider, Toaster
│  └─ page.tsx        # halaman contoh (boleh dihapus/diganti)
├─ components/
│  ├─ demo-form.tsx   # contoh client component + toast
│  └─ ui/             # komponen shadcn/ui
├─ lib/
│  └─ utils.ts        # re-export helper cn()
└─ hooks/             # tempat menaruh custom hook
```

Konfigurasi shadcn ada di `components.json` (style `radix-nova`, base color `neutral`,
alias `@/components`, `@/lib/utils`, `@/hooks`).

## Menambah komponen shadcn

```bash
npx shadcn@latest add [nama-komponen]
```

Contoh:

```bash
npx shadcn@latest add form calendar
```

Komponen akan dibuat di `src/components/ui/`. Pemakaian:

```tsx
import { Button } from "@/components/ui/button";

export function Contoh() {
  return <Button>Klik saya</Button>;
}
```

Komponen yang sudah terpasang: `avatar`, `badge`, `button`, `card`, `dialog`,
`dropdown-menu`, `input`, `label`, `select`, `separator`, `skeleton`, `sonner`,
`table`, `tabs`, `textarea`, `tooltip`.

## Catatan

- `Toaster` dari Sonner sudah dipasang di `src/app/layout.tsx`, jadi `toast()` bisa
  langsung dipakai di client component.
- `TooltipProvider` juga sudah membungkus seluruh aplikasi.
- Tema gelap memakai class `.dark` pada elemen `html` (token sudah tersedia di
  `globals.css`). Tambahkan `next-themes` bila ingin tombol pengubah tema.
- Nama paket di `package.json` adalah `sdfdbas` karena npm tidak mengizinkan huruf
  kapital pada nama proyek.

## Referensi

- [Dokumentasi Next.js](https://nextjs.org/docs)
- [Dokumentasi shadcn/ui](https://ui.shadcn.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

miau