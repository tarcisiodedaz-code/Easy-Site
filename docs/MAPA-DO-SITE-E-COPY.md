# Mapa do Site, Persona, Jornada e Copy — Easy Games

## 1. Mapa do Site (Arquitetura de Páginas)

```
Easy Games (Loja)
│
├── Home (Landing)
│   └── Seções: Hero AIDA | Destaques | Pré-venda | Ofertas | Por que comprar | Depoimentos | Selos | CTA final
│
├── Categorias
│   └── Listagem de categorias (PS4, PS5, Gift Card, Ofertas, etc.) → filtro/listagem de produtos
│
├── Página de Produto (PDP) — /produto/[id]
│   └── Imagem, nome, preço, descrição, avaliações, CTAs: Comprar | Adicionar ao carrinho
│
├── Carrinho — /carrinho
│   └── Itens, totais, CTA: Finalizar compra
│
├── Checkout / Finalização
│   └── Fluxo: Login (se necessário) → Carrinho → Finalizar (WhatsApp / Pix / Mercado Pago)
│
├── Login / Cadastro — /login
│   └── Entrar | Cadastrar (para comprar e acessar conta)
│
└── Páginas institucionais
    ├── Sobre
    ├── Termos de uso
    ├── Política de privacidade
    └── Política de trocas
```

**Resumo dos pilares:** Home → Categorias → PDP → Carrinho → Checkout (com login quando necessário).

---

## 2. Persona e Jornada de Compra

### Persona principal
- **Quem:** Jogador de 18–35 anos, consome jogos digitais (PS4/PS5, gift cards).
- **Objetivo:** Comprar com segurança, preço bom e entrega rápida (código/contas).
- **Dores:** Medo de golpe, preços altos, lentidão no suporte.
- **Ganhos:** Oferta clara, pagamento seguro (Pix/cartão), atendimento via WhatsApp.

### Jornada até o fechamento
1. **Descoberta** — Chega pela Home ou rede social.
2. **Atenção** — Hero e títulos magnéticos (AIDA).
3. **Interesse** — Categorias e ofertas; prova social (depoimentos, selos).
4. **Desejo** — PDP com preço, garantia e avaliações.
5. **Ação** — CTA “Comprar” / “Garantir Oferta” → Login/Carrinho → Checkout (Pix/WhatsApp).

---

## 3. Paleta de Cores e Confiança

| Uso        | Cor / token      | Hex / valor   | Sensação        |
|-----------|------------------|---------------|-----------------|
| Fundo     | `--background`   | #09090b       | Profissional    |
| Card      | `--card`        | #18181b       | Solidez         |
| Destaque  | `--accent`      | #10b981 (verde) | Confiança, ação |
| Texto     | `--foreground`  | #fafafa       | Legibilidade    |
| Bordas    | `--border`      | #27272a       | Delimitação     |

**Disposição de imagens:** Hero em destaque; produtos com imagem grande e proporção consistente; selos e depoimentos próximos aos CTAs para reforçar confiança.

---

## 4. Copy da Landing Page (AIDA)

### A — Atenção (Hero)
- **Título:** “Jogos digitais com preço justo e entrega na hora.”
- **Subtítulo:** “Pix, cartão ou parcelado. Códigos e contas com suporte rápido. Sem complicação.”
- **CTA:** “Ver ofertas” / “Compre agora”

### I — Interesse (Destaques / Ofertas)
- **Título de seção:** “Os jogos que todo mundo está comprando.”
- **Subtítulo:** “Ofertas selecionadas. Pré-vendas e lançamentos em um só lugar.”
- **CTA em cards:** “Comprar agora” | “Garantir oferta”

### D — Desejo (Pré-venda / Benefícios)
- **Título:** “Garanta o seu antes de todo mundo.”
- **Subtítulo:** “Condições especiais em pré-venda. Pagamento seguro e entrega rápida.”
- **CTA:** “Garantir o meu”

**Bloco “Por que comprar na Easy Games”:**
- Pagamento seguro (Pix e cartão).
- Entrega rápida (código ou conta).
- Suporte via WhatsApp.
- Preços competitivos.

### A — Ação (CTA final)
- **Título:** “Pronto para garantir o seu jogo?”
- **Subtítulo:** “Escolha abaixo e finalize em poucos cliques.”
- **CTA:** “Compre agora” | “Garantir oferta”

---

## 5. Prova Social

### Depoimentos (sugestão de texto)
- “Compra rápida e sem stress. Recebi o código na hora.” — Cliente verificado.
- “Preço bom e atendimento no WhatsApp muito bom.” — Cliente verificado.
- “Já comprei mais de uma vez. Recomendo.” — Cliente verificado.

### Selos de segurança
- Pagamento seguro.
- Entrega rápida.
- Suporte via WhatsApp.
- Site seguro (HTTPS).

---

## 6. Funcionalidades Essenciais (checklist)

| Funcionalidade           | Status / observação        |
|-------------------------|----------------------------|
| Carrinho de compras     | Implementado               |
| Pagamento (Pix / MP)    | Integrado                  |
| Avaliações (PDP)        | A implementar (estrutura)  |
| Suporte (chat/WhatsApp) | WhatsApp no header/footer  |
| Mobile-friendly         | Layout responsivo          |
| CTAs claros             | “Comprar agora”, “Garantir oferta” |

---

## 7. Mobile-Friendly e CTAs

- **Mobile:** Layout responsivo (grid, fontes e botões tocáveis); header com menu e carrinho; PDP e carrinho usáveis em tela pequena.
- **CTAs principais:** “Compre agora”, “Garantir oferta”, “Ver ofertas”, “Finalizar compra”, “Adicionar ao carrinho”.
