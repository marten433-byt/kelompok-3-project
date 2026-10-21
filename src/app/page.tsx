import Link from "next/link";
import { WalletIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-1 flex-col items-center justify-center gap-6 px-6 py-14 text-center">
      <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Selamat Datang di MyOmset
      </h1>
      <span className="flex size-20 items-center justify-center rounded-2xl bg-muted">
        <WalletIcon aria-hidden="true" className="size-10 text-muted-foreground" />
      </span>
      <Button asChild size="lg" className="h-10 min-w-32">
        <Link href="/main-menu">Start</Link>
      </Button>
    </main>
  );
}

