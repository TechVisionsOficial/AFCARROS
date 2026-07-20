"use client";

/**
 * Campo numérico que formata com ponto de milhar enquanto se digita: "152900"
 * aparece como "152.900". Trabalha em números inteiros — assim não dá para
 * confundir vírgula com ponto (o problema que fazia "152,9" virar 152,90 em vez
 * de 152.900).
 *
 * Com o prefixo "R$ " (padrão) vira um campo de dinheiro; com prefixo "" vira um
 * campo de número puro (usado no km: "35.700").
 *
 * O estado guarda só os dígitos ("152900"); um input escondido envia esse valor
 * limpo no formulário, então a server action recebe um número pronto. O input
 * visível mostra a versão formatada.
 */

function formatar(digitos: string, prefixo: string): string {
  if (!digitos) return "";
  return prefixo + Number(digitos).toLocaleString("pt-BR");
}

export function CampoMoeda({
  name,
  value,
  onChange,
  required,
  className,
  prefixo = "R$ ",
  placeholder,
}: {
  name: string;
  /** Só dígitos. Ex.: "152900". */
  value: string;
  onChange: (digitos: string) => void;
  required?: boolean;
  className?: string;
  /** "R$ " (dinheiro, padrão) ou "" (número puro, ex.: km). */
  prefixo?: string;
  placeholder?: string;
}) {
  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        value={formatar(value, prefixo)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        placeholder={placeholder ?? (prefixo ? `${prefixo}0` : "0")}
        className={className}
      />
      {/* Valor limpo que vai no formulário (a server action faz Number disso). */}
      <input type="hidden" name={name} value={value} />
    </>
  );
}
