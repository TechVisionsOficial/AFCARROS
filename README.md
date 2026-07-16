# AFCARROS — sistema de estoque e leads

Sistema para a loja de compra e venda de carros e motos AFCARROS: site público (vitrine) + painel admin (estoque, clientes, Kanban de leads e dashboard).

## Stack

- **Frontend (site + painel admin)**: Next.js (React + TypeScript)
- **Backend/API**: Node.js + TypeScript
- **Banco de dados**: PostgreSQL
- **Fotos dos veículos**: upload direto no formulário do painel, salvas em serviço de storage de imagens (sugestão: Cloudinary)
- **Hospedagem**: ainda em aberto (a decidir por custo — opções: Vercel, Railway, VPS)

Java foi avaliado e descartado: o escopo (vitrine + CRM simples de uma revenda) não justifica o boilerplate extra; TypeScript cobre landing page (SSR/SEO) e painel com a mesma stack.

## Escopo

### Site público
- Landing page com scroll: nome da loja no topo → foto do dono → estoque de veículos (carros e motos)
- Cada veículo com botões diretos de WhatsApp, Instagram e Facebook

### Painel admin (login)
- Acesso: dono + equipe de manutenção, com espaço para vendedor no futuro (campo `papel`)
- Cadastro de veículos (com upload de fotos), clientes e gastos
- Kanban de leads
- Dashboard com filtro de período (semana/mês/ano)

## Banco de dados

### `usuarios`
| Coluna | Tipo | Obs |
|---|---|---|
| id | uuid | PK |
| nome | text | |
| email | text | único |
| senha_hash | text | |
| papel | enum | `DONO`, `EQUIPE` (espaço para `VENDEDOR` no futuro) |
| criado_em | timestamp | |

### `veiculos`
| Coluna | Tipo | Obs |
|---|---|---|
| id | uuid | PK |
| tipo | enum | `CARRO`, `MOTO` |
| marca, modelo | text | |
| ano | int | |
| km | int | |
| condicao | enum | `NOVO`, `SEMINOVO` |
| status | enum | `DISPONIVEL`, `RESERVADO`, `VENDIDO` |
| descricao | text | |
| preco_venda | numeric | preço anunciado — público |
| preco_compra | numeric | somente admin |
| preco_minimo | numeric | somente admin — piso de desconto para fechar venda |
| data_aquisicao | date | somente admin — alimenta o alerta de estoque parado |
| origem_aquisicao | enum | somente admin — `LEILAO`, `TROCA`, `PARTICULAR`, `CONSIGNADO`, `OUTRO` |
| criado_em / atualizado_em | timestamp | |

Campos "somente admin" nunca são retornados pela API pública do site — só pelas rotas autenticadas do painel.

### `veiculo_fotos`
| Coluna | Tipo | Obs |
|---|---|---|
| id | uuid | PK |
| veiculo_id | uuid | FK → veiculos |
| url | text | endereço do arquivo salvo |
| ordem | int | define a foto de capa |

### `gastos`
| Coluna | Tipo | Obs |
|---|---|---|
| id | uuid | PK |
| veiculo_id | uuid | FK → veiculos |
| categoria | enum | `MANUTENCAO`, `DOCUMENTACAO`, `ESTETICA`, `FUNILARIA`, `OUTROS` |
| valor | numeric | |
| descricao | text | |
| data | date | |

### `clientes`
| Coluna | Tipo | Obs |
|---|---|---|
| id | uuid | PK |
| nome, telefone, email | text | |
| criado_em | timestamp | |

### `leads`
| Coluna | Tipo | Obs |
|---|---|---|
| id | uuid | PK |
| cliente_id | uuid | FK → clientes |
| veiculo_id | uuid | FK → veiculos, opcional |
| responsavel_id | uuid | FK → usuarios, opcional |
| origem | enum | `SITE`, `WHATSAPP`, `INSTAGRAM`, `FACEBOOK`, `INDICACAO`, `OUTRO` |
| status_kanban | enum | ver estágios abaixo |
| criado_em / atualizado_em | timestamp | |

## Kanban de leads

Estágios de `status_kanban`, em ordem:

1. `NOVO` — Novo
2. `ENTRAR_EM_CONTATO` — Entrar em contato
3. `AGUARDANDO_CLIENTE` — Aguardando cliente
4. `RETORNAR_PARA_CLIENTE` — Retornar para cliente
5. `NEGOCIANDO` — Negociando
6. `VENDA_CONCLUIDA` — Venda concluída
7. `PERDIDO` — Perdido

## Formulário de anúncio (painel admin)

Dividido em duas seções:
- **Dados do veículo** — tipo, marca, modelo, ano, km, condição, descrição, fotos (aparece no site)
- **Financeiro** (somente admin) — preço de compra, gastos lançados um a um por categoria, preço de venda, preço mínimo. Margem cheia e margem mínima garantida são calculadas automaticamente, nunca digitadas.

## Dashboard

Filtro de período: semana / mês / ano.

- Valor em estoque (R$)
- Margem de lucro esperada (`preco_venda - preco_compra - soma(gastos)` dos veículos em estoque)
- Faturamento no período
- Ticket médio de venda
- Funil de leads (contagem por estágio do Kanban)
- Alerta de veículos parados há mais de 60 dias sem venda (usa `data_aquisicao`)

## Design

Logo definido (pacote em `public/branding/`, versões fundo claro/escuro/transparente).

