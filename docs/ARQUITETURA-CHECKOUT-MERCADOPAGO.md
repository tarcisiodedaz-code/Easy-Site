# Arquitetura — Checkout com Mercado Pago (Checkout Transparente)

## Objetivo

Permitir que o cliente finalize a compra **dentro do site**, pagando com **PIX** ou **Cartão de crédito**, sem redirecionamento para o Mercado Pago, usando a API oficial (Checkout Transparente).

---

## Visão geral do fluxo

```
Carrinho → Checkout (dados + forma de pagamento) → Pagamento (PIX ou Cartão) → Confirmação
```

- **Backend:** Next.js API Routes + Server Actions; credenciais e criação de pagamentos apenas no servidor.
- **Frontend:** Página de checkout; SDK do Mercado Pago (apenas Public Key) para tokenização do cartão; exibição de QR (PIX) e status.
- **Integração MP:** Servidor usa Access Token (nunca exposto); frontend usa apenas Public Key.

---

## 1. Painel Admin — Configurações de Pagamento

### O que será implementado

- **Nova seção no menu admin:** "Configurações" → "Pagamentos" (`/admin/configuracoes/pagamentos`).
- **Campos salvos no banco (tabela `loja_config`, chave `mercado_pago`):**
  - `publicKey`: string (exposta no frontend para SDK).
  - `accessToken`: string (usado **apenas** no servidor; nunca enviada ao cliente).
  - `sandbox`: boolean — modo Produção (`false`) ou Sandbox (`true`).
- **Funcionalidades:**
  - Formulário para editar e salvar Public Key, Access Token e modo (Produção/Sandbox).
  - Botão "Testar conexão com Mercado Pago": chama a API do MP (ex.: `GET /v1/account/settings`) com o Access Token e exibe sucesso/erro.
- **Persistência:** `setLojaConfig("mercado_pago", { publicKey, accessToken, sandbox })` (Server Action ou API protegida por sessão admin).

---

## 2. Página de Checkout (Cliente)

### O que será implementado

- **Rota:** `/checkout` (já protegida pelo middleware: exige usuário logado; redireciona para `/login?redirect=/checkout` se não autenticado).
- **Conteúdo:**
  - **Resumo do pedido:** lista de itens (produto, quantidade, preço unitário, subtotal); total geral (vindo do carrinho).
  - **Dados do cliente:** Nome, E-mail, CPF (obrigatórios para emissão do pagamento).
  - **Forma de pagamento:** escolha entre **PIX** e **Cartão de crédito** (abas ou radio).
- **Fluxo:**
  1. Cliente preenche dados e escolhe PIX ou Cartão.
  2. Ao enviar:
     - **PIX:** servidor cria o pedido e o pagamento PIX no MP; retorna `pedidoId`, QR Code (base64), código copia e cola; a página exibe o QR e o código e faz polling do status (ou usa webhook para atualizar UI).
     - **Cartão:** frontend tokeniza o cartão com o SDK do MP (Public Key); envia token + dados do pedido ao servidor; servidor cria pedido e pagamento com `payment_method_id: "credit_card"`; retorna sucesso ou falha; em caso de aprovação, redireciona para tela de confirmação.
  3. Após pagamento aprovado: exibir tela "Pagamento confirmado" (e opcionalmente limpar o carrinho e redirecionar para um resumo do pedido).

---

## 3. Integração com Mercado Pago

### Backend (servidor)

- **Leitura de credenciais:** de `getLojaConfig("mercado_pago")` (e, se necessário, fallback para variáveis de ambiente para Access Token em produção).
- **Endpoints MP utilizados (server-side):**
  - **Criar pagamento:** `POST /v1/payments` com:
    - PIX: `payment_method_id: "pix"`, `transaction_amount`, `payer`, etc.
    - Cartão: `payment_method_id: "credit_card"`, `token` (do frontend), `installments`, `payer`, etc.
  - **Consultar pagamento:** `GET /v1/payments/:id` (para polling ou webhook).
- **URL base:** em Sandbox usar `https://api.mercadopago.com` (o MP usa o mesmo endpoint; a diferença é as credenciais de teste).

### Frontend

- **Script do Mercado Pago:** carregar o SDK do MP (ex.: `https://sdk.mercadopago.com/js/v2`) com a **Public Key** vinda da API pública da loja.
- **PIX:** não precisa de SDK no front; o servidor gera o pagamento e devolve QR + copia e cola; o front só exibe e pode fazer polling de status.
- **Cartão:** usar o componente de cartão do MP (CardPayment ou CardForm) para capturar dados e obter o **token**; enviar apenas o token (e parcelas, etc.) ao backend; nunca enviar número de cartão ou CVV para o seu servidor.

### Segurança

- **Access Token** nunca é enviado ao frontend; apenas no servidor (API Routes / Server Actions).
- **Public Key** pode ser exposta (usada no frontend para tokenização).
- **API pública:** um endpoint (ex.: `GET /api/mercado-pago/config`) retorna somente `{ publicKey, sandbox }` para o cliente configurar o SDK.

---

## 4. Webhook (Confirmação automática)

### O que será implementado

