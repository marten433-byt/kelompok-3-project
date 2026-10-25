# SDFDBas — MyOmset

MyOmset is a daily revenue ("omset") tracker for small food stalls. Each day starts with an opening capital (*modal awal*), every sale is recorded with a tap, and closing the day locks the numbers. Net profit (`omzet − modal`) is then shown on the dashboard and in the history screen.

This repository is the **Kelompok 3** project: Next.js 16 (App Router) + shadcn/ui on the front end, Supabase as the data store (schema `myomset`).

> The npm package is called `sdfdbas` because npm does not allow capital letters in project names. The name used in the UI is **Omsetku** / **MyOmset**.

## Requirements

| Requirement | Notes |
| --- | --- |
| Node.js **20.9 or newer** | `next@16.4.2` declares `engines.node: ">=20.9.0"`. Verified locally with Node 24. |
| npm | `package-lock.json` is committed, so install with npm to keep versions identical. |
| Supabase project | Must expose the `myomset` schema with `users`, `products`, `daily_sessions`, and `sale_items`. Ask the team for access. |
| Environment file | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see below). |

## Environment variables

`.env` is git-ignored (`.env*` in `.gitignore`) and is **not** part of the repository. Create it in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<publishable-or-anon-key>"
```

The values are read by `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server components and server actions), and `src/lib/supabase/proxy.ts` (session refresh). Use the publishable/anon key only — a `service_role` key would be exposed to the browser.

## How to run the app

```bash
npm install     # skip when node_modules already exists
npm run dev     # dev server on http://localhost:3000
```

Open <http://localhost:3000> and press **Start** to go to `/main-menu`.

### First-run walkthrough

1. Fill in `.env` first; without it every Supabase request fails and the screens render empty.
2. Open `/main-menu` and press **Buka sesi**. Enter the opening capital (0 is allowed) and an optional note.
3. Record a sale: press a quick amount (`+5k` … `+25k`) or **Lainnya** to type a product name and price.
4. Press **Tutup sesi** to lock the day; the badge switches from "Sesi buka" to "Sesi tutup". **Buka kembali** re-opens it.
5. Review `/dashboard` (today vs. yesterday profit, 7-day chart) and `/riwayat` (every daily session).

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Turbopack dev server. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint (`eslint.config.mjs`: `eslint-config-next` core-web-vitals + TypeScript). |

There is no test runner configured yet (`npm test` does not exist).

## Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Landing screen with the **Start** button. |
| `/main-menu` | `src/app/(sidebar)/main-menu/page.tsx` | Today's session: summary, open/close session, quick sale buttons, latest sales. |
| `/dashboard` | `src/app/(sidebar)/dashboard/page.tsx` | Net profit today vs. yesterday (`card-banding`) plus a 7-day line chart (`chart-laba-bersih`). |
| `/riwayat` | `src/app/(sidebar)/riwayat/page.tsx` | All daily sessions with capital, revenue, net profit, and margin. |

The three inner routes live under the `(sidebar)` route group, which adds the collapsible sidebar, the sticky header, and the theme toggle.

## Stack

| Part | Version / details |
| --- | --- |
| Next.js | 16.4.2 (App Router, `src/` directory, Turbopack, `cacheComponents`, `partialPrefetching`) |
| React | 19.3 with TypeScript 5 |
| Styling | Tailwind CSS v4 via `@tailwindcss/turbopack`; tokens in `src/app/globals.css` |
| UI kit | shadcn/ui (style `radix-nova`, base color `neutral`) on top of `radix-ui` |
| Icons | `lucide-react` |
| Data | Supabase (`@supabase/ssr`, `@supabase/supabase-js`), schema `myomset` |
| Charts | `recharts` through `src/components/ui/chart.tsx` |
| Theme | `next-themes` (class-based dark mode) |
| Toasts | `sonner` |
| Fonts | `geist` (local files, no Google Fonts request) |

## Project structure

