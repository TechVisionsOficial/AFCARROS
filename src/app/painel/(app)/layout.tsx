import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PainelSidebar } from "./painel-sidebar";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/painel/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <PainelSidebar nome={session.nome} />
      <main className="min-w-0 flex-1 bg-zinc-50 p-4 md:p-8">{children}</main>
    </div>
  );
}
