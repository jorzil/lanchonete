'use client'

import { useState } from 'react'
import { X, Check, Plus, Minus, ChevronRight, ChevronLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { MENU, formatCurrency, calculateSubTotal, type SizeOption, type SubCustomization, type Product } from '@/lib/store'
import { toast } from 'sonner'

interface SandwichBuilderProps {
  product?: Product
  open: boolean
  onClose: () => void
}

const STEPS = [
  { id: 1, title: 'Tamanho', description: 'Escolha o tamanho do seu sub', emoji: '📏', required: true },
  { id: 2, title: 'Carne', description: 'Escolha a carne principal', emoji: '🥩', required: true },
  { id: 3, title: 'Queijo', description: 'Escolha o queijo', emoji: '🧀', required: true },
  { id: 4, title: 'Saladas', description: 'Escolha as saladas (opcional)', emoji: '🥗', required: false },
  { id: 5, title: 'Molhos', description: 'Escolha até 3 molhos', emoji: '🥫', required: false },
  { id: 6, title: 'Extras', description: 'Adicione ingredientes extras', emoji: '➕', required: false },
]

const MEAT_COLORS: Record<string, string> = {
  'frango-cream-cheese': 'from-amber-400 to-orange-400',
  'lombo-defumado':      'from-red-500 to-red-700',
  'carne-suprema':       'from-[#EE5C13] to-red-800',
}

const CHEESE_COLORS: Record<string, string> = {
  'mussarela':      'from-yellow-300 to-yellow-400',
  'cheddar-cremoso':'from-amber-400 to-orange-400',
  'creme-ricota':   'from-gray-100 to-gray-200',
}

const DEFAULT_CUSTOMIZATION: SubCustomization = {
  size: '15cm',
  meat: '',
  cheeses: [],
  salads: [],
  sauces: [],
  extras: {},
}

export function SandwichBuilder({ product, open, onClose }: SandwichBuilderProps) {
  const { addItem, openCart } = useCart()
  const [step, setStep] = useState(1)
  const [customization, setCustomization] = useState<SubCustomization>({ ...DEFAULT_CUSTOMIZATION })

  const total = calculateSubTotal(customization)

  const canProceed = (): boolean => {
    if (step === 2) return customization.meat !== ''
    if (step === 3) return customization.cheeses.length > 0
    return true
  }

  const handleClose = () => {
    setStep(1)
    setCustomization({ ...DEFAULT_CUSTOMIZATION })
    onClose()
  }

  const handleAddToCart = () => {
    if (!canProceed()) return
    const meatName = MENU.meats.find((m) => m.key === customization.meat)?.name || ''
    const itemName = product
      ? product.name
      : `Sub ${customization.size} — ${meatName}`
    addItem({
      productId: product?.id || `sub-custom-${customization.size}`,
      name: itemName,
      price: total,
      quantity: 1,
      customization,
      image: '🥖',
    })
    toast.success('Sub adicionado ao carrinho!', { description: `${itemName} — ${formatCurrency(total)}` })
    handleClose()
    openCart()
  }

  const toggleCheese = (key: string) =>
    setCustomization((prev) => ({
      ...prev,
      cheeses: prev.cheeses.includes(key)
        ? prev.cheeses.filter((c) => c !== key)
        : [...prev.cheeses, key],
    }))

  const toggleSalad = (key: string) =>
    setCustomization((prev) => {
      if (key === 'salada-completa') {
        const allSaladKeys = MENU.salads.filter((s) => s.key !== 'salada-completa').map((s) => s.key)
        const isComplete = prev.salads.includes('salada-completa')
        return { ...prev, salads: isComplete ? [] : ['salada-completa', ...allSaladKeys] }
      }
      const withoutComplete = prev.salads.filter((s) => s !== 'salada-completa')
      return {
        ...prev,
        salads: prev.salads.includes(key)
          ? withoutComplete.filter((s) => s !== key)
          : [...withoutComplete, key],
      }
    })

  const toggleSauce = (key: string) =>
    setCustomization((prev) => {
      if (prev.sauces.includes(key)) return { ...prev, sauces: prev.sauces.filter((s) => s !== key) }
      if (prev.sauces.length >= MENU.maxSauces) return prev
      return { ...prev, sauces: [...prev.sauces, key] }
    })

  const setExtra = (key: string, qty: number) =>
    setCustomization((prev) => ({
      ...prev,
      extras: { ...prev.extras, [key]: Math.max(0, qty) },
    }))

  const selectedMeat    = MENU.meats.find((m) => m.key === customization.meat)
  const selectedCheeses = MENU.cheeses.filter((ch) => customization.cheeses.includes(ch.key))
  const isDoubleCheese   = customization.cheeses.length > 1

  /* Build ingredient preview list */
  const previewIngredients: Array<{ emoji: string; label: string }> = []
  previewIngredients.push({ emoji: '📏', label: customization.size })
  if (selectedMeat) previewIngredients.push({ emoji: '🥩', label: selectedMeat.name })
  selectedCheeses.forEach((ch) => previewIngredients.push({ emoji: '🧀', label: ch.name }))
  if (isDoubleCheese) previewIngredients.push({ emoji: '✨', label: 'Queijo em Dobro (adicional)' })
  customization.salads.forEach((s) => {
    const salad = MENU.salads.find((sl) => sl.key === s)
    if (salad) previewIngredients.push({ emoji: '🥗', label: salad.name })
  })
  customization.sauces.forEach((s) => {
    const sauce = MENU.sauces.find((sc) => sc.key === s)
    if (sauce) previewIngredients.push({ emoji: '🥫', label: sauce.name })
  })
  Object.entries(customization.extras).forEach(([key, qty]) => {
    if (qty > 0) {
      const extra = MENU.extras.find((e) => e.key === key)
      if (extra) previewIngredients.push({ emoji: '➕', label: `${extra.name} ×${qty}` })
    }
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[95vh] flex flex-col rounded-3xl border-0 shadow-2xl">

        {/* ── Header Premium ── */}
        <DialogHeader className="px-6 pt-6 pb-5 shrink-0 bg-gradient-to-r from-[#0B2C5C] via-[#163A6E] to-[#0A2452] border-b-2 border-[#FF6B1A]">
          <div className="flex items-center justify-between mb-5">
            <DialogTitle className="text-white text-2xl font-black flex items-center gap-3">
              <span className="text-3xl">🥖</span>
              <div className="flex flex-col">
                <span>Monte Seu Sub</span>
                <span className="text-xs font-normal text-white/60">Personalize do seu jeito</span>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:flex flex-col items-end">
                <p className="text-xs text-white/60 font-medium">Total</p>
                <p className="text-3xl font-black text-[#FF6B1A] leading-none">{formatCurrency(total)}</p>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#EE5C13] hover:scale-110 transition-all flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Step progress bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => step > s.id && setStep(s.id)}
                  className={`flex items-center gap-1.5 transition-all ${step > s.id ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                      s.id < step
                        ? 'bg-[#EE5C13] border-[#EE5C13] text-white'
                        : s.id === step
                        ? 'bg-white border-white text-[#0B2C5C]'
                        : 'bg-transparent border-white/25 text-white/30'
                    }`}
                  >
                    {s.id < step ? <Check size={12} /> : s.id}
                  </div>
                  <span
                    className={`text-xs font-semibold transition-colors hidden sm:inline ${
                      s.id === step
                        ? 'text-white'
                        : s.id < step
                        ? 'text-[#EE5C13]'
                        : 'text-white/30'
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 h-0.5 rounded-full shrink-0 ${i < step - 1 ? 'bg-[#EE5C13]' : 'bg-white/15'}`} />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0">

          {/* Step content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{STEPS[step - 1].emoji}</span>
                <h2 className="text-xl font-black text-gray-900">{STEPS[step - 1].title}</h2>
                {!STEPS[step - 1].required && (
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">opcional</span>
                )}
              </div>
              <p className="text-gray-500 text-sm">{STEPS[step - 1].description}</p>
            </div>

            {/* Step 1 — Size (Premium Cards) */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                {MENU.sizes.map((size) => (
                  <button
                    key={size.key}
                    onClick={() => setCustomization((prev) => ({ ...prev, size: size.key as SizeOption }))}
                    className={`relative p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.03] overflow-hidden group ${
                      customization.size === size.key
                        ? 'border-[#EE5C13] bg-gradient-to-br from-[#FFF5EB] to-white shadow-lg shadow-orange-200/50'
                        : 'border-gray-200 hover:border-[#EE5C13]/40 bg-white hover:shadow-md'
                    }`}
                  >
                    {customization.size === size.key && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#EE5C13] flex items-center justify-center shadow-lg">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                    <div className="text-6xl mb-4 transition-transform group-hover:scale-125 inline-block">
                      {size.key === '15cm' ? '🥖' : '🥖🥖'}
                    </div>
                    <div className="font-black text-gray-900 text-2xl mb-1">{size.label}</div>
                    <div className="text-[#EE5C13] font-black text-xl mb-2">{formatCurrency(size.price)}</div>
                    <div className="text-gray-500 text-xs leading-relaxed">{size.description}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — Meat (Premium) */}
            {step === 2 && (
              <div className="space-y-3">
                {MENU.meats.map((item) => {
                  const selected = customization.meat === item.key
                  const grad = MEAT_COLORS[item.key] ?? 'from-orange-400 to-red-400'
                  return (
                    <button
                      key={item.key}
                      onClick={() => setCustomization((prev) => ({ ...prev, meat: item.key }))}
                      className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all hover:scale-[1.02] ${
                        selected
                          ? 'border-[#EE5C13] bg-gradient-to-r from-[#FFF5EB] to-white shadow-md shadow-orange-200/30'
                          : 'border-gray-200 bg-white hover:border-[#EE5C13]/40'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl shadow-md shrink-0`}>
                        🥩
                      </div>
                      <div className="flex-1">
                        <div className="font-black text-gray-900 text-base">{item.name}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        selected ? 'bg-[#EE5C13] border-[#EE5C13] scale-110 shadow-lg' : 'border-gray-300'
                      }`}>
                        {selected && <Check size={13} className="text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Step 3 — Cheese (multi-select premium) */}
            {step === 3 && (
              <div>
                <div className="mb-5 p-4 bg-gradient-to-r from-[#0B2C5C]/5 to-[#EE5C13]/5 rounded-xl border border-[#0B2C5C]/10">
                  <p className="text-xs text-gray-600 font-semibold mb-1">💡 Dica</p>
                  <p className="text-sm text-gray-700">O primeiro queijo é incluso. Adicionais são cobrados: <span className="font-bold text-[#EE5C13]">+ R$ 3,00 cada</span></p>
                </div>
                <div className="space-y-3">
                  {MENU.cheeses.map((item, idx) => {
                    const selected = customization.cheeses.includes(item.key)
                    const isFirst = selected && idx === 0
                    const grad = CHEESE_COLORS[item.key] ?? 'from-yellow-200 to-yellow-300'
                    const cheesePrice = customization.size === '15cm' ? 3 : 5
                    const cheeseIndex = customization.cheeses.indexOf(item.key)
                    const isIncluded = cheeseIndex === 0

                    return (
                      <button
                        key={item.key}
                        onClick={() => toggleCheese(item.key)}
                        className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all hover:scale-[1.02] ${
                          selected
                            ? 'border-[#EE5C13] bg-gradient-to-r from-[#FFF5EB] to-white shadow-md'
                            : 'border-gray-200 bg-white hover:border-[#EE5C13]/50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl shadow-sm shrink-0`}>
                          🧀
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-gray-900 text-base flex items-center gap-2">
                            {item.name}
                            {selected && isIncluded && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Incluso</span>
                            )}
                            {selected && !isIncluded && (
                              <span className="text-xs bg-orange-100 text-[#EE5C13] px-2 py-0.5 rounded-full font-bold">+{formatCurrency(cheesePrice)}</span>
                            )}
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          selected ? 'bg-[#EE5C13] border-[#EE5C13]' : 'border-gray-300'
                        }`}>
                          {selected && <Check size={13} className="text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {isDoubleCheese && (
                  <div className="mt-5 p-4 bg-gradient-to-r from-[#FF6B1A]/10 to-[#EE5C13]/10 border-l-4 border-[#FF6B1A] rounded-lg flex items-start gap-3">
                    <span className="text-2xl shrink-0">✨</span>
                    <div>
                      <p className="font-bold text-[#EE5C13] text-sm">Queijo em Dobro</p>
                      <p className="text-xs text-gray-600 mt-0.5">Adicionado automaticamente por +{formatCurrency(customization.size === '15cm' ? 3 : 5)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4 — Salads (premium grid) */}
            {step === 4 && (
              <div>
                <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wide">Sem limite — escolha quantas quiser</p>
                <div className="grid grid-cols-2 gap-3">
                  {MENU.salads.map((item) => {
                    const selected = customization.salads.includes(item.key)
                    const isComplete = item.key === 'salada-completa'
                    const isEmpty = customization.salads.length === 0

                    return (
                      <button
                        key={item.key}
                        onClick={() => toggleSalad(item.key)}
                        className={`p-3 rounded-xl font-semibold text-sm transition-all border-2 hover:scale-105 flex flex-col items-center gap-2 ${
                          selected
                            ? isComplete
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 text-green-700 shadow-md shadow-green-100'
                              : 'bg-gradient-to-br from-orange-50 to-amber-50 border-[#EE5C13] text-[#EE5C13] shadow-md'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#EE5C13]/30'
                        }`}
                      >
                        <span className="text-2xl">{isComplete ? '🥗✨' : '🥗'}</span>
                        <span className="text-xs text-center leading-tight">{item.name}</span>
                        {selected && <Check size={14} />}
                      </button>
                    )
                  })}
                </div>
                {customization.salads.includes('salada-completa') && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-bold text-green-700 mb-2">✅ Salada Completa Selecionada</p>
                    <p className="text-xs text-green-700">Todas as saladas disponíveis incluídas no seu sub</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5 — Sauces (tag-pill style) */}
            {step === 5 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-400 font-medium">Selecione até {MENU.maxSauces} molhos</p>
                  <span className={`text-sm font-black tabular-nums transition-colors ${
                    customization.sauces.length >= MENU.maxSauces ? 'text-[#EE5C13]' : 'text-gray-400'
                  }`}>
                    {customization.sauces.length}/{MENU.maxSauces}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {MENU.sauces.map((item) => {
                    const selected = customization.sauces.includes(item.key)
                    const disabled = !selected && customization.sauces.length >= MENU.maxSauces
                    return (
                      <button
                        key={item.key}
                        onClick={() => !disabled && toggleSauce(item.key)}
                        disabled={disabled}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full font-semibold text-sm transition-all border-2 ${
                          disabled
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed opacity-50'
                            : selected
                            ? 'bg-[#EE5C13] border-[#EE5C13] text-white shadow-md shadow-orange-200 hover:scale-105'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#EE5C13]/50 hover:text-[#EE5C13] hover:scale-105'
                        }`}
                      >
                        🥫 {item.name}
                        {selected && <Check size={12} />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 6 — Extras */}
            {step === 6 && (
              <div className="space-y-3">
                {MENU.extras.map((extra) => {
                  const qty = customization.extras[extra.key] || 0
                  const price = customization.size === '15cm' ? extra.price15cm : extra.price30cm
                  return (
                    <div
                      key={extra.key}
                      className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        qty > 0 ? 'border-[#EE5C13] bg-orange-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-2xl shrink-0">
                        ➕
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-gray-900 text-sm">{extra.name}</div>
                        <div className="text-[#EE5C13] text-xs font-bold mt-0.5">
                          +{formatCurrency(price)} por unidade
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setExtra(extra.key, qty - 1)}
                          disabled={qty === 0}
                          className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-all hover:border-gray-300"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center font-black text-gray-900 text-sm tabular-nums">
                          {qty}
                        </span>
                        <button
                          onClick={() => setExtra(extra.key, qty + 1)}
                          className="w-8 h-8 rounded-full border-2 border-[#EE5C13] text-[#EE5C13] flex items-center justify-center hover:bg-orange-50 transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Preview panel ── */}
          <div
            className="lg:w-60 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col"
            style={{ background: '#0A2452' }}
          >
            <div className="p-4 border-b border-white/10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em]">Seu Sub</p>
            </div>

            {/* Ingredient emoji stack */}
            <div className="flex-1 p-4 overflow-y-auto">
              {previewIngredients.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="text-4xl mb-2 opacity-30">🥖</div>
                  <p className="text-white/25 text-xs">Seu sub vai aparecer aqui...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {previewIngredients.map((ing, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 bg-white/[0.06] rounded-xl px-3 py-2 border border-white/[0.08] animate-ingredient"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span className="text-base leading-none">{ing.emoji}</span>
                      <span className="text-white/80 text-xs font-semibold leading-tight">{ing.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="p-4 border-t border-white/10">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total</p>
              <p className="text-[#EE5C13] font-black text-3xl leading-none price-highlight">
                {formatCurrency(total)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer nav (Premium) ── */}
        <div className="px-6 py-4 border-t-2 border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white shrink-0">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded-full border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-bold px-5 h-11 flex items-center gap-1.5 transition-all disabled:opacity-30"
          >
            <ChevronLeft size={16} />
            Voltar
          </Button>

          <div className="text-center">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
              Etapa {step} de {STEPS.length}
            </p>
            <p className="font-black text-gray-900 text-sm">{STEPS[step - 1].title}</p>
          </div>

          {step < STEPS.length ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="rounded-full bg-gradient-to-r from-[#EE5C13] to-[#FF6B1A] hover:shadow-lg hover:scale-105 text-white font-black px-6 h-11 flex items-center gap-1.5 shadow-md shadow-orange-400/30 disabled:opacity-40 transition-all"
            >
              Próximo <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleAddToCart}
              disabled={!canProceed()}
              className="rounded-full bg-gradient-to-r from-[#10B981] to-emerald-500 hover:shadow-lg hover:scale-105 text-white font-black px-6 h-11 shadow-md shadow-green-400/30 disabled:opacity-40 transition-all"
            >
              Adicionar 🛒
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