- **Wordmark / títulos / botões**: Saira Condensed, peso 800 (ExtraBold), itálico, letter-spacing ≈ -0.5px
- **Texto de apoio / rótulos**: Space Grotesk, peso 600 (SemiBold), maiúsculas, letter-spacing ≈ 4.5px
- **Cores**: vermelho `#DA1F2B`, grafite `#141416`, cinza texto `#6F6D66`
- **Tagline**: "OKM · Seminovos · Importados"
- Ambas as fontes são gratuitas via Google Fonts (sem necessidade de arquivo local)

## Decisões pendentes

- Hospedagem: aguardando levantamento de custo com o dono

## Como rodar localmente

```bash
docker compose up -d        # sobe o Postgres de desenvolvimento (porta 5432)
npm install
npx prisma migrate dev      # aplica o schema no banco
npm run dev                 # site em http://localhost:3000
```

Credenciais do banco local (em `.env`, não versionado): usuário `afcarros`, senha `afcarros`, banco `afcarros`.

## Autenticação do painel

Login por e-mail/senha (`usuarios.senha_hash` com bcrypt) e sessão em cookie httpOnly assinado (JWT via `jose`, chave em `AUTH_SECRET` no `.env`). Middleware (`src/middleware.ts`) protege todas as rotas `/painel/*`, exceto `/painel/login`.

Para criar ou atualizar um usuário (dono ou equipe), rodar o seed com variáveis de ambiente — se o e-mail já existir, atualiza nome/senha/papel; senão cria um novo:
```bash
SEED_ADMIN_EMAIL="..." SEED_ADMIN_NOME="..." SEED_ADMIN_SENHA="..." SEED_ADMIN_PAPEL="DONO" npx tsx prisma/seed.ts
```
`SEED_ADMIN_PAPEL` aceita `DONO` ou `EQUIPE` (padrão `EQUIPE` se omitido).

Usuários atuais:
- Alexandro Ferreira — `alexandro@afcarros.com`, papel `DONO`
- DevConsultoria — `dev@afcarros.com`, papel `EQUIPE`

Senhas geradas/definidas na conversa com o dono, não guardadas neste arquivo — recomendado trocar periodicamente rodando o seed novamente com a mesma técnica.

## Status

Projeto Next.js estruturado (`create-next-app`, App Router, TypeScript, Tailwind v4). Fontes da marca (Saira Condensed / Space Grotesk) e cores configuradas em `src/app/layout.tsx` e `src/app/globals.css`. Logo salvo em `public/branding/` (fundo claro, fundo escuro, transparente) e já usado na home de exemplo.

Banco de dados: Postgres local via Docker Compose, schema completo aplicado com Prisma (`prisma/schema.prisma`, migration `init` já rodada) — tabelas `usuarios`, `veiculos`, `veiculo_fotos`, `gastos`, `clientes` e `leads` criadas.

Login do painel admin funcionando (`/painel/login`), sessão protegida por middleware, layout do painel com navegação lateral (Dashboard, Estoque, Leads, Clientes) e logout — testado ao vivo no navegador. Dois usuários criados: Alexandro Ferreira (`DONO`) e DevConsultoria (`EQUIPE`).

Kanban de leads funcionando em `/painel/leads` (`src/app/painel/(app)/leads/`): 7 colunas, arrastar-e-soltar com `@dnd-kit/core` persistindo no banco, e formulário "+ Novo lead" (cria cliente + lead). Testado ao vivo no navegador, incluindo persistência após reload.

Estoque funcionando em `/painel/estoque` (`src/app/painel/(app)/estoque/`): listagem em cards com foto de capa, status e margem; formulário "+ Novo veículo" com seção pública (tipo, marca, modelo, ano, km, condição, descrição, fotos) e seção financeira somente-admin (compra, gastos itemizados por categoria, venda, mínimo, margem cheia/mínima calculadas ao vivo). Upload de fotos salva localmente em `public/uploads/veiculos/<id>/` (pasta fora do git — ver seção Design/Stack sobre trocar para Cloudinary/S3 em produção). Testado ao vivo, incluindo upload de arquivo e persistência.

Dashboard real em `/painel` (`src/app/painel/(app)/page.tsx`): filtro de período (semana/mês/ano) via querystring, cards de valor em estoque, margem esperada, faturamento e ticket médio, alerta de veículos parados há mais de 60 dias, e funil de leads por estágio do Kanban. Faturamento usa `preco_venda_real` quando o veículo é marcado como vendido (campo novo, junto com `vendido_em`, adicionados ao schema — migration `veiculo_venda`). Testado ao vivo com dados simulados (criados e removidos depois do teste), conferindo os cálculos manualmente.

Botão "Marcar como vendido" em cada card do Estoque (`vender-veiculo.tsx`): abre um miniformulário com preço real da venda (pré-preenchido com o anunciado, editável) e data, atualiza `status`, `preco_venda_real` e `vendido_em`, e dispara uma animação de confete (`canvas-confetti`) ao confirmar. Atualiza estoque e dashboard juntos (`revalidatePath` nos dois). Testado ao vivo, incluindo o cálculo de margem realizada refletindo o preço negociado.

Site público (`src/app/page.tsx`) construído: hero em tela cheia com o logo e seta animada, seção "Alexandro Ferreira" com foto (`public/team/alexandro.jpg`) revelando ao rolar (`framer-motion`, `whileInView`), vitrine de estoque puxando os veículos reais (`DISPONIVEL`/`RESERVADO`) com botões de WhatsApp (mensagem pré-preenchida com o carro), Instagram e Facebook, e rodapé com os mesmos contatos. Contatos reais centralizados em `src/lib/contato.ts` (WhatsApp `+55 11 95555-6787`, Instagram `@afcarros`, Facebook). Testado via inspeção de DOM/accessibility tree (a ferramenta de screenshot usada nesta sessão não captura corretamente páginas roladas — limitação da ferramenta, não do código; confirmado isolando o problema com um elemento de teste simples).