- **Endpoint existente:** `POST /api/webhooks/mercado-pago` (já presente no projeto).
- **Ajustes/garantias:**
  - Processar notificações do MP (payload pode vir como `type: "payment"` e `data.id` com o ID do pagamento).
  - Ao receber a notificação, buscar o pagamento em `GET /v1/payments/:id` e, conforme o status:
    - **approved:** atualizar pedido para `situacao: "pago"`; salvar/garantir `payment_id` e data; descontar estoque; atribuir contas e enviar e-mail (já existente).
    - **rejected:** atualizar pedido para `situacao: "rejeitado"` (ou manter um status específico se o schema permitir).
    - **pending:** manter ou atualizar como `pendente` (e opcionalmente guardar último status).
  - Garantir que o endpoint responda rapidamente (ex.: 200 OK) e processe o pagamento de forma idempotente quando possível.

---

## 5. Banco de dados

### Tabela existente: `pedidos`

- **Campos já existentes (resumo):** `id`, `numero`, `cliente_nome`, `cliente_email`, `total`, `situacao`, `forma_pagamento`, `payment_id`, `pix_txid`, `email_enviado_em`, `created_at`, `updated_at`.
- **Alteração proposta:**
  - Adicionar coluna **`cliente_cpf`** (string, nullable) para armazenar o CPF do comprador.
- **Status (`situacao`) utilizados:** `pendente`, `pago`, `cancelado`, `entregue`; adicionar **`rejeitado`** para pagamentos recusados pelo MP.
- **`payment_id`:** armazena o ID do pagamento no Mercado Pago (equivalente a `mercadopago_payment_id` do enunciado).
- **Tabela `pedido_itens`:** já existe; sem alteração necessária para este fluxo.

Não será criada uma tabela separada "orders"; o sistema continua usando **`pedidos`** para manter compatibilidade com o restante do sistema (listagem no admin, e-mail de entrega, etc.).

---

## 6. Resumo dos arquivos / módulos

| Área | O que será criado/alterado |
|------|----------------------------|
| **Admin** | Nova rota `/admin/configuracoes/pagamentos`; formulário e Server Action para salvar e testar MP; entrada "Configurações → Pagamentos" no menu (AdminLayoutClient). |
| **Loja config** | Novo tipo e chave `mercado_pago` em `types/loja-config.ts`; uso em `lib/loja-config.ts` (já suporta chaves dinâmicas). |
| **API** | `GET /api/mercado-pago/config` (retorna só publicKey e sandbox); extensão de `POST /api/pedidos/criar` (cliente_cpf, PIX usando config; cartão com token); possível `POST /api/pagamentos/cartao` para criar pagamento com token; webhook `POST /api/webhooks/mercado-pago` ajustado para approved/rejected/pending. |
| **Checkout** | Nova página `/checkout` com resumo, formulário (nome, email, CPF), escolha PIX/Cartão; integração com SDK MP no frontend (cartão); chamadas às APIs de criação de pedido e pagamento; tela de confirmação e, para PIX, exibição de QR + polling. |
| **Carrinho** | Botão "Finalizar compra" (ou similar) que leva para `/checkout` (mantendo "Finalizar via WhatsApp" existente). |
| **Lib** | Módulo `lib/mercado-pago.ts` (ou similar) no servidor: ler config, criar pagamento PIX, criar pagamento cartão com token; funções usadas pelas API routes. |
| **Tipos / DB** | `Pedido` e tipos relacionados com `cliente_cpf` e `situacao: "rejeitado"`; migration ou instrução para adicionar coluna `cliente_cpf` e valor `rejeitado` em enum/constraints se aplicável. |

---

## 7. Experiência do usuário

- Durante o envio do formulário e criação do pagamento: **loading** visível.
- Para **PIX:** exibir QR Code e código copia e cola; **atualização de status em tempo real** (polling a cada X segundos ou após webhook, se houver canal em tempo real).
- Para **Cartão:** após tokenização e resposta do servidor, exibir sucesso ou mensagem de erro (ex.: "Pagamento recusado").
- Após aprovação: tela **"Pagamento confirmado"** com resumo do pedido (número, valor, método); opção de limpar carrinho e voltar à loja.

---

## 8. Ordem de implementação sugerida

1. **Tipos e config:** `mercado_pago` em loja-config; tipo `MercadoPagoConfig`; coluna `cliente_cpf` e status `rejeitado` (tipos + migration/SQL).
2. **Admin:** página e action de configuração de pagamentos; teste de conexão.
3. **API pública:** `GET /api/mercado-pago/config`.
4. **Lib servidor:** funções para criar pagamento PIX e cartão usando `getLojaConfig("mercado_pago")`.
5. **API pedidos/pagamentos:** estender `POST /api/pedidos/criar` (cliente_cpf, PIX com config); criar/estender endpoint para pagamento com cartão (token).
6. **Webhook:** ajustar para approved/rejected/pending e atualizar `situacao` e dados do pagamento.
7. **Página checkout:** layout, resumo, formulário, escolha PIX/Cartão; integração SDK MP (cartão); fluxos PIX (QR + polling) e cartão; tela de confirmação.
8. **Carrinho:** botão "Finalizar compra" para `/checkout`.

Esta ordem mantém o sistema existente estável e adiciona o checkout transparente de forma modular.
