"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function PeriodoSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const periodo = searchParams.get("periodo") ?? "mes";

  return (
    <select
      value={periodo}
      onChange={(e) => router.push(`${pathname}?periodo=${e.target.value}`)}
      className="h-9 w-36 rounded-md border border-zinc-300 px-2 text-sm"
    >
      <option value="semana">Semana</option>
      <option value="mes">Mês</option>
      <option value="ano">Ano</option>
    </select>
  );
}
