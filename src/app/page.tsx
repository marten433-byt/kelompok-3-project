import { ArrowUpRightIcon, CheckIcon } from "lucide-react";

import { DemoForm } from "@/components/demo-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const stack = [
  "Next.js 16 (App Router)",
  "React 19 + TypeScript",
  "Tailwind CSS v4",
  "shadcn/ui + Radix UI",
];

const components = [
  "avatar",
  "badge",
  "button",
  "card",
  "dialog",
  "dropdown-menu",
  "input",
  "label",
  "select",
  "separator",
  "skeleton",
  "sonner",
  "table",
  "tabs",
  "textarea",
  "tooltip",
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-14">
      <header className="flex flex-col gap-4">
        <Badge variant="outline" className="w-fit">
          Starter kosong siap dikembangkan
        </Badge>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          SDFDBas
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Proyek Next.js yang sudah terpasang komponen shadcn/ui. Mulai menulis
          halaman di{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm">
            src/app/page.tsx
          </code>{" "}
          dan tambahkan komponen baru dengan{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm">
            npx shadcn@latest add [nama]
          </code>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a
              href="https://ui.shadcn.com/docs/components"
              target="_blank"
              rel="noopener noreferrer"
            >
              Dokumentasi shadcn/ui
              <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Dokumentasi Next.js
            </a>
          </Button>
        </div>
      </header>

      <Separator />

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stack terpasang</CardTitle>
            <CardDescription>
              Konfigurasi dasar sudah beres, tinggal dipakai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {stack.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckIcon className="size-4 text-muted-foreground" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coba komponen</CardTitle>
            <CardDescription>
              Memakai Input, Label, Button, dan toast dari Sonner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DemoForm />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Komponen tersedia</CardTitle>
          <CardDescription>
            Semua komponen berikut ada di{" "}
            <code className="font-mono">src/components/ui</code>.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">{components.length} komponen</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {components.map((name) => (
              <Badge key={name} variant="outline" className="font-mono">
                {name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