Bug corrigido no caminho: `<html>` tinha `height: 100%` (via `h-full` no layout raiz), o que travava a altura do documento na altura da viewport — inofensivo em telas de uma página só (painel), mas quebrava páginas mais altas que uma tela (o site público). Trocado por `min-h-screen` no `<body>`, sem `h-full` no `<html>`.

Navbar fixa (`src/app/navbar.tsx`): invisível no topo, aparece (fade + slide) quando o usuário rola além de ~70% da altura da tela, com um botão "início" em formato pill (fundo escuro arredondado + logo) e links para as seções Estoque/Sobre + CTA de WhatsApp. O logo do hero desaparece gradualmente conforme rola (`src/app/hero.tsx`). Ambos os efeitos usam listener de `scroll` nativo (`window.addEventListener`) em vez do `useScroll`/`useMotionValueEvent` do framer-motion — esse hook depende de um loop de `requestAnimationFrame` que fica pausado em abas em segundo plano (descoberto ao testar), então a versão nativa é mais simples e mais confiável independente do estado da aba.

**Como o painel liga com o site:** o site público (`src/app/page.tsx`) e o painel admin leem e escrevem na mesma tabela `veiculos` do Postgres — não há sincronização manual nem exportação. Ao cadastrar um veículo em `/painel/estoque/novo` ou marcar como vendido, a ação do servidor chama `revalidatePath("/")` além de revalidar as páginas do painel, para o Next.js invalidar o cache da home e ela buscar os dados atualizados no próximo acesso (isso é necessário para produção; sem isso a home poderia ficar com uma versão em cache desatualizada). A home só mostra veículos com status `DISPONIVEL` ou `RESERVADO` — assim que um é marcado como vendido, some do site automaticamente. Testado ao vivo: veículo criado no banco apareceu no site imediatamente após reload.

Arte decorativa no hero (`src/app/hero-artwork.tsx`): linhas diagonais no motivo do logo (bem sutis, opacity ~0.05) ao fundo. A silhueta de carro (com rodas animadas) foi testada e removida a pedido do dono — não agradou visualmente.

Tela de Clientes pronta em `/painel/clientes` (`src/app/painel/(app)/clientes/page.tsx`): lista somente-leitura com nome, contato, quantidade de leads, status e origem do lead mais recente, e data de cadastro. Clientes continuam sendo criados só pelo formulário de lead (não há cadastro direto de cliente aqui — decisão consciente pra não duplicar fluxo). Testado ao vivo criando um lead e conferindo que o cliente aparece com os dados corretos.

Corrigido no caminho: os arquivos de logo (`public/branding/*.png`) têm proporção real 840×231 (não 4:1 como os `width`/`height` declarados nos componentes assumiam antes — causava leve distorção sutil e avisos do Next.js em dev). Ajustado em todos os usos (hero, navbar, rodapé, sidebar do painel, login) para refletir a proporção real do arquivo. O mesmo para a foto do Alexandro (`public/team/alexandro.jpg`, proporção real 1085×1449).

Bug corrigido: o botão "Sair" (`src/app/painel/(app)/layout.tsx`) ficava no final da barra lateral, que "esticava" junto com a altura da página inteira (`justify-between` num container sem altura própria). Em telas com pouco conteúdo (poucos veículos/leads) o botão aparecia normalmente no rodapé da tela; assim que a página ficava mais comprida que uma tela (mais itens cadastrados), o botão descia junto e saía da área visível sem o usuário perceber, embora funcionasse normalmente se alguém rolasse até lá. Corrigido prendendo a barra lateral na altura da viewport (`sticky top-0 h-screen`), então "Sair" (e o resto do menu) ficam sempre visíveis, independente do tamanho do conteúdo da página. Testado criando 14 veículos (situação que reproduzia o bug) e confirmando visibilidade + funcionamento do logout.

A sessão continua durando 7 dias por padrão (fica logado ao fechar/reabrir a aba) — decisão mantida a pedido do dono, por praticidade. Pra encerrar antes disso, use o botão "Sair".

Galeria ampliada no site público (`src/app/estoque-publico.tsx`): clicar em qualquer card do estoque abre um modal com todas as fotos do veículo (setas/pontos de navegação, tecla Esc, clique fora fecha), descrição completa e os mesmos botões de contato. Cards com mais de uma foto mostram "+N fotos". Bug real encontrado e corrigido: o modal usava `AnimatePresence` do framer-motion pra animar a saída, e por algum motivo (não totalmente esclarecido — possível incompatibilidade da versão instalada com Next.js 16/React 19) isso travava o fechamento — clicar em "fechar", clicar fora ou apertar Esc não tinha efeito nenhum, o modal ficava preso na tela. Trocado por renderização condicional simples (sem animação de saída); testado abrindo/fechando várias vezes pelos três caminhos (botão, clique fora, Esc) e confirmado que funciona.

