import "server-only";

/**
 * Limitador de tentativas simples, em memória.
 *
 * Conta FALHAS por chave (ex.: IP no login) e bloqueia depois de MAX_FALHAS
 * dentro da janela. Uma tentativa bem-sucedida deve chamar `limparTentativas`.
 *
 * Observação: por ser em memória, funciona para 1 instância do servidor e é
 * zerado ao reiniciar. Para vários servidores/instâncias, trocar por Redis.
 */

type Registro = { falhas: number; expiraEm: number };

const tentativas = new Map<string, Registro>();

const MAX_FALHAS = 5;
const JANELA_MS = 10 * 60 * 1000; // 10 minutos

export function estaBloqueado(chave: string): boolean {
  const reg = tentativas.get(chave);
  if (!reg) return false;
  if (Date.now() > reg.expiraEm) {
    tentativas.delete(chave);
    return false;
  }
  return reg.falhas >= MAX_FALHAS;
}

export function registrarFalha(chave: string): void {
  const agora = Date.now();
  const reg = tentativas.get(chave);
  if (!reg || agora > reg.expiraEm) {
    tentativas.set(chave, { falhas: 1, expiraEm: agora + JANELA_MS });
    return;
  }
  reg.falhas += 1;
}

export function limparTentativas(chave: string): void {
  tentativas.delete(chave);
}