```
src/
├─ proxy.ts                       # Next.js 16 proxy entry (calls updateSession)
├─ app/
│  ├─ globals.css                 # Tailwind v4 + shadcn theme tokens (light/dark)
│  ├─ layout.tsx                  # Geist fonts, ThemeProvider, TooltipProvider, Toaster
│  ├─ page.tsx                    # landing screen
│  └─ (sidebar)/
│     ├─ layout.tsx               # sidebar shell + header (SidebarTrigger, ModeToggle)
│     ├─ main-menu/
│     │  ├─ action.ts             # server actions: tambahItemPenjualan, bukaSesi, tutupSesi
│     │  ├─ page.tsx              # today's session, owner, latest sales
│     │  └─ _components/          # summary, kontrol_sesi, tombol_harga, list_penjualan, waktu_realtime, main_menu_client
│     ├─ dashboard/
│     │  ├─ page.tsx              # loads every session, computes net profit per day
│     │  └─ _components/          # card-banding, chart-laba-bersih
│     └─ riwayat/
│        ├─ page.tsx              # loads every session
│        └─ _components/          # list-transaksi
├─ components/
│  ├─ common/                     # app-sidebar, mode-toggle, theme-provider
│  ├─ demo-form.tsx               # leftover shadcn demo, not imported anywhere
│  └─ ui/                         # shadcn/ui components
├─ hooks/
│  ├─ use-mobile.ts               # breakpoint hook used by the sidebar
│  └─ .gitkeep
├─ lib/
│  ├─ supabase/                   # client.ts, server.ts, proxy.ts
│  ├─ utils.ts                    # cn() helper
│  └─ waktu.ts                    # ISO timestamp -> "HH:mm" (Asia/Jakarta)
└─ types/
   └─ database-type.d.ts          # User, Product, DailySession, SaleItem
```

## Data model

Every query targets the `myomset` schema (`supabase.schema("myomset")`). The TypeScript shapes live in `src/types/database-type.d.ts`.

| Table | Purpose | Columns used by the app |
| --- | --- | --- |
| `users` | Business profile that owns the data. | `user_id`, `full_name`, `business_name`, `phone`, `email`, `created_at` (`password_hash` is unused) |
| `products` | Product catalogue, also created on demand from a sale name. | `product_id`, `user_id`, `name`, `category_id`, `created_at` |
| `daily_sessions` | One row per day. | `session_id`, `user_id`, `session_date`, `opening_capital`, `total_revenue`, `transaction_count`, `status` (`OPEN`/`CLOSED`), `opened_at`, `closed_at`, `notes` |
| `sale_items` | One row per recorded sale. | `sale_item_id`, `product_id`, `session_id`, `unit_price`, `created_at` |

Behaviour worth knowing:

- **Net profit is derived, never stored**: every screen computes `total_revenue - opening_capital`.
- `tambahItemPenjualan()` finds or creates the `products` row by exact name, inserts the `sale_items` row, then recalculates `total_revenue` and `transaction_count` from scratch (`sinkronkanTotalSesi()`), so the numbers stay correct even if a database trigger also updates the session.
- Sales are only accepted while today's session exists and is `OPEN`; totals are final after **Tutup sesi**.
- Dates are always resolved in **Asia/Jakarta (WIB)**, regardless of the browser or server timezone.

## Test accounts

**No credentials are required — the app has no login yet.** `src/lib/supabase/proxy.ts` refreshes the Supabase session cookie, but the redirect-to-`/login` block is commented out and there is no `/login` or sign-up route. Anyone who can open the URL works on the same shared data set.

The "account" that owns the data is just a row in `myomset.users`, picked automatically by `userUntukSesiBaru()` in `src/app/(sidebar)/main-menu/action.ts`:

1. the `user_id` of the newest row in `myomset.daily_sessions`, otherwise
2. the smallest `user_id` in `myomset.users`.

That id becomes the owner of new sessions and new products. The outlet label on `/main-menu` comes from `users.business_name`; before any session exists it falls back to `"Batagor"` (`outletAktif` in `_components/summary.tsx`). The sidebar footer ("Hulu / Pengguna") is a static placeholder, not a signed-in user.

### Checking the test owner

Supabase dashboard → Table editor → schema `myomset` → `users`, or run:

```sql
select user_id, full_name, business_name, email
from myomset.users
order by user_id;
```

An empty `users` table blocks session creation ("Data pengguna belum tersedia. Sesi tidak bisa dibuka."). Seed one row:

```sql
insert into myomset.users (full_name, business_name, phone, email, password_hash)
values ('Test Owner', 'Batagor', '081200000000', 'test@example.com', 'unused')
returning user_id;
```

Add `user_id` explicitly (for example `1`) if the column has no identity/sequence default. `password_hash` is required by the schema but is never read or written by the app.

For a clean demo run you can reset the transactional tables (destructive — only on a test project):

```sql
delete from myomset.sale_items;
delete from myomset.daily_sessions;
```

Before using this outside the classroom, replace the shared anonymous access with real Supabase Auth — the guard is already sketched in `src/lib/supabase/proxy.ts`.

## AI usage

This project was built with an AI coding assistant (Cline inside VS Code) used as a pair programmer. Where it helped:

- Scaffolding UI with the shadcn/ui CLI (`npx shadcn@latest add ...`) and wiring the sidebar shell, dialogs, and theme toggle.
- Drafting and refactoring TypeScript, server actions, Supabase queries, and Tailwind classes (for example `tambahItemPenjualan()` and `sinkronkanTotalSesi()`).
- Working through Next.js 16 specifics: `cacheComponents`, `await connection()`, `export const instant = false`, and the `proxy.ts` convention.
- Drafting this README.

How the output was checked:

- Every change was reviewed by a team member before commit, then exercised in the running app (`npm run dev`): open and close a session, add sales, verify `/dashboard` and `/riwayat`.
- `npm run lint` and `npm run build` are the gate for committed changes.
- Money math, the WIB timezone handling, and the row shapes were compared against `src/types/database-type.d.ts` and the Supabase tables.
- No `.env` values, keys, or personal data were shared with AI tools; AI output was treated as a first draft, not as a source of truth.

Known gaps: there are no automated tests yet and no authentication, which are the riskiest areas for AI-assisted code — review those first.

## Adding shadcn/ui components

```bash
npx shadcn@latest add [component-name]

# example
npx shadcn@latest add form calendar
```

Components are generated into `src/components/ui/`. Usage:

```tsx
import { Button } from "@/components/ui/button";

export function Example() {
  return <Button>Click me</Button>;
}
```

`components.json` sets the style to `radix-nova`, base color `neutral`, icon library `lucide`, and the aliases `@/components`, `@/lib/utils`, `@/hooks`.

Installed: `avatar`, `badge`, `button`, `card`, `chart`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `table`, `tabs`, `textarea`, `tooltip`. `select`, `table`, `tabs`, `skeleton`, and `src/components/demo-form.tsx` are not imported anywhere yet.

## UI notes

- `Toaster` (Sonner) and `TooltipProvider` are mounted in `src/app/layout.tsx`, so `toast()` works in any client component.
- Dark mode uses the `.dark` class on `<html>`, driven by `next-themes` (`ThemeProvider`, `defaultTheme="system"`). `ModeToggle` in the `(sidebar)` header offers Terang / Gelap / Ikuti sistem and stores the choice in `localStorage`.
- The sidebar open state is persisted in the `sidebar_state` cookie and read in `src/app/(sidebar)/layout.tsx`.
- Fonts come from the local `geist` package, so no request is made to Google Fonts.
- Currency is formatted with `Intl.NumberFormat("id-ID")` as `Rp…`; the layout language is `id`.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Empty cards or charts, console logs "Gagal mengambil …" | Missing or wrong `.env`, or RLS/permissions on the `myomset` schema. |
| "Data pengguna belum tersedia. Sesi tidak bisa dibuka." | `myomset.users` has no rows (see [Test accounts](#test-accounts)). |
| "Belum ada sesi hari ini." / quick buttons disabled | Open the session first; sales stay disabled until the status is `OPEN`. |
| Numbers look one day off | Session dates are WIB-based; compare them against Asia/Jakarta rather than UTC. |
| Build/deploy fails after cloning | Node older than 20.9, or `.env` not set on the host. |

## References

- [Next.js documentation](https://nextjs.org/docs)
- [shadcn/ui documentation](https://ui.shadcn.com/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Supabase documentation](https://supabase.com/docs)
- [Recharts](https://recharts.org/)