Editar veículo pronto em `/painel/estoque/[id]/editar` (pasta `estoque/[id]/editar/`): formulário pré-preenchido com todos os dados do anúncio, permite remover fotos existentes (apaga o arquivo do disco também) e adicionar novas, remover gastos já lançados e adicionar novos, e atualizar qualquer campo (inclusive os financeiros). Link "Editar" adicionado em cada card do Estoque. Outro bug real encontrado e corrigido: os botões de remover foto/gasto estavam dentro de um `<form>` aninhado dentro do formulário principal — HTML não permite isso, e causava erro de hidratação e cliques com comportamento imprevisível. Trocado para chamar as server actions direto no `onClick`, sem formulário aninhado. Testado removendo fotos, adicionando fotos, adicionando gasto e salvando — tudo refletindo corretamente no site público depois.

Ajuste no tamanho do modal da galeria: janela mais compacta (`max-w-xl` em vez de `max-w-3xl`), área de foto menor (altura fixa `h-64`/`h-72` em vez de `aspect-[4/3]`), e removido o scroll interno do bloco de texto — a descrição completa agora sempre aparece por inteiro, sem precisar rolar dentro do modal. Se o conteúdo for mais alto que a tela em telas pequenas, quem rola é a página toda (scroll no overlay), não uma caixinha interna. Testado com uma descrição bem longa de propósito para confirmar que nada fica cortado.

Seção "Onde estamos" adicionada ao site público (`src/app/localizacao.tsx`, entre Estoque e Rodapé, link "Onde estamos" na navbar): endereço, horário de funcionamento e botões "Abrir no Google Maps" / "Agendar visita no WhatsApp", no estilo visual do site (fundo escuro como a seção Sobre, tipografia da marca). Endereço e horário reais, centralizados em `src/lib/contato.ts` (`ENDERECO`, `CIDADE_UF`, `HORARIOS`, `GOOGLE_MAPS_URL`).

Decisão tomada no caminho: a ideia original era embutir um mapa do Google (iframe) na seção, mas o embed sem chave de API (`google.com/maps?...&output=embed`) veio bloqueado (`ERR_ABORTED`, provavelmente `X-Frame-Options` — o Google restringiu esse truque não-oficial ao longo do tempo). Em vez de depender de um embed frágil, troquei por um card clicável com ícone de localização, endereço e botão grande "Abrir no Google Maps" que leva ao Maps de verdade em outra aba — mais confiável e sem depender de chave de API paga.

Ajuste de layout no card do mapa (`localizacao.tsx`): o texto do endereço estava colando no botão "Abrir no Google Maps" (pouco espaço entre os elementos) e os dois cards (mapa + endereço/horário) apareciam empilhados em vez de lado a lado — reportado pelo dono com print. Corrigido: mais espaçamento entre pino/endereço/botão (`gap-4`, card com `min-h-80`), e o ponto em que vira 2 colunas foi reduzido de `md:` (768px) para `sm:` (640px), já que a tela em que apareceu empilhado parecia ter espaço de sobra — provável zoom do navegador reduzindo a largura efetiva. Testado em 1280px (2 colunas, sem sobreposição) e 500px (1 coluna, sem sobreposição).

Botões de rota (Maps + Waze) adicionados ao card de localização: além de "Ver no mapa" (abre a localização) e "Agendar visita no WhatsApp", agora há uma linha "Traçar rota" com dois botões — Google Maps (`https://www.google.com/maps/dir/?api=1&destination=<endereço>`) e Waze (`https://www.waze.com/ul?q=<endereço>&navigate=yes`). No celular esses links abrem o app correspondente já com a navegação até a loja; no desktop abrem a versão web. Links centralizados em `src/lib/contato.ts` (`GOOGLE_MAPS_ROTA_URL`, `WAZE_ROTA_URL`). Usam o endereço por texto — funciona bem; se algum dia a localização do Waze cair levemente fora do ponto, dá pra trocar por coordenadas lat/long exatas.

Sobre "o layout revertia ao atualizar a página": era cache de build corrompido. Um hot-reload anterior tinha deixado o `.next` num estado inconsistente (referência a uma variável já removida, `GOOGLE_MAPS_EMBED_URL`), então o HMR mostrava a correção mas um refresh servia o build velho. Resolvido com `rm -rf .next` + restart limpo do servidor. Confirmado após rebuild: 2 colunas lado a lado em 1280px, sem reverter. (Se voltar a acontecer em outra situação, o mesmo procedimento — apagar `.next` e reiniciar — resolve.)

Campo de upload de fotos redesenhado por acessibilidade (`src/app/painel/(app)/estoque/campo-fotos.tsx`): o dono é mais velho e usa óculos, então o input de arquivo nativo (aquele "Choose Files" pequeno e cinza) foi trocado por uma área grande de clique — borda tracejada vermelha da marca, ícone de câmera de 44px, título "Adicionar fotos" em 18px e instrução "Clique aqui para escolher as fotos do veículo". Ao selecionar, mostra um feedback verde com ✓ e a contagem ("2 fotos selecionadas"). Componente reutilizado nas duas telas (novo veículo e editar veículo); mantém `name="fotos"`, então o envio para o servidor continua igual. Alto contraste e texto grande de propósito, pra facilitar pra quem enxerga menos. Testado nas duas telas + seleção de arquivos mostrando o feedback.

