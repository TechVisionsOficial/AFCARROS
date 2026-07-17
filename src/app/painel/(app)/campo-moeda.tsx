"use client";

/**
 * Campo de dinheiro que formata enquanto se digita: "152900" aparece como
 * "R$ 152.900". Trabalha em reais inteiros (sem centavos) — preço de carro é
 * redondo, e assim não dá para confundir vírgula com ponto (o problema que fazia
 * "152,9" virar R$ 152,90 em vez de R$ 152.900).
 *
 * O estado guarda só os dígitos ("152900"); um input escondido envia esse valor
 * limpo no formulário, então a server action recebe um número pronto. O input
 * visível mostra a versão formatada.
 */

function formatar(digitos: string): string {
  if (!digitos) return "";
  return "R$ " + Number(digitos).toLocaleString("pt-BR");
}

export function CampoMoeda({
  name,
  value,
  onChange,
  required,
  className,
}: {
  name: string;
  /** Só dígitos, em reais. Ex.: "152900". */
  value: string;
  onChange: (digitos: string) => void;
  required?: boolean;
  className?: string;
}) {
  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        value={formatar(value)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder="R$ 0"
        className={className}
      />
      {/* Valor limpo que vai no formulário (a server action faz Number disso). */}
      <input type="hidden" name={name} value={value} />
    </>
  );
}
