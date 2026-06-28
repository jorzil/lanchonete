# Integração iFood — Documentação

## Visão geral

Módulo independente que conecta o iFood ao ERP via **API oficial** (Merchant API).
Todo pedido — Site, WhatsApp, PDV ou iFood — passa pelo **mesmo fluxo**: salva no
banco → cria/atualiza cliente → aparece na Central de Pedidos em tempo real →
alimenta relatórios.

> **Observação honesta:** as chamadas à API do iFood não foram testadas contra o
> ambiente real (requer credenciais do Portal do Desenvolvedor iFood e acesso de
> rede). A estrutura está pronta; basta configurar as credenciais e validar em
> sandbox.

## Arquitetura

```
lib/integrations/ifood/
  types.ts     → tipos (config, evento, pedido, log)
  config.ts    → credenciais (env > Supabase system row) — SERVER-ONLY
  client.ts    → OAuth, eventos (polling), pedido, status, merchant — SERVER-ONLY
  mapper.ts    → iFood Order → CreateOrderPayload + ingestão idempotente
  logs.ts      → logs de integração (Supabase system row, últimos 300)

app/api/integrations/ifood/
  config/route.ts   → GET (mascarado) / PATCH credenciais
  test/route.ts     → POST testar conexão
  webhook/route.ts  → POST receber eventos do iFood
  poll/route.ts     → POST polling de eventos (apoio/redundância)
  status/route.ts   → POST sincronizar status interno → iFood
  logs/route.ts     → GET logs

app/admin/integracoes/ifood/page.tsx → tela de configuração + logs
```

Desacoplamento: nenhuma outra parte importa do módulo, exceto as rotas `/api/...`
e a tela de admin. O ponto de integração com o resto do sistema é `createOrder`
(reuso do mesmo caminho dos demais pedidos).

## Fluxo da integração

1. Cliente faz o pedido no iFood.
2. iFood envia evento `PLACED` para o **webhook** (`/api/integrations/ifood/webhook`).
   - Em paralelo/redundância, o **polling** (`/poll`) também captura eventos.
3. O sistema busca o detalhe do pedido (`GET /order/v1.0/orders/{id}`).
4. Mapeia para o formato interno e chama `createOrder` (idempotente por `external_id`).
5. Cliente é criado/atualizado, pedido aparece na Central com origem **🍔 iFood**.
6. Ao mudar o status no ERP, o sistema chama a ação correspondente no iFood
   (`confirm`, `readyToPickup`, `dispatch`, `requestCancellation`).

## Endpoints do iFood usados (Merchant API)

| Finalidade | Método | Path |
|---|---|---|
| Autenticação | POST | `/authentication/v1.0/oauth/token` |
| Status do merchant | GET | `/merchant/v1.0/merchants/{merchantId}/status` |
| Polling de eventos | GET | `/events/v1.0/events:polling` |
| Acknowledge eventos | POST | `/events/v1.0/events/acknowledgment` |
| Detalhe do pedido | GET | `/order/v1.0/orders/{orderId}` |
| Confirmar | POST | `/order/v1.0/orders/{orderId}/confirm` |
| Pronto p/ retirada | POST | `/order/v1.0/orders/{orderId}/readyToPickup` |
| Despachar | POST | `/order/v1.0/orders/{orderId}/dispatch` |
| Solicitar cancelamento | POST | `/order/v1.0/orders/{orderId}/requestCancellation` |

Base: `https://merchant-api.ifood.com.br`

## Variáveis de ambiente (recomendado para credenciais)

```
IFOOD_CLIENT_ID=...
IFOOD_CLIENT_SECRET=...
IFOOD_MERCHANT_ID=...
IFOOD_ENVIRONMENT=sandbox        # ou production
IFOOD_WEBHOOK_TOKEN=...          # token compartilhado p/ validar o webhook (opcional, recomendado)
```

As variáveis de ambiente têm prioridade. Sem elas, as credenciais podem ser
inseridas pela tela **Integrações → iFood** (guardadas no Supabase; o secret
nunca é devolvido ao front, apenas mascarado).

## Banco de dados

Colunas adicionadas em `orders` (rodar no SQL Editor do Supabase se o banco já existe):

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'site';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON orders(external_id);
```

Configurações e logs reutilizam o padrão de "system row" na tabela `customers`
(`__ifood_config__`, `__ifood_logs__`), evitando novas tabelas.

## Webhook

URL a cadastrar no Portal do iFood:
`https://www.maissub.com.br/api/integrations/ifood/webhook`

Validação: header `x-webhook-token` (ou `?token=`) comparado a `IFOOD_WEBHOOK_TOKEN`.

## Funcionalidades implementadas

- ✅ Tela de configuração (Client ID/Secret, Merchant ID, ambiente, webhook, status, última sync, testar conexão)
- ✅ Recebimento de pedidos por webhook + polling, com validação e idempotência
- ✅ Ingestão pelo mesmo fluxo dos demais pedidos (cliente criado/atualizado)
- ✅ Origem do pedido (site/whatsapp/pdv/ifood) na Central + filtro por origem
- ✅ Sincronização de status ERP → iFood (quando a API permite)
- ✅ Logs de integração com nível, escopo e mensagem
- ✅ Renovação automática de token (cache + retry em 401)

## Limitações da API oficial / pendências

- **"Em preparo" e "Entregue"** não têm ação direta equivalente na API do iFood
  (o ciclo é confirm → readyToPickup/dispatch; a conclusão é do iFood/entregador).
- **Baixa de estoque automática** dos pedidos iFood: a ficha técnica/estoque hoje
  vive no client (localStorage + sync). Para baixa 100% server-side seria preciso
  migrar estoque para tabelas no Supabase. Hoje a baixa ocorre quando o pedido é
  processado no painel admin (mesmo comportamento dos demais).
- **Sincronização de catálogo** (Catalog API): depende de habilitação por loja no
  iFood. Estrutura preparada, mas importação/atualização de itens deve ser
  implementada conforme disponibilidade da API para o merchant.
- **Assinatura HMAC do webhook**: implementada validação por token compartilhado;
  a verificação por assinatura oficial pode ser adicionada quando o segredo de
  verificação for fornecido pelo iFood.

## Próximos passos recomendados

1. Cadastrar credenciais e validar em **sandbox** (botão "Testar conexão").
2. Cadastrar o webhook no Portal do Desenvolvedor.
3. Opcional: cron chamando `/api/integrations/ifood/poll` a cada ~30s como apoio.
4. Migrar estoque para tabelas Supabase → baixa automática server-side.
5. Implementar Catalog API conforme habilitação da loja.
6. Adicionar testes de integração (mock das respostas iFood).