Seção "Pedidos e ofertas" (`/painel/pedidos`, `src/app/painel/(app)/pedidos/`) — nova aba no menu do painel, duas partes:
- **Pedidos**: veículos que clientes estão procurando (cliente + tipo + descrição livre do que quer + observação + status Aberto/Atendido/Cancelado).
- **Ofertas**: veículos que ofereceram para a loja (cliente + tipo/marca/modelo/ano/km/preço pedido + observação + status Aberta/Recusada/Comprada).
Ambos ligam a um **cliente** (`Pedido` e `Oferta` têm FK `clienteId`): no formulário dá pra escolher um cliente existente no dropdown OU cadastrar um novo na hora (componente `seletor-cliente.tsx`). Como fica ligado ao registro do cliente, o histórico persiste — se o mesmo cliente ofertar mais carros depois, é só selecioná-lo de novo. Status editável direto na tabela e botão remover (`controles.tsx`, chamam server actions via `useTransition`). Novos models no schema: `Pedido`, `Oferta`, enums `StatusPedido`/`StatusOferta`. Testado criando pedido (que cadastrou o cliente junto), oferta reaproveitando o mesmo cliente, e mudança de status.

Melhorias em Clientes (`clientes/page.tsx` + `clientes/[id]/editar/`): a tabela agora mostra **qualidade da relação** (bolinha verde/amarela/vermelha = Boa/Atenção/Ruim, campo `qualidadeRelacao` no `Cliente`, default VERDE) e **veículos já comprados** (campo `veiculosComprados`, editável). Cada linha tem link **Editar** que abre um formulário pra alterar nome, telefone, e-mail, qualidade da relação e nº de veículos comprados. Testado editando um cliente (mudou pra Amarelo/Atenção, 3 comprados, telefone) e conferindo o reflexo na lista.

Fotos nas ofertas: o formulário de nova oferta ganhou o `CampoFotos` (reaproveitado do estoque). Novo model `OfertaFoto` (relação 1:N com `Oferta`, cascade). `criarOferta` salva os arquivos em `public/uploads/ofertas/<id>/` e cria os registros; `removerOferta` apaga a pasta. A tabela de ofertas mostra uma miniatura da primeira foto (com "+N" se houver mais). Testado criando oferta com foto e conferindo a miniatura + arquivo em disco.

Cliente no estoque dos dois lados (automatiza a contagem de compras/vendas por cliente):
- **Fornecedor** (`Veiculo.fornecedorId`, relação `"fornecedor"`): quem vendeu o carro PARA a loja. Selecionado no cadastro e na edição do veículo (seção financeira), via `SeletorCliente` compartilhado (`src/app/painel/(app)/seletor-cliente.tsx`, configurável por `prefix`) — escolhe existente ou cadastra novo na hora.
- **Comprador** (`Veiculo.compradorId`, relação `"comprador"`): quem comprou o carro DA loja. Selecionado no formulário "Marcar como vendido".
- Resolução do cliente centralizada em `src/lib/resolver-cliente.ts` (`resolverCliente(formData, prefix)`).
- A página de Clientes agora conta **automaticamente** (via `_count` das relações): "Comprou da loja" e "Vendeu p/ loja". O campo manual `veiculosComprados` foi aposentado (mantido no banco como coluna legada, sem uso, pra evitar migração destrutiva) e o input sumiu da edição do cliente. Testado o fluxo completo: cadastrei veículo com fornecedor novo, marquei como vendido com comprador = Paulo, e a lista de clientes passou a mostrar "Fornecedor Teste: vendeu 1" e "Paulo: comprou 1" sem digitar nada. Ao apagar o veículo de teste, as contagens voltaram a zero sozinhas (são derivadas das relações).

Excluir anúncio (`estoque/excluir-veiculo.tsx` + `excluirVeiculo` em `estoque/actions.ts`): cada card do estoque ganhou um botão "Excluir anúncio" (em qualquer status, inclusive Vendido — antes não havia como remover um anúncio, só editar/vender). Fluxo em dois passos com confirmação inline ("Excluir X? Isto não pode ser desfeito" → Sim/Cancelar), já que é irreversível. A action apaga o veículo (fotos e gastos saem em cascata pelo schema; leads só têm o veículo desvinculado, não são apagados) e remove a pasta de fotos do disco. Revalida estoque, dashboard, clientes e home — então as contagens por cliente e a vitrine pública se ajustam sozinhas. Testado: criei um veículo vendido de teste (com foto e gasto), excluí e confirmei que sumiu da lista e do banco (veículo/gastos/fotos = 0); também testei o Cancelar num veículo real (não apaga nada, volta ao normal).

Documentos do veículo (`estoque/[id]/editar/documentos.tsx` + actions `adicionarDocumento`/`removerDocumento`): nova seção "Documentos" na tela de editar veículo, para anexar Laudo, Documentação (CRLV/CRV), Transferência, IPVA, Vistoria e Outros. Aceita PDF e imagens; múltiplos arquivos por envio (mesma categoria). Novo model `VeiculoDocumento` (categoria enum `CategoriaDocumento`, nome original do arquivo, url; cascade ao apagar o veículo) e enum. A seção fica FORA do `<form>` principal do veículo (form próprio) pra não aninhar forms. Lista os documentos com ícone, badge da categoria, nome e link pra abrir; cada um tem "remover" (apaga registro + arquivo do disco). `excluirVeiculo` também limpa a pasta `uploads/documentos/<id>`. Arquivos salvos em `public/uploads/documentos/<veiculoId>/`. Testado: subi um PDF (categoria Laudo), abri pela URL (200, application/pdf), removi e confirmei sumiço no banco e no disco.

