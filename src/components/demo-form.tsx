"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DemoForm() {
  const [name, setName] = React.useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Nama masih kosong.");
      return;
    }

    toast.success(`Halo, ${trimmedName}! shadcn/ui sudah berjalan.`);
    setName("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="demo-name">Nama</Label>
        <Input
          id="demo-name"
          name="name"
          placeholder="Masukkan nama kamu"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
        />
      </div>
      <Button type="submit" className="w-fit">
        Kirim
      </Button>
    </form>
  );
}
