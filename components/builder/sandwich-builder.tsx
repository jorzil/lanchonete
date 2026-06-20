'use client'

import { useState, useMemo } from 'react'
import { X, Check, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { MENU, formatCurrency, calculateSubTotal, type SubCustomization, type Product } from '@/lib/store'
import { toast } from 'sonner'

interface SandwichBuilderProps {
  product?: Product
  open: boolean
  onClose: () => void
}

const STEPS = [
  { id: 1, title: 'Pão',    emoji: '🍞', required: true  },
  { id: 2, title: 'Carne',  emoji: '🥩', required: true  },
  { id: 3, title: 'Queijo', emoji: '🧀', required: true  },
  { id: 4, title: 'Salada', emoji: '🥗', required: false },
  { id: 5, title: 'Molhos', emoji: '🥫', required: false },
]

const DEFAULT_CUSTOMIZATION: SubCustomization = {
  size: '15cm',
  bread: '',
  meat: '',
  cheeses: [],
  salads: [],
  sauces: [],
  extras: {},
}

const ALL_SALAD_KEYS = MENU.salads.filter((s) => s.key !== 'salada-completa').map((s) => s.key)

const _meatMap   = new Map(MENU.meats.map((m) => [m.key, m]))
const _cheeseMap = new Map(MENU.cheeses.map((c) => [c.key, c]))
const _saladMap  = new Map(MENU.salads.filter(s => s.key !== 'salada-completa').map((s) => [s.key, s]))
const _sauceMap  = new Map(MENU.sauces.map((s) => [s.key, s]))
const _breadMap  = new Map(MENU.breads.map((b) => [b.key, b]))

const BREAD_GRADIENTS: Record<string, string> = {
  'tradicional': 'from-amber-100 to-amber-200',
  'gergelim':    'from-yellow-100 to-orange-100',
  '4-queijos':   'from-yellow-200 to-amber-300',
}

const MEAT_GRADIENTS: Record<string, string> = {
  'frango-cream-cheese': 'from-amber-100 to-orange-200',
  'carne-suprema':       'from-red-100 to-red-200',
  'lombo-defumado':      'from-orange-100 to-red-100',
}

const SAUCE_EMOJIS: Record<string, string> = {
  'baconese':           '🥓',
  'barbecue':           '🔥',
  'ranch':              '🌿',
  'maionese-temperada': '🫙',
  'mostarda-mel':       '🍯',
  'chipotle':           '🌶️',
}

export function SandwichBuilder({ product, open, onClose }: SandwichBuilderProps) {
  const { addItem, openCart } = useCart()
  const [step, setStep] = useState(1)
  const [customization, setCustomization] = useState<SubCustomization>({ ...DEFAULT_CUSTOMIZATION })
  const [errors, setErrors] = useState<Record<number, boolean>>({})

  const size = product?.category === 'subs-30cm' ? '30cm' : '15cm'
  const cheeseExtraPrice = size === '15cm' ? 3 : 5

  const total = useMemo(() => calculateSubTotal({ ...customization, size }), [customization, size])

  const isStepValid = (s: number): boolean => {
    if (s === 1) return customization.bread !== ''
    if (s === 2) return customization.meat !== ''
    if (s === 3) return customization.cheeses.length > 0
    return true
  }

  const handleClose = () => {
    setStep(1)
    setCustomization({ ...DEFAULT_CUSTOMIZATION })
    setErrors({})
    onClose()
  }

  const handleNext = () => {
    if (!isStepValid(step)) {
      setErrors((prev) => ({ ...prev, [step]: true }))
      return
    }
    setErrors((prev) => ({ ...prev, [step]: false }))
    setStep((s) => s + 1)
  }

  const handleBack = () => setStep((s) => Math.max(1, s - 1))

  const handleAddToCart = () => {
    const missingSteps: number[] = []
    if (!isStepValid(1)) missingSteps.push(1)
    if (!isStepValid(2)) missingSteps.push(2)
    if (!isStepValid(3)) missingSteps.push(3)

    if (missingSteps.length > 0) {
      const newErrors: Record<number, boolean> = {}
      missingSteps.forEach((s) => { newErrors[s] = true })
      setErrors(newErrors)
      setStep(missingSteps[0])
      return
    }

    const meatName  = _meatMap.get(customization.meat)?.name || ''
    const breadName = _breadMap.get(customization.bread)?.name || ''
    const itemName  = product ? product.name : `Sub ${size} — ${meatName}`
    addItem({
      productId: product?.id || `sub-custom-${size}`,
      name: itemName,
      price: total,
      quantity: 1,
      customization: { ...customization, size },
      image: '🥖',
    })
    toast.success('Sub adicionado ao carrinho!', {
      description: `${breadName} • ${meatName} — ${formatCurrency(total)}`,
    })
    handleClose()
    openCart()
  }

  const toggleCheese = (key: string) =>
    setCustomization((prev) => {
      const set = new Set(prev.cheeses)
      set.has(key) ? set.delete(key) : set.add(key)
      return { ...prev, cheeses: [...set] }
    })

  const toggleSalad = (key: string) =>
    setCustomization((prev) => {
      if (key === 'salada-completa') {
        const isComplete = prev.salads.includes('salada-completa')
        return { ...prev, salads: isComplete ? [] : ['salada-completa', ...ALL_SALAD_KEYS] }
      }
      const current = prev.salads.filter((s) => s !== 'salada-completa')
      const set = new Set(current)
      set.has(key) ? set.delete(key) : set.add(key)
      const next = [...set]
      const allSelected = ALL_SALAD_KEYS.every((k) => set.has(k))
      return { ...prev, salads: allSelected ? ['salada-completa', ...next] : next }
    })

  const toggleSauce = (key: string) =>
    setCustomization((prev) => {
      const set = new Set(prev.sauces)
      if (set.has(key)) { set.delete(key); return { ...prev, sauces: [...set] } }
      if (set.size >= MENU.maxSauces) return prev
      return { ...prev, sauces: [...set, key] }
    })

  const sauceCount = customization.sauces.length
  const sauceMax   = MENU.maxSauces

  const previewLines = useMemo(() => {
    const lines: { emoji: string; label: string; sub?: string }[] = []
    const bread = _breadMap.get(customization.bread)
    if (bread) lines.push({ emoji: bread.emoji, label: bread.name })
    const meat = _meatMap.get(customization.meat)
    if (meat) lines.push({ emoji: meat.emoji, label: meat.name })
    customization.cheeses.forEach((ck, i) => {
      const ch = _cheeseMap.get(ck)
      if (ch) lines.push({
        emoji: '🧀',
        label: ch.name,
        sub: i === 0 ? 'Incluso' : `+${formatCurrency(cheeseExtraPrice)}`,
      })
    })
    const realSalads = customization.salads.filter(s => s !== 'salada-completa')
    if (customization.salads.includes('salada-completa')) {
      lines.push({ emoji: '🥗', label: 'Salada Completa' })
    } else {
      realSalads.forEach((sk) => {
        const s = _saladMap.get(sk)
        if (s) lines.push({ emoji: '🥗', label: s.name })
      })
    }
    customization.sauces.forEach((sk) => {
      const s = _sauceMap.get(sk)
      if (s) lines.push({ emoji: SAUCE_EMOJIS[sk] || '🥫', label: s.name })
    })
    return lines
  }, [customization, cheeseExtraPrice])

  const hasError = errors[step]

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[96vh] flex flex-col rounded-2xl border-0 shadow-2xl bg-white">

        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-4 shrink-0 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-gray-900 text-lg font-black flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-xl shrink-0">🥖</div>
              <div>
                <div className="leading-tight">Monte Seu Sub</div>
                <div className="text-[11px] font-normal text-gray-400 leading-tight mt-0.5">
                  {product ? product.name : `Sub ${size}`} · {formatCurrency(total)}
                </div>
              </div>
            </DialogTitle>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center text-gray-500"
            >
              <X size={15} />
            </button>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {STEPS.map((s, i) => {
              const done    = step > s.id
              const current = step === s.id
              const hasErr  = errors[s.id]
              return (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  <button
                    onClick={() => done && setStep(s.id)}
                    className={`flex flex-col items-center gap-1 flex-1 min-w-0 transition-all ${done ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${
                      hasErr
                        ? 'bg-red-500 border-red-500 text-white'
                        : done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : current
                        ? 'bg-brand border-brand text-white'
                        : 'bg-gray-100 border-gray-200 text-gray-400'
                    }`}>
                      {hasErr ? <AlertCircle size={12} /> : done ? <Check size={12} /> : s.emoji}
                    </div>
                    <span className={`text-[10px] font-semibold hidden sm:block transition-colors ${
                      current ? 'text-brand' : done ? 'text-emerald-600' : 'text-gray-300'
                    }`}>{s.title}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 transition-colors ${i < step - 1 ? 'bg-emerald-300' : 'bg-gray-150'}`} style={{ backgroundColor: i < step - 1 ? '#6ee7b7' : '#f3f4f6' }} />
                  )}
                </div>
              )
            })}
          </div>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-hidden flex min-h-0">

          {/* Step content */}
          <div className="flex-1 overflow-y-auto p-5" key={step}>
            <div className="mb-5 flex items-center gap-3">
              <span className="text-2xl">{STEPS[step - 1].emoji}</span>
              <div>
                <h2 className="text-lg font-black text-gray-900 leading-tight">{STEPS[step - 1].title}</h2>
                <p className="text-[12px] text-gray-400 leading-tight mt-0.5">
                  {step === 1 && 'Escolha o tipo de pão — obrigatório'}
                  {step === 2 && 'Escolha a carne principal — obrigatório'}
                  {step === 3 && 'Mínimo 1 queijo obrigatório'}
                  {step === 4 && 'Opcional — escolha à vontade'}
                  {step === 5 && `Opcional — máximo ${sauceMax} molhos`}
                </p>
              </div>
              {!STEPS[step - 1].required && (
                <span className="ml-auto text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">opcional</span>
              )}
            </div>

            {hasError && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle size={15} className="text-red-500 shrink-0" />
                <p className="text-red-700 text-sm font-semibold">
                  {step === 1 && 'Selecione um tipo de pão para continuar.'}
                  {step === 2 && 'Selecione uma carne para continuar.'}
                  {step === 3 && 'Selecione pelo menos um queijo para continuar.'}
                </p>
              </div>
            )}

            {/* ── Step 1: Pão ── */}
            {step === 1 && (
              <div className="space-y-3">
                {MENU.breads.map((bread) => {
                  const selected = customization.bread === bread.key
                  const grad     = BREAD_GRADIENTS[bread.key] ?? 'from-amber-100 to-yellow-100'
                  return (
                    <button
                      key={bread.key}
                      onClick={() => { setCustomization((p) => ({ ...p, bread: bread.key })); setErrors((e) => ({ ...e, 1: false })) }}
                      className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.99] hover:scale-[1.01] ${
                        selected
                          ? 'border-brand bg-orange-50 shadow-md ring-1 ring-brand/15'
                          : 'border-gray-200 bg-white hover:border-brand/40 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-3xl shadow-sm shrink-0`}>
                        {bread.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-gray-900 text-base leading-tight">{bread.name}</div>
                        <div className="text-gray-500 text-xs mt-1 leading-relaxed">{bread.description}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        selected ? 'bg-brand border-brand shadow-md' : 'border-gray-300'
                      }`}>
                        {selected && <Check size={13} className="text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Step 2: Carne ── */}
            {step === 2 && (
              <div className="space-y-3">
                {MENU.meats.map((meat) => {
                  const selected = customization.meat === meat.key
                  const grad     = MEAT_GRADIENTS[meat.key] ?? 'from-orange-100 to-red-100'
                  return (
                    <button
                      key={meat.key}
                      onClick={() => { setCustomization((p) => ({ ...p, meat: meat.key })); setErrors((e) => ({ ...e, 2: false })) }}
                      className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.99] hover:scale-[1.01] ${
                        selected
                          ? 'border-brand bg-orange-50 shadow-md ring-1 ring-brand/15'
                          : 'border-gray-200 bg-white hover:border-brand/40 hover:shadow-sm'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-3xl shadow-sm shrink-0`}>
                        {meat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-gray-900 text-base leading-tight">{meat.name}</div>
                        <div className="text-gray-500 text-xs mt-1 leading-relaxed">{meat.description}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        selected ? 'bg-brand border-brand shadow-md' : 'border-gray-300'
                      }`}>
                        {selected && <Check size={13} className="text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Step 3: Queijo ── */}
            {step === 3 && (
              <div>
                <div className="mb-4 p-3.5 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">💡</span>
                  <p className="text-sm text-amber-800">
                    <strong>1º queijo incluso.</strong> Queijos adicionais: <strong>+{formatCurrency(cheeseExtraPrice)} cada</strong>
                  </p>
                </div>
                <div className="space-y-3">
                  {MENU.cheeses.map((cheese) => {
                    const selected   = customization.cheeses.includes(cheese.key)
                    const idx        = customization.cheeses.indexOf(cheese.key)
                    const isIncluded = selected && idx === 0
                    const isExtra    = selected && idx > 0
                    return (
                      <button
                        key={cheese.key}
                        onClick={() => { toggleCheese(cheese.key); setErrors((e) => ({ ...e, 3: false })) }}
                        className={`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all active:scale-[0.99] hover:scale-[1.01] ${
                          selected
                            ? 'border-brand bg-orange-50 shadow-md ring-1 ring-brand/15'
                            : 'border-gray-200 bg-white hover:border-brand/40 hover:shadow-sm'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-100 to-amber-200 flex items-center justify-center text-3xl shadow-sm shrink-0">
                          🧀
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-gray-900 text-base leading-tight flex items-center gap-2 flex-wrap">
                            {cheese.name}
                            {isIncluded && (
                              <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✓ Incluso</span>
                            )}
                            {isExtra && (
                              <span className="text-[11px] bg-orange-100 text-brand px-2 py-0.5 rounded-full font-bold">+{formatCurrency(cheeseExtraPrice)}</span>
                            )}
                          </div>
                          {!selected && (
                            <div className="text-gray-400 text-xs mt-1">Toque para selecionar</div>
                          )}
                        </div>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          selected ? 'bg-brand border-brand' : 'border-gray-300'
                        }`}>
                          {selected && <Check size={13} className="text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Step 4: Salada ── */}
            {step === 4 && (
              <div>
                {/* Salada Completa button */}
                <button
                  onClick={() => toggleSalad('salada-completa')}
                  className={`w-full mb-4 p-4 rounded-2xl border-2 flex items-center gap-4 transition-all active:scale-[0.99] hover:scale-[1.01] ${
                    customization.salads.includes('salada-completa')
                      ? 'border-emerald-400 bg-emerald-50 shadow-md ring-1 ring-emerald-400/20'
                      : 'border-dashed border-gray-300 bg-white hover:border-emerald-400/60 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-3xl shadow-sm shrink-0">
                    🥗
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-black text-gray-900 text-base">Salada Completa</div>
                    <div className="text-gray-500 text-xs mt-0.5">Marcar todas as saladas de uma vez</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    customization.salads.includes('salada-completa') ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                  }`}>
                    {customization.salads.includes('salada-completa') && <Check size={13} className="text-white" />}
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  {ALL_SALAD_KEYS.map((key) => {
                    const salad    = _saladMap.get(key)
                    if (!salad) return null
                    const selected = customization.salads.includes(key)
                    const SALAD_EMOJIS: Record<string, string> = {
                      'alface': '🥬', 'tomate': '🍅', 'cebola-roxa': '🧅',
                      'picles': '🥒', 'azeitona': '🫒', 'rucula': '🌿',
                    }
                    return (
                      <button
                        key={key}
                        onClick={() => toggleSalad(key)}
                        className={`p-3.5 rounded-xl border-2 flex items-center gap-3 text-left transition-all active:scale-[0.98] hover:scale-[1.02] ${
                          selected
                            ? 'border-brand bg-orange-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-brand/30 hover:shadow-sm'
                        }`}
                      >
                        <span className="text-2xl leading-none">{SALAD_EMOJIS[key] || '🥗'}</span>
                        <span className={`text-sm font-bold leading-tight ${selected ? 'text-brand' : 'text-gray-700'}`}>
                          {salad.name}
                        </span>
                        {selected && (
                          <div className="ml-auto w-5 h-5 rounded-full bg-brand flex items-center justify-center shrink-0">
                            <Check size={11} className="text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {customization.salads.length === 0 && (
                  <p className="mt-4 text-center text-xs text-gray-400">Nenhuma salada selecionada</p>
                )}
              </div>
            )}

            {/* ── Step 5: Molhos ── */}
            {step === 5 && (
              <div>
                {/* Counter badge */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm text-gray-500">Selecione até <strong>{sauceMax}</strong> molhos</p>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm transition-all ${
                    sauceCount >= sauceMax
                      ? 'bg-brand text-white shadow-md'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {sauceCount}/{sauceMax}
                    {sauceCount >= sauceMax && <Check size={13} />}
                  </div>
                </div>

                {/* Progress dots */}
                <div className="flex gap-2 mb-5">
                  {Array.from({ length: sauceMax }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all ${i < sauceCount ? 'bg-brand' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>

                <div className="space-y-2.5">
                  {MENU.sauces.map((sauce) => {
                    const selected = customization.sauces.includes(sauce.key)
                    const disabled = !selected && sauceCount >= sauceMax
                    return (
                      <button
                        key={sauce.key}
                        onClick={() => !disabled && toggleSauce(sauce.key)}
                        disabled={disabled}
                        className={`w-full p-3.5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                          disabled
                            ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                            : selected
                            ? 'border-brand bg-orange-50 shadow-md ring-1 ring-brand/15 active:scale-[0.99]'
                            : 'border-gray-200 bg-white hover:border-brand/40 hover:shadow-sm active:scale-[0.99] hover:scale-[1.01]'
                        }`}
                      >
                        <span className="text-2xl leading-none shrink-0">
                          {SAUCE_EMOJIS[sauce.key] || '🥫'}
                        </span>
                        <span className={`font-bold text-base flex-1 text-left ${selected ? 'text-brand' : disabled ? 'text-gray-300' : 'text-gray-800'}`}>
                          {sauce.name}
                        </span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          selected ? 'bg-brand border-brand shadow-sm' : 'border-gray-300'
                        }`}>
                          {selected && <Check size={13} className="text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {sauceCount >= sauceMax && (
                  <div className="mt-4 p-3 bg-brand/5 border border-brand/20 rounded-xl flex items-center gap-2">
                    <span className="text-base">✅</span>
                    <p className="text-sm font-bold text-brand">Limite de {sauceMax} molhos atingido!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Order summary sidebar ── */}
          <div className="hidden lg:flex w-52 shrink-0 border-l border-gray-100 flex-col bg-gray-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Seu pedido</p>
            </div>

            <div className="flex-1 p-3 overflow-y-auto">
              {previewLines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="text-4xl mb-2 opacity-20">🥖</div>
                  <p className="text-gray-300 text-xs font-medium">Personalize seu sub</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {previewLines.map((line, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white rounded-lg px-2.5 py-2 border border-gray-100">
                      <span className="text-sm leading-none mt-0.5">{line.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-700 text-xs font-semibold leading-tight block">{line.label}</span>
                        {line.sub && (
                          <span className={`text-[10px] font-bold ${line.sub === 'Incluso' ? 'text-emerald-600' : 'text-brand'}`}>
                            {line.sub}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Total</p>
              <p className="text-brand font-black text-2xl leading-none tabular-nums">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>

        {/* ── Mobile price strip ── */}
        <div className="lg:hidden flex items-center justify-between px-5 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide max-w-[60%]">
            {previewLines.slice(0, 4).map((l, i) => (
              <span key={i} className="text-base leading-none shrink-0">{l.emoji}</span>
            ))}
            {previewLines.length > 4 && (
              <span className="text-[10px] text-gray-400 font-bold shrink-0">+{previewLines.length - 4}</span>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total</p>
            <p className="text-brand font-black text-lg leading-none tabular-nums">{formatCurrency(total)}</p>
          </div>
        </div>

        {/* ── Footer nav ── */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-white shrink-0 gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="rounded-full border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 font-bold h-11 px-5 flex items-center gap-1.5 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={16} />
            Voltar
          </Button>

          <div className="text-center shrink-0">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none">
              {step} de {STEPS.length}
            </p>
            <p className="text-gray-900 font-black text-sm leading-tight mt-0.5">{STEPS[step - 1].title}</p>
          </div>

          {step < STEPS.length ? (
            <Button
              onClick={handleNext}
              className="rounded-full bg-brand hover:bg-brand-hover text-white font-black h-11 px-6 flex items-center gap-1.5 shadow-sm transition-all"
            >
              Próximo <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={handleAddToCart}
              className="rounded-full bg-brand hover:bg-brand-hover text-white font-black h-11 px-6 shadow-sm transition-all"
            >
              Adicionar 🛒
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