Privacidade dos documentos — RESOLVIDO: os documentos foram tirados de `public/` e agora ficam em `private-uploads/documentos/<veiculoId>/` (fora do alcance do servidor de arquivos estáticos; pasta no `.gitignore`). O acesso é por uma rota autenticada `GET /painel/documentos/<id>` (`src/app/painel/documentos/[id]/route.ts`): o middleware já bloqueia `/painel/*` para quem não está logado, e a própria rota reconfirma a sessão (`getSession`), valida o id, protege contra path traversal (`caminho.startsWith(base + sep)`) e transmite o arquivo com o Content-Type correto e `Cache-Control: private, no-store`. A coluna `url` do `VeiculoDocumento` passou a guardar o caminho interno relativo (não uma URL pública) e esse caminho não é mais enviado ao cliente — o front só conhece o id e monta o link `/painel/documentos/<id>`. Testado: logado abre (200, application/pdf); sem sessão o `curl` recebe 307 (redireciona pro login); a URL pública antiga dá 404. Fotos continuam públicas de propósito (são pra vitrine). Observação: em produção com múltiplas instâncias/serverless, `private-uploads` no disco local não é compartilhado — aí o ideal é um storage privado (S3 com URLs assinadas) servido pela mesma rota autenticada.

⚠️ **Incidente durante teste (2026-07-07):** ao testar o botão "remover" via automação, um seletor genérico pegou o botão "remover" errado e apagou 1 gasto (despesa) que estava lançado no veículo real Honda Civic. A exclusão de gasto é irreversível e o valor/categoria originais não ficaram registrados. Comunicado ao dono para reconferir/relançar. Lição: seletores de teste devem mirar o elemento específico (dentro do container do item), nunca o primeiro "remover" da página.

Responsividade / mobile (o site não abria bem no celular): conjunto de ajustes pra funcionar de celular a desktop.
- Viewport explícito no `layout.tsx` raiz (`export const viewport = { width: "device-width", initialScale: 1 }`).
- Painel admin: a barra lateral de largura fixa (`w-56`) era o maior problema — no celular ela comia a tela toda. Extraída para `src/app/painel/(app)/painel-sidebar.tsx` (client component): no desktop (`md+`) continua a barra lateral fixa idêntica; no celular vira uma barra escura no topo com o logo e um botão de menu (hambúrguer) que abre/fecha um painel com os links + nome + Sair. O menu fecha sozinho ao navegar (via `usePathname`). O `layout.tsx` virou `flex-col md:flex-row` e o `main` ganhou `p-4 md:p-8`.
- Navbar do site público: os links de seção (Estoque/Sobre/Onde estamos) ficam escondidos no celular (`hidden sm:flex`) pra não estourar; sobra logo + botão de WhatsApp (encurtado pra "WhatsApp" no mobile).
- Tabelas de Clientes e Pedidos/Ofertas: passaram a rolar horizontalmente (`overflow-x-auto` + `min-w-[720px]` na `<table>`) em vez de quebrar o layout.
- Formulários de veículo (novo/editar): as grades de campos viraram `grid-cols-1 sm:grid-cols-2` — empilham no celular em vez de espremer 2 colunas.
Testado a 375px (mobile): hero, painel com menu hambúrguer abrindo/fechando/navegando, dashboard (cards 2 colunas + funil), tabela de clientes rolando, formulário de novo veículo empilhado; e confirmado que o desktop (1280px) continua idêntico (barra lateral à esquerda).

⚠️ **Correção crítica de visibilidade no celular (2026-07-08):** no celular do dono o site abria mas ficava SEM logo, sem a foto do dono, sem o mapa e sem o estoque. Causa: as seções (`hero`, `sobre`, `localizacao`, `estoque-publico`) usavam animações de entrada do framer-motion com `initial={{ opacity: 0 }}`, que renderizam `opacity:0` no HTML e **dependem de JavaScript rodar** (`whileInView`/`animate` + IntersectionObserver) para revelar o conteúdo. No aparelho do dono esse JS não disparava, então tudo ficava invisível (9 elementos com `opacity:0` no HTML servido). Solução: substituídas as animações de entrada por CSS puro (`@keyframes af-reveal-up/left/right` + classes `.af-reveal*` em `globals.css`, dentro de `@media (prefers-reduced-motion: no-preference)`). O estado de repouso é sempre visível — **o conteúdo nunca depende de JS para aparecer**; a animação é só um extra. `sobre.tsx` e `localizacao.tsx` deixaram de precisar de `"use client"`. O framer-motion foi mantido apenas no modal da galeria (`estoque-publico.tsx`), que só abre no clique (JS garantido). Depois da correção: 0 ocorrências de `opacity:0` no HTML servido, todas as seções visíveis no celular (verificado a 375px).

## Segurança

Auditoria e endurecimento antes de ir para a internet (2026-07-09).

**O que já está protegido:**
- **Autenticação por conta em cada mutação**: toda server action que grava/apaga dados
  chama `requireSession()` ([session.ts](src/lib/session.ts)) no início — não depende só do
  middleware (defesa em profundidade). Foi testado que uma action não pode ser invocada por
  uma rota pública (o Next responde "Server action not found").
- **Upload validado** ([upload.ts](src/lib/upload.ts)): fotos aceitam só JPG/PNG/WebP (máx.
  15 MB); documentos aceitam PDF + imagens (máx. 25 MB). A extensão salva é derivada do tipo
  permitido (nunca do nome enviado), impedindo `.html`/`.svg` que executariam script (XSS).
