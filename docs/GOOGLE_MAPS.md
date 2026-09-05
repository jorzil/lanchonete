# Google Maps — como ligar

O site funciona sem isto. Sem as chaves, ele usa OpenStreetMap e o cliente
posiciona o pino na mão. Com as chaves, o endereço é encontrado com precisão,
aparece a busca com sugestões e a distância passa a ser a **rota real**.

Você vai criar **duas chaves**. Parece exagero, mas é o que impede alguém de
copiar a chave do site e gastar a sua cota.

---

## 1. Criar o projeto

1. Acesse <https://console.cloud.google.com>
2. Entre com sua conta Google
3. No topo, clique no seletor de projeto → **Novo projeto**
4. Nome: `mais-sub` → **Criar**

## 2. Ativar a cobrança

O Google exige um cartão cadastrado mesmo para usar só a parte gratuita. Ele
não cobra sem avisar, mas o cartão precisa estar lá.

1. Menu (☰) → **Faturamento** → **Vincular uma conta de faturamento**
2. Cadastre o cartão

> **Antes de sair desta tela**, vá em **Faturamento → Orçamentos e alertas** e
> crie um orçamento de, digamos, **R$ 50/mês**, com aviso por e-mail em 50%,
> 90% e 100%. Isso não bloqueia nada sozinho — é o seu alarme.

## 3. Ativar as quatro APIs

Menu (☰) → **APIs e serviços** → **Biblioteca**. Procure e clique em **Ativar**
em cada uma:

| API | Para quê |
|---|---|
| **Maps JavaScript API** | desenhar o mapa no checkout |
| **Places API (New)** | a busca "digite e escolha o endereço" |
| **Geocoding API** | transformar o endereço em coordenada |
| **Routes API** | a distância real pelas ruas |

Precisa ser a **Places API (New)**, não a antiga.

## 4. Criar a chave do NAVEGADOR

Esta vai dentro da página, então qualquer pessoa consegue lê-la. Por isso ela
só pode fazer uma coisa e só a partir do seu site.

1. **APIs e serviços** → **Credenciais** → **Criar credenciais** → **Chave de API**
2. Clique na chave criada e renomeie para `mais-sub-navegador`
3. Em **Restrições de aplicativo**, escolha **Sites** e adicione:
   ```
   https://maissub.com.br/*
   https://www.maissub.com.br/*
   https://*.vercel.app/*
   ```
   (a terceira linha é para os links de teste da Vercel)
4. Em **Restrições de API**, escolha **Restringir chave** e marque **apenas**:
   - Maps JavaScript API
5. **Salvar**

## 5. Criar a chave do SERVIDOR

Esta nunca sai do servidor. É ela que gasta dinheiro de verdade, então recebe
o cadeado mais forte.

1. **Criar credenciais** → **Chave de API** de novo
2. Renomeie para `mais-sub-servidor`
3. Em **Restrições de aplicativo**, deixe **Nenhuma**
   (a chamada sai do servidor da Vercel, que não tem IP fixo)
4. Em **Restrições de API**, marque **apenas**:
   - Places API (New)
   - Geocoding API
   - Routes API
5. **Salvar**

## 6. Pôr as chaves na Vercel

No painel da Vercel → o projeto → **Settings** → **Environment Variables**.
Crie as duas, marcando **Production**, **Preview** e **Development**:

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | a chave do **navegador** |
| `GOOGLE_MAPS_API_KEY` | a chave do **servidor** |

O prefixo `NEXT_PUBLIC_` não é decoração: ele é o que faz a variável ir para a
página. A outra, sem o prefixo, **nunca** chega ao navegador — é essa a
diferença que protege a chave cara.

Depois de salvar, faça um **Redeploy**. Variável de ambiente só entra em vigor
num build novo.

## 7. Conferir se pegou

No checkout deve aparecer o campo **"Buscar meu endereço"** acima do CEP. Se
ele não aparecer, a chave do navegador não chegou — confira o nome da variável
e se o redeploy aconteceu.

Em **Painel → Entrega → Testar um CEP**, a linha "Quem respondeu" deve
mencionar o Google.

---

## Quanto vai custar

Cada API tem uma franquia mensal gratuita. Uma lanchonete com algumas centenas
de pedidos por mês fica dentro dela com folga — mas **confira os valores
atuais** em <https://mapsplatform.google.com/pricing/>, porque o Google mudou
esse modelo mais de uma vez.

O que o site já faz para gastar pouco:

- a busca só dispara depois que o cliente **para de digitar**, não a cada tecla;
- as teclas de uma mesma busca são agrupadas numa **sessão** — o Google cobra
  por endereço escolhido, não por letra;
- a **rota real é medida uma vez por pedido**, na hora que o cliente confirma o
  pino;
- se o Google não responder, o site **cai sozinho** na estimativa por distância
  em vez de tentar de novo.

## Se você quiser desligar

Apague as duas variáveis na Vercel e faça um redeploy. O site volta ao
OpenStreetMap sem quebrar nada: o campo de busca some, o mapa vira Leaflet e a
distância volta a usar o fator de rota.
