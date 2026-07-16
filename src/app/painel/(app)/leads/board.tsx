"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Cliente, Lead, StatusKanban, Veiculo } from "@/generated/prisma/client";
import { moveLead } from "./actions";

type LeadComRelacoes = Lead & { cliente: Cliente; veiculo: Veiculo | null };

const COLUNAS: { status: StatusKanban; label: string }[] = [
  { status: "NOVO", label: "Novo" },
  { status: "ENTRAR_EM_CONTATO", label: "Entrar em contato" },
  { status: "AGUARDANDO_CLIENTE", label: "Aguardando cliente" },
  { status: "RETORNAR_PARA_CLIENTE", label: "Retornar para cliente" },
  { status: "NEGOCIANDO", label: "Negociando" },
  { status: "VENDA_CONCLUIDA", label: "Venda concluída" },
  { status: "PERDIDO", label: "Perdido" },
];

const ORIGEM_LABEL: Record<string, string> = {
  SITE: "Site",
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  INDICACAO: "Indicação",
  OUTRO: "Outro",
};

function LeadCard({ lead }: { lead: LeadComRelacoes }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 10,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-xl border border-zinc-200 bg-white p-3 shadow-sm active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <p className="text-sm font-medium text-brand-graphite">{lead.cliente.nome}</p>
      {lead.veiculo && (
        <p className="mt-1 text-xs text-brand-gray">
          {lead.veiculo.marca} {lead.veiculo.modelo}
        </p>
      )}
      <span className="mt-2 inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
        {ORIGEM_LABEL[lead.origem] ?? lead.origem}
      </span>
    </div>
  );
}

function Column({
  status,
  label,
  leads,
}: {
  status: StatusKanban;
  label: string;
  leads: LeadComRelacoes[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex min-w-[220px] flex-1 flex-col">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-brand-graphite">{label}</span>
        <span className="text-xs text-brand-gray">{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[120px] flex-col gap-2 rounded-xl p-2 transition-colors ${
          isOver ? "bg-zinc-200" : "bg-zinc-100"
        }`}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

export function Board({ leads: leadsIniciais }: { leads: LeadComRelacoes[] }) {
  const [leads, setLeads] = useState(leadsIniciais);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setLeads(leadsIniciais);
  }, [leadsIniciais]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const novoStatus = over.id as StatusKanban;
    const leadId = active.id as string;

    setLeads((atual) =>
      atual.map((lead) =>
        lead.id === leadId ? { ...lead, statusKanban: novoStatus } : lead,
      ),
    );

    startTransition(() => {
      moveLead(leadId, novoStatus);
    });
  }

  return (
    <DndContext id="leads-kanban" onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUNAS.map((coluna) => (
          <Column
            key={coluna.status}
            status={coluna.status}
            label={coluna.label}
            leads={leads.filter((lead) => lead.statusKanban === coluna.status)}
          />
        ))}
      </div>
    </DndContext>
  );
}
