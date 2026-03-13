# Enviar o projeto para o GitHub (easygames-site)

Siga estes passos no seu computador.

---

## ⚠️ IMPORTANTE — Não sobrescrever outro projeto

- **Use um repositório NOVO e VAZIO** para este projeto (a loja Easy Games).
- Se o nome **easygames-site** já existe no seu GitHub e tem **outro** projeto dentro, **não use esse repositório**. Crie um com outro nome (ex.: **easygames-loja**, **easy-games-store**).
- Os comandos abaixo **enviam** os arquivos da pasta **easy-games** para o GitHub. Eles **não** apagam o que está no repositório **se você fizer o primeiro push** em um repositório recém-criado e vazio.
- **Nunca** rode `git push --force` em um repo que já tem um projeto que você quer manter.

**Resumo:** Crie um repositório **novo** só para esta loja (ou use um que esteja vazio). Não escolha um repo que já tenha outro site/projeto.

---

## 1. Instalar o Git (se ainda não tiver)

1. Baixe: **https://git-scm.com/download/win**
2. Instale (pode deixar as opções padrão).
3. **Feche e abra de novo** o terminal (PowerShell ou CMD) depois de instalar.

---

## 2. Criar o repositório no GitHub (novo e vazio)

1. Acesse **https://github.com** e faça login.
2. Clique no **+** (canto superior direito) → **New repository**.
3. **Repository name:** `easygames-site` (ou outro nome, ex.: `easygames-loja`, se **easygames-site** já existir e tiver outro projeto).
4. Deixe **Public**.
5. **Não** marque "Add a README", "Add .gitignore" nem "Choose a license" — deixe o repositório **totalmente vazio**.
6. Clique em **Create repository**.

O GitHub vai mostrar uma página com a URL do repositório, algo como:
`https://github.com/SEU_USUARIO/easygames-site.git`

Anote seu **usuário** do GitHub e o **nome do repositório** que você escolheu.

---

## 3. Abrir o terminal na pasta do projeto

Abra o PowerShell ou CMD e vá até a pasta do projeto:

```powershell
cd "C:\Users\tarci\Documents\Easy Site\easy-games"
```

(Se a pasta estiver em outro lugar, ajuste o caminho.)

---

## 4. Inicializar o Git e fazer o primeiro commit

Cole e rode **um comando por vez**:

```powershell
git init
```

```powershell
git add .
```

```powershell
git commit -m "Envio inicial do projeto Easy Games"
```

---

## 5. Conectar ao repositório e enviar

Substitua **SEU_USUARIO** pelo seu usuário do GitHub (ex.: se a URL for `https://github.com/tarci123/easygames-site`, use `tarci123`):

```powershell
git remote add origin https://github.com/SEU_USUARIO/easygames-site.git
```

```powershell
git branch -M main
```

```powershell
git push -u origin main
```

O Git pode pedir **usuário e senha**. Use seu usuário do GitHub e, como senha, use um **Personal Access Token** (o GitHub não aceita mais a senha normal):

- Criar token: **https://github.com/settings/tokens** → **Generate new token (classic)** → marque **repo** → gerar e **copiar**.
- Quando pedir a senha, **cole o token** (não a senha da conta).

---

## Resumo dos comandos (troque SEU_USUARIO)

```powershell
cd "C:\Users\tarci\Documents\Easy Site\easy-games"
git init
git add .
git commit -m "Envio inicial do projeto Easy Games"
git remote add origin https://github.com/SEU_USUARIO/easygames-site.git
git branch -M main
git push -u origin main
```

---

## Importante

O arquivo **`.env`** (e outros `.env*`) **não** são enviados (estão no `.gitignore`). As variáveis de ambiente (Supabase, Mercado Pago, etc.) você configura direto no serviço onde for fazer o deploy (ex.: Vercel).
