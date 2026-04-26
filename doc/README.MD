# 📰 Será Que Rolou? — Documentação Técnica

> Portal de notícias e entretenimento com coleta automatizada via IA, frontend estático e API serverless hospedada na Vercel com banco de dados Neon (PostgreSQL).

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Banco de Dados](#banco-de-dados)
- [API](#api)
- [Frontend](#frontend)
- [Deploy na Vercel](#deploy-na-vercel)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Desafios e Soluções](#desafios-e-soluções)
- [Roadmap](#roadmap)

---

## Visão Geral

O **Será Que Rolou?** é um portal de notícias e entretenimento que coleta automaticamente conteúdo de diversas fontes RSS usando IA (Groq/LLaMA), armazena em um banco PostgreSQL e exibe em um frontend moderno e responsivo.

A aplicação foi desenvolvida pela [Strsoftware.com.br](https://strsoftware.com.br), uma das marcas da **Cotaweb Seguros**.

**URL de Produção:** https://agencia-ts.vercel.app  
**Instagram:** [@sera_que_rolou](https://instagram.com/sera_que_rolou)  
**Contato para anúncios:** (11) 97666-1297

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                        PRODUÇÃO                          │
│                                                          │
│   Browser → Vercel (Static) → public/index.html         │
│                ↓                                         │
│   Browser → Vercel (Serverless) → api/noticias.ts       │
│                ↓                                         │
│         PrismaNeonHttp (adapter)                         │
│                ↓                                         │
│         Neon PostgreSQL (neondb)                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     COLETA DE DADOS                      │
│                                                          │
│   Cron / Manual → src/coletor.ts                        │
│                ↓                                         │
│   RSS Feeds (Agência Brasil, etc.)                       │
│                ↓                                         │
│   Groq API (LLaMA 3.1 8B) → resumo + categoria          │
│                ↓                                         │
│   Prisma ORM → PostgreSQL local / Neon                   │
└─────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Runtime | Node.js | 20.x |
| Linguagem | TypeScript | 5.x |
| ORM | Prisma | 7.8.0 |
| Banco local | PostgreSQL | 14+ |
| Banco produção | Neon (serverless PostgreSQL) | — |
| Adapter DB | `@prisma/adapter-neon` | 7.8.0 |
| Driver serverless | `@neondatabase/serverless` | — |
| Coleta RSS | `rss-parser` + `axios` | — |
| IA / Resumos | Groq API (LLaMA 3.1 8B Instant) | — |
| Servidor local | Express.js | 4.x |
| Frontend | HTML + CSS + Vanilla JS | — |
| Deploy | Vercel (Serverless Functions) | — |
| Fonte tipográfica | DM Serif Display + DM Sans | Google Fonts |

---

## Estrutura do Projeto

```
agencia-ts/
├── api/                        # Vercel Serverless Functions
│   ├── noticias.ts             # GET /api/noticias — lista notícias
│   └── coletar.ts              # POST /api/coletar — dispara coleta
│
├── prisma/
│   ├── schema.prisma           # Definição do modelo de dados
│   └── migrations/             # Histórico de migrações
│
├── public/
│   └── index.html              # Frontend completo (SPA estático)
│
├── src/
│   ├── index.ts                # Servidor Express (desenvolvimento local)
│   ├── prisma.ts               # Instância do PrismaClient (local)
│   ├── coletor.ts              # Lógica de coleta RSS + IA
│   ├── groq.ts                 # Integração com Groq API
│   ├── scraper.ts              # Utilitários de scraping
│   └── generated/
│       └── prisma/             # Cliente Prisma gerado automaticamente
│
├── prisma.config.ts            # Configuração do Prisma (adapter + env)
├── vercel.json                 # Configuração de rotas da Vercel
├── tsconfig.json               # Configuração TypeScript
├── package.json
└── .env                        # Variáveis de ambiente (não commitar!)
```

---

## Configuração do Ambiente

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ (local)
- Conta na [Neon](https://neon.tech) (produção)
- Conta na [Vercel](https://vercel.com) (deploy)
- Chave de API da [Groq](https://console.groq.com)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/extra1357/seraquerolou.git
cd agencia-ts

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env
# Edite o .env com suas credenciais
```

### Variáveis de Ambiente (`.env`)

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/agencia_noticias?client_encoding=UTF8"
GROQ_API_KEY=sua_chave_groq
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL=llama-3.1-8b-instant
PORT=4500
COLETA_INTERVALO_MS=3600000
```

### Gerar o cliente Prisma

```bash
npx prisma generate
```

### Criar as tabelas no banco local

```bash
npx prisma db push
```

### Rodar em desenvolvimento

```bash
npx tsx src/index.ts
```

Acesse: http://localhost:4500

---

## Banco de Dados

### Modelo de Dados

```prisma
model Noticia {
  id        Int      @id @default(autoincrement())
  titulo    String
  url       String   @unique
  fonte     String
  resumo    String
  categoria String
  criadoEm DateTime @default(now())
}
```

### Categorias existentes

| Categoria | Descrição |
|-----------|-----------|
| `politica` | Notícias políticas nacionais |
| `celebridades` | Famosos, entretenimento |
| `moda` | Moda, looks, estilo |
| `filmes` | Cinema, lançamentos, críticas |

### Configuração do Prisma (`prisma.config.ts`)

O projeto usa Prisma 7+ com configuração via `prisma.config.ts` em vez da `url` no `schema.prisma`:

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```

> ⚠️ **Importante:** No Prisma 7+, a `url` **não** vai no `schema.prisma`. Vai no `prisma.config.ts`.

### Migrações para o banco de produção (Neon)

```bash
# Sempre usar a DATABASE_URL do Neon explicitamente
DATABASE_URL="postgresql://..." npx prisma db push
```

---

## API

### `GET /api/noticias`

Retorna lista de notícias ordenadas por data de criação.

**Query params:**

| Param | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `take` | number | 100 | Quantidade de notícias a retornar |

**Exemplo de resposta:**

```json
[
  {
    "id": 230,
    "titulo": "Título da notícia",
    "url": "https://fonte.com/noticia",
    "fonte": "Agência Brasil",
    "resumo": "Resumo gerado por IA...",
    "categoria": "politica",
    "criadoEm": "2026-04-26T18:00:00.000Z"
  }
]
```

### `POST /api/coletar`

Dispara manualmente a coleta de notícias.

**Resposta:**
```json
{ "mensagem": "Coleta iniciada!" }
```

### Implementação da função serverless (`api/noticias.ts`)

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
  const prisma = new PrismaClient({ adapter } as any);

  try {
    const take = Number(req.query.take) || 100;
    const noticias = await prisma.noticia.findMany({
      orderBy: { criadoEm: 'desc' },
      take,
    });
    res.setHeader('Cache-Control', 'no-store');
    res.json(noticias);
  } catch (err: any) {
    res.status(500).json({ erro: err.message });
  } finally {
    await prisma.$disconnect();
  }
}
```

> ⚠️ **Atenção:** Em ambiente serverless (Vercel), usar `PrismaNeonHttp` do `@prisma/adapter-neon`, **não** o `PrismaPg` do `@prisma/adapter-pg`. O `adapter-pg` usa TCP que não é compatível com funções serverless.

---

## Frontend

O frontend é um arquivo HTML único (`public/index.html`) com CSS e JavaScript embutidos.

### Funcionalidades

- Listagem de notícias em cards com categoria, fonte e resumo
- Filtro por categoria (Tudo / Celebridades / Moda / Filmes / Política)
- Ticker de notícias animado no topo
- Contador de notícias por categoria
- Botão "Coletar agora" para disparo manual
- Atualização automática a cada 60 segundos
- Footer com informações de contato e créditos
- Botão do Instagram com link direto
- Design responsivo com paleta rosa/dark

### Categorias no frontend

As categorias do frontend devem sempre bater com as existentes no banco:

```javascript
// ✅ Correto — bate com o banco
const cats = ['todas', 'celebridades', 'moda', 'filmes', 'politica'];

// ❌ Errado — categorias que não existem no banco
// const cats = ['cinema', 'entretenimento', 'babados', 'fofoca'];
```

---

## Deploy na Vercel

### Configuração (`vercel.json`)

```json
{
  "version": 2,
  "routes": [
    { "src": "/api/noticias", "dest": "/api/noticias.ts" },
    { "src": "/api/coletar",  "dest": "/api/coletar.ts"  },
    { "src": "/(.*)",         "dest": "/public/$1"        }
  ]
}
```

### Variáveis de ambiente na Vercel

```bash
# Adicionar variáveis de produção
vercel env add DATABASE_URL production
vercel env add GROQ_API_KEY production
```

### Deploy

```bash
# Deploy para produção
vercel --prod
```

### Dependências obrigatórias para produção

O `package.json` deve ter o `prisma` em `dependencies` (não só em `devDependencies`), pois a Vercel precisa gerar o cliente durante o build:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "prisma": "^7.8.0",
    "@prisma/adapter-neon": "^7.8.0",
    "@neondatabase/serverless": "latest"
  }
}
```

---

## Variáveis de Ambiente

| Variável | Ambiente | Descrição |
|----------|----------|-----------|
| `DATABASE_URL` | Local + Produção | Connection string do PostgreSQL |
| `GROQ_API_KEY` | Local + Produção | Chave da API Groq para IA |
| `GROQ_API_URL` | Local | URL da API Groq |
| `GROQ_MODEL` | Local | Modelo LLaMA a usar |
| `PORT` | Local | Porta do servidor Express |
| `COLETA_INTERVALO_MS` | Local | Intervalo entre coletas (ms) |

### Connection strings

**Local:**
```
postgresql://agencia:senha@localhost:5432/agencia_noticias?client_encoding=UTF8
```

**Neon (produção) — usar pooler para serverless:**
```
postgresql://neondb_owner:senha@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

> ⚠️ **Importante:** Sempre usar a URL com `-pooler` no hostname para funções serverless. A URL sem pooler é apenas para CLI do Prisma (`prisma db push`, `prisma migrate`).

---

## Desafios e Soluções

### 1. Tabela não existia no Neon

**Problema:** O `prisma db push` rodava contra o banco local porque o `.env` local apontava para `localhost`. A tabela nunca foi criada no Neon.

**Solução:** Passar a `DATABASE_URL` explicitamente via prefixo de ambiente:

```bash
DATABASE_URL="postgresql://neondb_owner:senha@ep-xxx.neon.tech/neondb?sslmode=require" npx prisma db push
```

---

### 2. Nome do banco incorreto

**Problema:** Confundimos o nome do **projeto** Neon (`seraquerolou`) com o nome do **banco** (`neondb`). O banco padrão criado pelo Neon sempre se chama `neondb`.

**Solução:** Verificar as tabelas existentes diretamente:

```bash
psql "postgresql://..." -c '\dt'
```

---

### 3. Adapter errado para serverless

**Problema:** Usávamos `@prisma/adapter-pg` com `PrismaPg`, que usa conexões TCP. Em funções serverless (Vercel), conexões TCP de longa duração não funcionam corretamente.

**Solução:** Migrar para `@prisma/adapter-neon` com `PrismaNeonHttp`, que usa HTTP para comunicação com o banco — compatível com serverless:

```typescript
// ❌ Errado para serverless
import { PrismaPg } from '@prisma/adapter-pg';

// ✅ Correto para Vercel + Neon
import { PrismaNeonHttp } from '@prisma/adapter-neon';
const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {});
```

---

### 4. Dados não migrados para o Neon

**Problema:** Mesmo com a tabela criada, o banco Neon estava vazio (`[]`). Os dados do banco local nunca foram exportados/importados.

**Solução:** Export do banco local e import no Neon:

```bash
# Export do banco local (com aspas para preservar case sensitive)
sudo -u postgres pg_dump -d agencia_noticias \
  --data-only -t '"Noticia"' \
  --column-inserts -f /tmp/noticias_insert.sql

# Import no Neon
psql "postgresql://neondb_owner:senha@ep-xxx-pooler.neon.tech/neondb?sslmode=require" \
  -f /tmp/noticias_insert.sql
```

---

### 5. Categorias inexistentes no banco

**Problema:** O frontend tinha botões de filtro para categorias que não existiam no banco (`cinema`, `entretenimento`, `babados`, `fofoca`, `lula-bolsonaro`, `senado-camara-stf`), retornando sempre zero resultados.

**Solução:** Consultar as categorias reais via Prisma e ajustar o frontend:

```bash
# Consultar categorias reais
npx tsx -e "
import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client';
// ...
prisma.noticia.groupBy({ by: ['categoria'], _count: { categoria: true } })
"
# Resultado: politica (33), celebridades (16), moda (9), filmes (8)
```

---

### 6. IDs duplicados de badges no HTML

**Problema:** Após remover botões de categoria inexistentes, o ID `cnt-politica` ficou duplicado no HTML (havia dois botões apontando para a mesma categoria).

**Solução:** Remover os botões duplicados via script Python de substituição cirúrgica no HTML.

---

### 7. TypeScript errors no deploy da Vercel

**Problema:** Vários erros de tipagem ao usar `ws`, `PrismaNeon` e `PrismaNeonHttp` com as versões erradas dos pacotes.

**Solução:** 
- Instalar `@types/ws` para resolver `TS7016`
- Usar `PrismaNeonHttp` passando a connection string diretamente, não o objeto `Pool` ou `neon()`
- Passar `{}` como segundo argumento obrigatório: `new PrismaNeonHttp(url, {})`

---

### 8. Cache 304 confundido com erro

**Problema:** O browser retornava `304 Not Modified` e achávamos que era erro. Na verdade, o `304` indica que o recurso não mudou e o browser está usando cache — comportamento correto e eficiente.

**Diagnóstico correto:** Verificar os logs procurando por `500` (erro real) vs `200`/`304` (sucesso).

---

## Migração de Dados (Local → Neon)

Para migrar dados do banco local para o Neon:

```bash
# 1. Export do banco local
sudo -u postgres pg_dump -d agencia_noticias \
  --data-only \
  -t '"Noticia"' \
  --column-inserts \
  -f /tmp/noticias_insert.sql

# 2. Verificar o export
wc -l /tmp/noticias_insert.sql

# 3. Import no Neon
psql "postgresql://neondb_owner:SENHA@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" \
  -f /tmp/noticias_insert.sql

# 4. Confirmar
psql "postgresql://..." -c 'SELECT COUNT(*) FROM "Noticia";'
```

---

## Roadmap

- [ ] Cron job na Vercel para coleta automática a cada hora
- [ ] Paginação na API (`skip` + `take`)
- [ ] Endpoint de busca por texto (`/api/noticias?q=termo`)
- [ ] Painel administrativo para gerenciar notícias
- [ ] Notificações push de novas notícias
- [ ] SEO — geração de páginas estáticas por notícia
- [ ] Compartilhamento social por notícia
- [ ] Dark/light mode toggle
- [ ] PWA (Progressive Web App)

---

## Contato e Créditos

**Será Que Rolou?** foi desenvolvido por [Strsoftware.com.br](https://strsoftware.com.br), uma das marcas da **Cotaweb Seguros**.

- 📱 Instagram: [@sera_que_rolou](https://instagram.com/sera_que_rolou)
- 📞 Anúncios: (11) 97666-1297
- 💬 WhatsApp: [Clique aqui](https://wa.me/5511976661297)

---

*Documentação gerada em Abril/2026 — versão 1.0.0*
