# Mais Sub — Design System

Fonte única de verdade para a linguagem visual. **Antes de criar UI nova, use estes tokens** em vez de valores hardcoded.

## 1. Cores

### Marca (site público — tema navy)
| Token Tailwind | Valor | Uso |
|---|---|---|
| `bg-brand` / `text-brand` / `border-brand` | `#EE5C13` | Ações primárias, destaques, preços |
| `bg-brand-hover` | `#FF6B1A` | Hover de elementos laranja |
| `bg-navy` | `#0B2C5C` | Fundo principal do site |
| `bg-navy-surface` | `#163A6E` | Cards e superfícies elevadas |
| `bg-navy-deep` | `#0A2452` | Rodapé, seções profundas |

> ❌ Não escreva `bg-[#EE5C13]`. ✅ Use `bg-brand`.

### Admin (tema claro — Stripe/Shopify)
Variáveis CSS em `:root`: `--admin-bg`, `--admin-surface`, `--admin-border`, `--admin-text`, `--admin-text-2`, `--admin-accent`, `--admin-success/warning/danger/info`.

### Status de pedido
`--status-{new|confirmed|preparing|ready|delivery|delivered|cancelled}-{bg|text}` — usados em `lib/mock-orders.ts` (`STATUS_STYLES`).

## 2. Tipografia

Classes utilitárias fluidas (clamp) — **não use `text-[13px]` arbitrário**:

| Classe | Tamanho | Uso |
|---|---|---|
| `.ds-display` | 40→72px | Hero |
| `.ds-h1` | 30→44px | Título de página |
| `.ds-h2` | 24→32px | Seção |
| `.ds-h3` | 18→22px | Subseção / card title |
| `.ds-h4` | 16px | Label forte |
| `.ds-body` | 15px | Texto corrido |
| `.ds-body-sm` | 13px | Texto secundário |
| `.ds-caption` | 12px | Legendas |
| `.ds-overline` | 11px uppercase | Eyebrow / rótulos |

## 3. Espaçamento (base 8)
`--space-1..8` = 4, 8, 16, 24, 32, 48, 64, 96px. Na prática, use a escala Tailwind padrão (`p-2`=8px, `p-4`=16px, `p-6`=24px, `p-8`=32px, `p-12`=48px). **Evite valores ímpares/arbitrários.**

## 4. Radius
| Classe | Valor | Uso |
|---|---|---|
| `rounded-ds-sm` | 10px | inputs, selects |
| `rounded-ds-md` | 14px | botões, cards pequenos |
| `rounded-ds-lg` | 20px | cards |
| `rounded-ds-xl` | 28px | modais |
| `rounded-full` | — | pills, avatares |

## 5. Sombras
| Classe | Uso |
|---|---|
| `shadow-ds-sm` | cards em repouso |
| `shadow-ds-md` | cards hover, dropdowns |
| `shadow-ds-lg` | modais, popovers |
| `shadow-ds-brand` | CTA laranja em destaque |

## 6. Breakpoints (Tailwind padrão)
`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280. **Mobile-first**: estilize o mobile primeiro, adicione `sm:`/`lg:` para telas maiores.

## 7. Componentes base (shadcn/ui em `components/ui/`)
Button, Input, Select, Dialog, Sheet, Badge, Card, Tabs — sempre reutilize estes em vez de recriar.
