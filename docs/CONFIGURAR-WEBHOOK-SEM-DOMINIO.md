# Configurar webhook do Mercado Pago sem domínio (usando ngrok)

Use este guia quando seu site ainda está rodando no seu PC (localhost) e você não tem um domínio na internet.

---

## Passo 1: Descobrir em qual porta o site está rodando

- Se você sobe o site com **`npm run dev`**, a porta é quase sempre **3000**.
- Abra o site no navegador: `http://localhost:3000`. Se abrir, a porta é **3000**.

**Anote:** Minha porta é: **3000** (ou a que você usar).

---

## Passo 2: Instalar o ngrok (só uma vez)

1. Acesse: **https://ngrok.com/download**
2. Baixe a versão do seu sistema (Windows, Mac, etc.).
3. Instale (ou descompacte o executável).
4. Se quiser, crie uma conta grátis em **https://ngrok.com** e use seu authtoken (o ngrok mostra no terminal como configurar).

Se não quiser instalar nada, você pode usar alternativas como **localtunnel** ou **Cloudflare Tunnel**; o resto do guia é igual (só trocar a URL que o programa gerar).

---

## Passo 3: Subir o site e o ngrok ao mesmo tempo

1. Deixe o site rodando no terminal (ex.: `npm run dev`).
2. Abra **outro** terminal/prompt.
3. Rode o ngrok apontando para a **mesma porta** do site.

**Comando para copiar e colar (porta 3000):**

```
ngrok http 3000
```

Se sua porta for outra (ex.: 3001), use:

```
ngrok http 3001
```

4. O ngrok vai mostrar algo assim:

```
Forwarding   https://abc1-def2-3456.ngrok-free.app -> http://localhost:3000
```

5. **Copie** só a parte **https://...** (a URL que começa com `https://` e termina em `.ngrok-free.app` ou `.ngrok.io`).

**Exemplo do que você copia:**

```
https://abc1-def2-3456.ngrok-free.app
```

Não inclua a barra no final. Não inclua `http://localhost:3000`.

---

## Passo 4: Montar a URL do webhook

A URL que o Mercado Pago precisa é sempre:

**Sua URL do ngrok** + **/api/webhooks/mercado-pago**

**Modelo (troque só a parte do ngrok):**

```
https://SUA-URL-DO-NGROK/api/webhooks/mercado-pago
```

**Exemplo real (com um ngrok fictício):**

```
https://abc1-def2-3456.ngrok-free.app/api/webhooks/mercado-pago
```

**O que você deve fazer:**  
Substitua `https://abc1-def2-3456.ngrok-free.app` pela URL que o **seu** ngrok mostrou. O resto fica igual: `/api/webhooks/mercado-pago`.

---

## Passo 5: Cadastrar no Mercado Pago

1. Acesse o painel do Mercado Pago: **https://www.mercadopago.com.br/developers/panel/app**
2. Clique na sua aplicação (ex.: **EasyGames Checkout**).
3. No menu da **esquerda**, em **NOTIFICAÇÕES**, clique em **Webhooks**.
4. Onde pedir a **URL de notificação** ou **URL do webhook**, cole exatamente a URL que você montou no Passo 4.

**Exemplo do que colar no campo (com seu ngrok):**

```
https://abc1-def2-3456.ngrok-free.app/api/webhooks/mercado-pago
```

5. Salve / ative o webhook.

---

## Passo 6: Testar

1. Mantenha o **site** rodando (`npm run dev`).
2. Mantenha o **ngrok** rodando no outro terminal (`ngrok http 3000`).
3. Faça um pagamento de **teste** (PIX ou cartão de teste).
4. O Mercado Pago vai chamar a URL que você cadastrou; como o ngrok redireciona para seu localhost, seu site recebe a notificação e o pedido pode mudar para **Pago** sozinho.

**Importante:**  
Sempre que você **fechar e abrir de novo** o ngrok, a URL pode mudar. Se mudar, volte ao Passo 4, monte a nova URL e atualize no painel do Mercado Pago (Passo 5). Quando tiver um domínio de verdade, troque essa URL pela do domínio (ex.: `https://seusite.com.br/api/webhooks/mercado-pago`).
