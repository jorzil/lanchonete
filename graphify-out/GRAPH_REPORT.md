# Graph Report - lanchonete  (2026-07-20)

## Corpus Check
- 181 files · ~1,712,204 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1278 nodes · 2646 edges · 118 communities (59 shown, 59 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d9e950dc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- page.tsx
- client.ts
- page.tsx
- page.tsx
- use-toast.ts
- carousel.tsx
- page.tsx
- sidebar.tsx
- utils.ts
- Order
- page.tsx
- devDependencies
- compilerOptions
- cn
- supabase.ts
- page.tsx
- combo-picker-modal.tsx
- page.tsx
- route.ts
- page.tsx
- page.tsx
- page.tsx
- mapper.ts
- components.json
- sandwich-builder.tsx
- page.tsx
- dependencies
- data.ts
- formatCurrency
- page.tsx
- menubar.tsx
- Mais Sub — Design System
- Integração iFood — Documentação
- command.tsx
- context-menu.tsx
- dropdown-menu.tsx
- alert-dialog.tsx
- sheet.tsx
- table.tsx
- db-customers.ts
- route.ts
- breadcrumb.tsx
- navigation-menu.tsx
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- route.ts
- alert.tsx
- input-otp.tsx
- mais-sub-hero.tsx
- lenis
- Security Policy
- route.ts
- layout.tsx
- layout.tsx
- blur-text.tsx
- fading-video.tsx
- sonner.tsx
- middleware.ts
- class-variance-authority
- clsx
- cmdk
- date-fns
- embla-carousel-react
- framer-motion
- gsap
- @hookform/resolvers
- input-otp
- lucide-react
- next
- next.config.mjs
- next-env.d.ts
- next-themes
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-aspect-ratio
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-context-menu
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-hover-card
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-popover
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-tabs
- @radix-ui/react-toggle
- @radix-ui/react-toggle-group
- @radix-ui/react-tooltip
- react-day-picker
- react-hook-form
- react-resizable-panels
- react-to-print
- recharts
- sonner
- @supabase/supabase-js
- tailwind-merge
- tailwindcss-animate
- vaul
- zod
- postcss.config.mjs
- tailwind.config.ts
- types.d.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 89 edges
2. `formatCurrency()` - 64 edges
3. `useCart()` - 23 edges
4. `Order` - 23 edges
5. `Button` - 22 edges
6. `loadIngredients()` - 20 edges
7. `Input` - 18 edges
8. `CartItem` - 18 edges
9. `logIFood()` - 18 edges
10. `CheckoutPage()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `AcompanharEntradaPage()` --calls--> `formatCurrency()`  [EXTRACTED]
  app/acompanhar/page.tsx → lib/data.ts
- `KpiCard()` --calls--> `cn()`  [EXTRACTED]
  app/admin/page.tsx → lib/utils.ts
- `Row()` --calls--> `formatCurrency()`  [EXTRACTED]
  app/admin/pdv/page.tsx → lib/data.ts
- `ProductCard()` --calls--> `formatCurrency()`  [EXTRACTED]
  app/cardapio/page.tsx → lib/data.ts
- `FormData` --references--> `PaymentMethod`  [EXTRACTED]
  app/checkout/page.tsx → lib/data.ts

## Import Cycles
- None detected.

## Communities (118 total, 59 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.05
Nodes (87): ComprasPage(), DraftItem, emptyIngredient(), EstoquePage(), MOVEMENT_LABELS, UNITS, FichasTecnicasPage(), PURCHASE_UNITS (+79 more)

### Community 1 - "page.tsx"
Cohesion: 0.08
Nodes (58): BillModal(), BillsTable(), FinanceiroPage(), fmt(), MONTHS, STATUS_CONFIG, addBill(), addCustomCategory() (+50 more)

### Community 2 - "client.ts"
Cohesion: 0.10
Nodes (40): GET(), PATCH(), GET(), GET(), POST(), POST(), POST(), isAuthentic() (+32 more)

### Community 3 - "page.tsx"
Cohesion: 0.07
Nodes (37): DEFAULT_ZONES, EntregaPage(), CheckoutPage(), customizationLabel(), FormData, isAllowedCity(), normalizeCity(), OrderType (+29 more)

### Community 4 - "page.tsx"
Cohesion: 0.08
Nodes (42): ConfiguracoesPage(), DEFAULT_SETTINGS, Settings, StoreStatusWidget(), IdentificationModal(), maskPhone(), Props, TabsContent (+34 more)

### Community 5 - "use-toast.ts"
Cohesion: 0.08
Nodes (38): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+30 more)

### Community 6 - "carousel.tsx"
Cohesion: 0.05
Nodes (34): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+26 more)

### Community 7 - "page.tsx"
Cohesion: 0.12
Nodes (32): AdminLayout(), BREADCRUMBS, NAV_ITEMS, SidebarContent(), AdminLoginPage(), ROLES, UsuariosPage(), AccountInput (+24 more)

### Community 8 - "sidebar.tsx"
Cohesion: 0.07
Nodes (30): Separator, Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent (+22 more)

### Community 9 - "utils.ts"
Cohesion: 0.07
Nodes (20): AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, Checkbox, HoverCardContent (+12 more)

### Community 10 - "Order"
Cohesion: 0.11
Nodes (22): AcompanharPage(), formatTime(), getStepIndex(), RETIRADA_STEPS, STEPS, AcompanharEntradaPage(), STATUS_LABELS, buildCustomers() (+14 more)

### Community 11 - "page.tsx"
Cohesion: 0.11
Nodes (23): BreadPickerModal, CardapioPage(), CATS, ComboPickerModal, ProductCard(), SandwichBuilder, MaisSubMark(), MBadge() (+15 more)

### Community 12 - "devDependencies"
Cohesion: 0.07
Nodes (27): devDependencies, postcss, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript (+19 more)

### Community 13 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+19 more)

### Community 14 - "cn"
Cohesion: 0.12
Nodes (21): ButtonProps, buttonVariants, Calendar(), CalendarProps, DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader() (+13 more)

### Community 15 - "supabase.ts"
Cohesion: 0.14
Nodes (15): POST(), GET(), GET(), isAllowedOrigin(), POST(), confirmDeliveryByCode(), createOrder(), deleteDbOrder() (+7 more)

### Community 16 - "page.tsx"
Cohesion: 0.11
Nodes (21): AdminDashboard(), isSameDay(), KpiCard(), Period, PERIOD_LABELS, QUICK_LINKS, startOfToday(), WEEKDAY_LABELS (+13 more)

### Community 17 - "combo-picker-modal.tsx"
Cohesion: 0.18
Nodes (19): DisponibilidadePage(), Group, GROUPS, BreadPickerModal(), EXTRA_EMOJIS, SIZES, ALL_COOKIES, ALL_LATAS (+11 more)

### Community 18 - "page.tsx"
Cohesion: 0.15
Nodes (20): CATEGORIES, Category, DiscountType, PAYMENTS, Row(), SaleItem, Textarea, addCashMovement() (+12 more)

### Community 19 - "route.ts"
Cohesion: 0.11
Nodes (19): GET(), PATCH(), readRow(), writeRow(), DEFAULT_CONFIG, GET(), PATCH(), readFromDb() (+11 more)

### Community 20 - "page.tsx"
Cohesion: 0.22
Nodes (19): CuponsPage(), EMPTY_FORM, TYPE_CONFIG, addCoupon(), calcCouponDiscount(), CouponDef, CouponType, CouponValidationResult (+11 more)

### Community 21 - "page.tsx"
Cohesion: 0.14
Nodes (19): _breadNames, buildItemDetails(), buildSiren(), buildStatusMessage(), buildWaMessage(), _cheeseNames, ensureAudio(), _extraNames (+11 more)

### Community 22 - "page.tsx"
Cohesion: 0.14
Nodes (13): BASE_IDS, CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS, mergeOverrides(), OverridesMap, ProductWithCost, ProdutosPage() (+5 more)

### Community 23 - "mapper.ts"
Cohesion: 0.20
Nodes (16): DbOrder, GET(), rowToOrder(), DbOrder, GET(), rowToOrder(), Address, CartItem (+8 more)

### Community 24 - "components.json"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 25 - "sandwich-builder.tsx"
Cohesion: 0.12
Nodes (17): BreadPickerModalProps, ComboPickerModalProps, ALL_SALAD_KEYS, BREAD_GRADIENTS, _breadMap, _cheeseMap, DEFAULT_CUSTOMIZATION, MEAT_GRADIENTS (+9 more)

### Community 26 - "page.tsx"
Cohesion: 0.23
Nodes (12): OfertasPage(), POOL, PRODUCT_BY_ID, OrderBumpSuggestions(), PRODUCT_BY_ID, PRODUCTS, fetchOrderBumps(), logBumpAdd() (+4 more)

### Community 27 - "dependencies"
Cohesion: 0.13
Nodes (15): autoprefixer, dependencies, autoprefixer, @radix-ui/react-navigation-menu, @radix-ui/react-progress, @radix-ui/react-select, @radix-ui/react-toast, @radix-ui/react-visually-hidden (+7 more)

### Community 28 - "data.ts"
Cohesion: 0.14
Nodes (12): BreadOption, CheeseOption, _currencyFmt, Customer, ExtraOption, _extrasMap, LoyaltyPoints, MeatOption (+4 more)

### Community 29 - "formatCurrency"
Cohesion: 0.24
Nodes (10): ProductModal(), CartPanel(), _cheeseMap, customizationSummary(), _meatMap, _saladMap, _sauceMap, formatCurrency() (+2 more)

### Community 30 - "page.tsx"
Cohesion: 0.18
Nodes (3): CATEGORY_NAV, HOW_STEPS, HeroFrame()

### Community 31 - "menubar.tsx"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 32 - "Mais Sub — Design System"
Cohesion: 0.17
Nodes (11): 1. Cores, 2. Tipografia, 3. Espaçamento (base 8), 4. Radius, 5. Sombras, 6. Breakpoints (Tailwind padrão), 7. Componentes base (shadcn/ui em `components/ui/`), Admin (tema claro — Stripe/Shopify) (+3 more)

### Community 33 - "Integração iFood — Documentação"
Cohesion: 0.17
Nodes (11): Arquitetura, Banco de dados, Endpoints do iFood usados (Merchant API), Fluxo da integração, Funcionalidades implementadas, Integração iFood — Documentação, Limitações da API oficial / pendências, Próximos passos recomendados (+3 more)

### Community 34 - "command.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 35 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 36 - "dropdown-menu.tsx"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 37 - "alert-dialog.tsx"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 38 - "sheet.tsx"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 39 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 40 - "db-customers.ts"
Cohesion: 0.31
Nodes (6): CustomerDetail, CustomerRow, CustomerWithStats, getCustomer(), rowToOrder(), UpsertCustomerPayload

### Community 41 - "route.ts"
Cohesion: 0.43
Nodes (4): buildMessage(), PATCH(), POST(), sendEvolutionMessage()

### Community 42 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 43 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 44 - "route.ts"
Cohesion: 0.43
Nodes (6): DEFAULT_SCHEDULE, DEFAULT_STATUS, GET(), PATCH(), readFromDb(), writeToDb()

### Community 45 - "route.ts"
Cohesion: 0.47
Nodes (5): DEFAULT_CONFIG, GET(), PATCH(), readFromDb(), writeToDb()

### Community 46 - "route.ts"
Cohesion: 0.47
Nodes (5): DEFAULT_CONFIG, GET(), PATCH(), readFromDb(), writeToDb()

### Community 47 - "route.ts"
Cohesion: 0.53
Nodes (5): DEFAULT, GET(), PATCH(), readRow(), writeRow()

### Community 48 - "route.ts"
Cohesion: 0.53
Nodes (5): DEFAULT_CONFIG, GET(), PATCH(), readFromDb(), writeToDb()

### Community 49 - "route.ts"
Cohesion: 0.53
Nodes (5): DEFAULT_CONFIG, GET(), PATCH(), readFromDb(), writeToDb()

### Community 50 - "route.ts"
Cohesion: 0.60
Nodes (4): GET(), PATCH(), readFromDb(), writeToDb()

### Community 51 - "alert.tsx"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 52 - "input-otp.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 54 - "lenis"
Cohesion: 0.50
Nodes (3): SmoothScroll(), lenis, lenis

### Community 55 - "Security Policy"
Cohesion: 0.50
Nodes (3): Reporting a Vulnerability, Security Policy, Supported Versions

## Knowledge Gaps
- **476 isolated node(s):** `STEPS`, `RETIRADA_STEPS`, `STATUS_LABELS`, `CLASS_CONFIG`, `DraftItem` (+471 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **59 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `carousel.tsx`, `devDependencies`, `lenis`, `class-variance-authority`, `clsx`, `cmdk`, `date-fns`, `embla-carousel-react`, `framer-motion`, `gsap`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `next`, `next-themes`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-popover`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`, `react-to-print`, `recharts`, `sonner`, `@supabase/supabase-js`, `tailwind-merge`, `tailwindcss-animate`, `vaul`, `zod`?**
  _High betweenness centrality (0.206) - this node is a cross-community bridge._
- **Why does `react` connect `carousel.tsx` to `sidebar.tsx`, `dependencies`, `use-toast.ts`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `page.tsx`, `page.tsx`, `use-toast.ts`, `carousel.tsx`, `page.tsx`, `sidebar.tsx`, `utils.ts`, `Order`, `page.tsx`, `page.tsx`, `combo-picker-modal.tsx`, `page.tsx`, `page.tsx`, `page.tsx`, `menubar.tsx`, `command.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `table.tsx`, `breadcrumb.tsx`, `navigation-menu.tsx`, `alert.tsx`, `input-otp.tsx`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **What connects `STEPS`, `RETIRADA_STEPS`, `STATUS_LABELS` to the rest of the system?**
  _476 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05028665028665029 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0825136612021858 - nodes in this community are weakly interconnected._
- **Should `client.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10256410256410256 - nodes in this community are weakly interconnected._