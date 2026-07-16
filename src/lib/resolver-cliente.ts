import "server-only";
import { prisma } from "./prisma";

/**
 * Resolve o cliente de um formulário que usa o componente SeletorCliente.
 * Se o campo "novo cliente" tiver nome preenchido, cria um cliente novo;
 * senão usa o id selecionado. Retorna null se nada foi informado.
 * Os nomes dos campos seguem o prefixo (ex.: prefix="fornecedor" →
 * fornecedorId, fornecedorNovoNome, fornecedorNovoTelefone).
 */
export async function resolverCliente(
  formData: FormData,
  prefix: string,
): Promise<string | null> {
  const novoNome = String(formData.get(`${prefix}NovoNome`) ?? "").trim();
  if (novoNome) {
    const novoTelefone = String(formData.get(`${prefix}NovoTelefone`) ?? "").trim();
    const cliente = await prisma.cliente.create({
      data: { nome: novoNome, telefone: novoTelefone || null },
    });
    return cliente.id;
  }
  const id = String(formData.get(`${prefix}Id`) ?? "");
  return id || null;
}