- **Cabeçalhos de segurança** em todas as respostas ([next.config.ts](next.config.ts)): CSP,
  `X-Frame-Options: DENY` (anti-clickjacking), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security` (HSTS).
- **Rate limit no login** ([rate-limit.ts](src/lib/rate-limit.ts)): 5 tentativas erradas por
  IP em 10 min; depois bloqueia. Testado de ponta a ponta (bloqueia na 6ª).
- **Anti-enumeração de usuários**: o login compara sempre contra um hash bcrypt (real ou dummy),
  mantendo tempo de resposta constante — não dá para descobrir e-mails válidos pelo tempo.
- **Documentos sensíveis** ficam fora de `/public`, servidos só pela rota autenticada
  ([documentos/[id]/route.ts](src/app/painel/documentos/[id]/route.ts)) com proteção contra
  path traversal. Dados financeiros (compra, mínimo, margem) nunca vão para a página pública.
- **Segredo de sessão** de 256 bits, cookie `httpOnly` + `secure` (produção) + `sameSite=lax`.

**⚠️ Checklist obrigatório no deploy (só você pode fazer no servidor):**
1. **HTTPS obrigatório** — o cookie de sessão usa `secure` em produção (só trafega em HTTPS) e
   o HSTS assume HTTPS. Sem HTTPS, o login não funciona. Use um domínio com certificado (ex.: via
   Vercel, ou nginx + Let's Encrypt).
2. **Trocar a senha do banco** — hoje é `afcarros/afcarros` ([docker-compose.yml](docker-compose.yml)),
   ok só para desenvolvimento. Em produção use uma senha forte e **nunca exponha a porta 5432**
   para a internet.
3. **`AUTH_SECRET` forte e secreto** — gere um novo com `openssl rand -hex 32` e configure como
   variável de ambiente no servidor (não deixe no `.env` versionado).
4. **Senha do admin forte** — definida via `SEED_ADMIN_SENHA` ao rodar o seed.
5. **Rate limit é por instância** — o limitador é em memória; se rodar em várias instâncias/servidores,
   trocar por Redis (comentado em [rate-limit.ts](src/lib/rate-limit.ts)).

**Considerações (não bloqueiam o deploy):**
- O papel do usuário (`DONO`/`EQUIPE`) existe mas ainda não restringe ações — hoje todo usuário
  logado tem acesso total ao painel. Se quiser dar menos permissão à "equipe", precisa ser implementado.
- Logout apaga o cookie mas não invalida o token no servidor (JWT sem revogação) — baixo risco
  com `httpOnly` e expiração de 7 dias.

## Deploy na Vercel

O projeto foi preparado para a Vercel. Duas coisas não podiam ir do jeito que estavam:

1. **Banco** — o Postgres rodava no Docker local. Em produção usa **Neon** (Postgres na nuvem);
   só muda a `DATABASE_URL`, o código é o mesmo.
2. **Arquivos** — fotos e documentos gravavam em disco. **O disco da Vercel é descartável: some a
   cada deploy.** Agora tudo vai para o **Vercel Blob**, via [storage.ts](src/lib/storage.ts).

### Como o armazenamento funciona

[storage.ts](src/lib/storage.ts) escolhe o modo sozinho:
- **Com `BLOB_READ_WRITE_TOKEN`** (produção) → Vercel Blob.
- **Sem token** (seu Mac) → disco, como sempre. Mantém o dev local funcionando sem token.
- **Em produção sem token → lança erro de propósito.** Cair para o disco "funcionaria" e depois
  apagaria tudo no próximo deploy — um bug silencioso e destrutivo. Melhor quebrar na hora.

Nenhum outro arquivo toca o disco: todo acesso está isolado nesse módulo.

**Privacidade dos documentos:** o Vercel Blob só oferece URL pública (porém impossível de
adivinhar). Por isso a URL do documento **nunca vai para o navegador** — fica no banco e o servidor
a lê na rota autenticada [documentos/[id]](src/app/painel/documentos/[id]/route.ts). Só quem está
logado baixa. `lerArquivo()` também recusa URLs fora do nosso Blob (proteção contra SSRF).
⚠️ É um degrau abaixo da pasta privada local: se a URL vazar, o arquivo é acessível. Para pasta
100% privada com links que expiram, seria preciso Cloudflare R2 / S3.

### Passo a passo

1. **Banco (Neon)** — criar projeto em neon.tech e copiar a connection string (a **pooled**, que
   tem `-pooler` no host — importante para serverless).
2. **Blob** — no projeto da Vercel: aba *Storage* → criar um **Blob Store**. A Vercel injeta a
   `BLOB_READ_WRITE_TOKEN` automaticamente.
3. **Variáveis de ambiente na Vercel:**
   - `DATABASE_URL` — a URL do Neon
   - `AUTH_SECRET` — **gerar uma nova** com `openssl rand -hex 32` (não reusar a local)
   - `BLOB_READ_WRITE_TOKEN` — a Vercel injeta sozinha ao criar o Blob Store
   - (opcional) `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` para ligar o AFCARROS AI
4. **Build** — o `vercel-build` já roda `prisma generate && prisma migrate deploy && next build`.
   O `prisma generate` é **obrigatório**: o client é gerado em `/src/generated/prisma`, que está no
   `.gitignore` — sem gerar no build, o deploy quebra. O `migrate deploy` cria as tabelas no Neon.
5. **Criar o usuário admin** (uma vez, apontando para o Neon):
   ```sh
   DATABASE_URL="<url-do-neon>" SEED_ADMIN_NOME="..." SEED_ADMIN_EMAIL="..." \
     SEED_ADMIN_SENHA="..." SEED_ADMIN_PAPEL="DONO" npx prisma db seed
   ```

### O que NÃO vai junto

- **Os dados locais** (veículos, clientes, fotos do Docker) **não migram sozinhos** para o Neon.
  O banco novo começa vazio — recadastre pelo painel, ou peça uma migração de dados.
- HTTPS vem pronto na Vercel, o que satisfaz o item nº 1 do checklist de segurança
  (o cookie de sessão usa `secure` em produção).

## Filtros do estoque no site (2026-07-10)

A vitrine pública ([estoque-publico.tsx](src/app/estoque-publico.tsx)) tem filtros para o cliente:
**tipo** (carros/motos), **condição** (novos/seminovos), **marca** (lista montada a partir do estoque
real), **faixa de preço** e **ordenação** (mais recentes / menor preço / maior preço / menor km /
ano mais novo). Mostra a contagem ("X veículos encontrados"), botão "Limpar filtros" quando há filtro
ativo, e um estado vazio amigável.

A filtragem é feita no cliente (`useMemo`) sobre a lista que já vem do servidor — o SSR renderiza
todos os veículos, então **o estoque aparece mesmo sem JavaScript**; os filtros são um extra.

⚠️ **Varredura de classes arbitrárias:** o site público também estava usando classes Tailwind de valor
arbitrário que falhavam em algumas máquinas — inclusive duas críticas: `aspect-[4/3]` (a foto do
veículo colapsava) e `z-[100]` (o modal podia ficar atrás da navbar). Todas foram trocadas por classes
padrão + estilo inline. **Não reintroduzir classes com `[...]`** (ver nota no dashboard).

## Dashboard com gráficos (2026-07-09)

A página inicial do painel ([page.tsx](src/app/painel/(app)/page.tsx)) ganhou painéis visuais para o
dono/vendedor, todos em **CSS/SVG puro, renderizados no servidor** (sem biblioteca de gráficos e sem
depender de JavaScript — funcionam igual no celular). Componentes em
[dashboard-graficos.tsx](src/app/painel/(app)/dashboard-graficos.tsx):
- **6 cards de métrica**: valor em estoque, margem esperada, faturamento e margem realizada no
  período, ticket médio, veículos à venda.
- **Vendas e margem (últimos 6 meses)**: barra por mês com a fatia verde = lucro (margem) e cinza =
  custo.
- **Indicadores-chave**: veículos vendidos, tempo médio para vender, margem média por venda,
  taxa de conversão de leads.
- **Barras**: Estoque por marca, Faixa de preço do estoque, Desempenho por marca (margem realizada)
  e Gastos por categoria.
- **Funil de leads** e **Estoque parado** (60+ dias, lista acionável).

**Importante (robustez):** o dashboard NÃO usa nenhuma classe Tailwind de valor arbitrário
(`grid-cols-[…]`, `text-[10px]`, `max-w-[44px]` etc.) — só classes padrão + estilo inline. Em algumas
máquinas o Tailwind não gerava essas classes arbitrárias e o layout quebrava (barras com rótulo/barra/
valor empilhados, cards de métrica em 1 coluna). Manter assim.

Layout: cards de métrica em `grid-cols-2 sm:grid-cols-3` (classes padrão; NÃO usar valor arbitrário
`auto-fit`, que falhava e caía para 1 coluna). Gráficos numa grade de 6 colunas
(`lg:grid-cols-6` com `col-span` padrão): "Vendas e margem" ocupa 4 colunas e "Indicadores-chave" 2;
os demais ficam pareados (3+3); no celular tudo empilha em 1 coluna.

## AFCARROS AI (assistente do painel)

Assistente de IA no painel (`/painel/ai`, item destacado no menu) que responde perguntas sobre
estoque, gastos (mensais/anuais), vendas, margens, clientes e leads — lendo os dados reais da loja.

**Como funciona / "aprende conforme usa":** a cada pergunta, [contexto.ts](src/lib/ai/contexto.ts)
monta um retrato atualizado do banco (estoque, financeiro, vendas por mês, gastos por
categoria/mês/ano, clientes, funil, pedidos/ofertas) e envia junto com a pergunta ao modelo. Não é
re-treino: a IA **sempre usa os dados mais recentes**, então fica mais precisa conforme você cadastra
mais no painel. O histórico fica em `MensagemAI` e serve de memória da conversa.

**Agnóstico de provedor ("decidir depois"):** [provider.ts](src/lib/ai/provider.ts) funciona com
Anthropic (Claude) OU OpenAI, via `fetch` — sem SDK. Enquanto nenhuma chave estiver configurada, o
painel abre normal e mostra "Não configurado".

**Para ligar** (variáveis de ambiente — ver `.env`):
- Anthropic: `ANTHROPIC_API_KEY="..."` (chave de https://console.anthropic.com)
- ou OpenAI: `OPENAI_API_KEY="..."` (chave de https://platform.openai.com)
- opcional: `AI_PROVIDER` (anthropic|openai) e `AI_MODEL` (padrão: `claude-sonnet-5` / `gpt-4o`).

**Custo:** o modelo é cobrado por uso pelo provedor (paga só o que usar; sem uso, sem cobrança).
Ordem de grandeza: centavos por pergunta, poucos dólares/mês para uso típico. A aba
**Conhecimento & Status** mostra quantos dados a IA conhece, o status da conexão e o total de
tokens/perguntas processadas.

**Privacidade:** o que for consultado (incluindo financeiro e dados de clientes) é enviado ao
provedor de IA escolhido para gerar a resposta. Escolha um provedor com política de dados adequada.
Para restringir (ex.: não enviar clientes), basta ajustar [contexto.ts](src/lib/ai/contexto.ts).

Todas as ações da IA exigem login (`requireSession`), como o resto do painel.

Próximos passos: marcar veículo como reservado; galeria das fotos da oferta ao clicar (hoje só a miniatura).
