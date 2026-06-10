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
  { id: 1, title: 'Tamanho', description: 'Escolha o tamanho do seu sub', required: true },
  { id: 2, title: 'Carne', description: 'Escolha a carne principal', required: true },
  { id: 3, title: 'Queijo', description: 'Escolha o queijo', required: true },
  { id: 4, title: 'Saladas', description: 'Escolha as saladas (opcional)', required: false },
  { id: 5, title: 'Molhos', description: 'Escolha até 3 molhos', required: false },
  { id: 6, title: 'Extras', description: 'Adicione ingredientes extras', required: false },
]

const DEFAULT_CUSTOMIZATION: SubCustomization = { size: '15cm', meat: '', cheese: '', salads: [], sauces: [], extras: {} }

function PreviewTag({ label, emoji }: { label: string; emoji: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs rounded-full px-2 py-0.5 font-medium">
      {emoji} {label}
    </span>
  )
}

export function SandwichBuilder({ product, open, onClose }: SandwichBuilderProps) {
  const { addItem, openCart } = useCart()
  const [step, setStep] = useState(1)
  const [customization, setCustomization] = useState<SubCustomization>({ ...DEFAULT_CUSTOMIZATION })

  const total = calculateSubTotal(customization)

  const canProceed = (): boolean => {
    if (step === 2) return customization.meat !== ''
    if (step === 3) return customization.cheese !== ''
    return true
  }

  const handleClose = () => { setStep(1); setCustomization({ ...DEFAULT_CUSTOMIZATION }); onClose() }

  const handleAddToCart = () => {
    if (!canProceed()) return
    const itemName = product ? product.name : `Sub ${customization.size} - ${MENU.meats.find((m) => m.key === customization.meat)?.name || ''}`
    addItem({ productId: product?.id || `sub-custom-${customization.size}`, name: itemName, price: total, quantity: 1, customization, image: '🥖' })
    toast.success('Sub adicionado ao carrinho!', { description: `${itemName} — ${formatCurrency(total)}` })
    handleClose()
    openCart()
  }

  const toggleSalad = (key: string) => setCustomization((prev) => ({ ...prev, salads: prev.salads.includes(key) ? prev.salads.filter((s) => s !== key) : [...prev.salads, key] }))
  const toggleSauce = (key: string) => setCustomization((prev) => {
    if (prev.sauces.includes(key)) return { ...prev, sauces: prev.sauces.filter((s) => s !== key) }
    if (prev.sauces.length >= MENU.maxSauces) return prev
    return { ...prev, sauces: [...prev.sauces, key] }
  })
  const setExtra = (key: string, qty: number) => setCustomization((prev) => ({ ...prev, extras: { ...prev.extras, [key]: Math.max(0, qty) } }))

  const selectedMeat = MENU.meats.find((m) => m.key === customization.meat)
  const selectedCheese = MENU.cheeses.find((ch) => ch.key === customization.cheese)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[95vh] flex flex-col">
        <DialogHeader className="px-6 py-4 bg-[#023E74] text-white shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white text-lg font-bold">Monte Seu Sub 🥖</DialogTitle>
            <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors"><X size={18} /></button>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-1 mb-2">
              {STEPS.map((s) => (
                <button key={s.id} onClick={() => step > s.id && setStep(s.id)}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    s.id < step ? 'bg-[#EE5C13]' : s.id === step ? 'bg-white' : 'bg-white/30'
                  }`} />
              ))}
            </div>
            <p className="text-white/80 text-xs">Etapa {step} de {STEPS.length} — {STEPS[step - 1].title}</p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          <div className="flex-1 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">{STEPS[step - 1].title}</h2>
            <p className="text-sm text-gray-500 mb-4">{STEPS[step - 1].description}</p>

            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MENU.sizes.map((size) => (
                  <button key={size.key} onClick={() => setCustomization((prev) => ({ ...prev, size: size.key as SizeOption }))}
                    className={`p-5 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                      customization.size === size.key ? 'border-[#EE5C13] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="text-4xl mb-3">{size.key === '15cm' ? '🥖' : '🥖🥖'}</div>
                    <div className="font-bold text-gray-800 text-xl">{size.label}</div>
                    <div className="text-[#EE5C13] font-semibold mt-1">{formatCurrency(size.price)}</div>
                    <div className="text-gray-500 text-xs mt-1">{size.description}</div>
                    {customization.size === size.key && <div className="mt-3 flex items-center gap-1 text-[#EE5C13] text-xs font-medium"><Check size={12} /> Selecionado</div>}
                  </button>
                ))}
              </div>
            )}

            {(step === 2 || step === 3) && (
              <div className="space-y-3">
                {(step === 2 ? MENU.meats : MENU.cheeses).map((item) => {
                  const selected = step === 2 ? customization.meat === item.key : customization.cheese === item.key
                  const emoji = step === 2 ? '🥩' : '🧀'
                  return (
                    <button key={item.key}
                      onClick={() => setCustomization((prev) => step === 2 ? { ...prev, meat: item.key } : { ...prev, cheese: item.key })}
                      className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all hover:scale-[1.01] ${
                        selected ? 'border-[#EE5C13] bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="text-3xl">{emoji}</div>
                      <div className="flex-1"><div className="font-semibold text-gray-800">{item.name}</div></div>
                      {selected && <div className="w-6 h-6 rounded-full bg-[#EE5C13] flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                    </button>
                  )
                })}
              </div>
            )}

            {(step === 4 || step === 5) && (
              <div>
                {step === 5 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">Selecione até 3 molhos</span>
                    <span className={`text-sm font-bold ${customization.sauces.length >= 3 ? 'text-[#EE5C13]' : 'text-gray-400'}`}>{customization.sauces.length}/{MENU.maxSauces}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(step === 4 ? MENU.salads : MENU.sauces).map((item) => {
                    const selected = step === 4 ? customization.salads.includes(item.key) : customization.sauces.includes(item.key)
                    const disabled = step === 5 && !selected && customization.sauces.length >= MENU.maxSauces
                    const emoji = step === 4 ? '🥗' : '🥫'
                    return (
                      <button key={item.key} onClick={() => !disabled && (step === 4 ? toggleSalad(item.key) : toggleSauce(item.key))} disabled={disabled}
                        className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                          disabled ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : selected ? 'border-[#EE5C13] bg-orange-50 hover:scale-[1.02]'
                          : 'border-gray-200 hover:border-gray-300 hover:scale-[1.02]'
                        }`}>
                        <div className="text-xl">{emoji}</div>
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        {selected && <div className="ml-auto w-5 h-5 rounded-full bg-[#EE5C13] flex items-center justify-center shrink-0"><Check size={11} className="text-white" /></div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-3">
                {MENU.extras.map((extra) => {
                  const qty = customization.extras[extra.key] || 0
                  const price = customization.size === '15cm' ? extra.price15cm : extra.price30cm
                  return (
                    <div key={extra.key} className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                      qty > 0 ? 'border-[#EE5C13] bg-orange-50' : 'border-gray-200'
                    }`}>
                      <div className="text-2xl">➕</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-sm">{extra.name}</div>
                        <div className="text-[#EE5C13] text-xs font-medium">+{formatCurrency(price)} por unidade</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setExtra(extra.key, qty - 1)} disabled={qty === 0} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"><Minus size={12} /></button>
                        <span className="w-6 text-center font-bold text-sm">{qty}</span>
                        <button onClick={() => setExtra(extra.key, qty + 1)} className="w-8 h-8 rounded-full border border-[#EE5C13] text-[#EE5C13] flex items-center justify-center hover:bg-orange-50 transition-colors"><Plus size={12} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="lg:w-56 shrink-0 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-100 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Seu Sub</h3>
            <div className="flex flex-wrap gap-1.5">
              <PreviewTag label={customization.size} emoji="📏" />
              {selectedMeat && <PreviewTag label={selectedMeat.name} emoji="🥩" />}
              {selectedCheese && <PreviewTag label={selectedCheese.name} emoji="🧀" />}
              {customization.salads.map((s) => { const salad = MENU.salads.find((sl) => sl.key === s); return salad ? <PreviewTag key={s} label={salad.name} emoji="🥗" /> : null })}
              {customization.sauces.map((s) => { const sauce = MENU.sauces.find((sc) => sc.key === s); return sauce ? <PreviewTag key={s} label={sauce.name} emoji="🥫" /> : null })}
              {Object.entries(customization.extras).filter(([, qty]) => qty > 0).map(([key, qty]) => { const extra = MENU.extras.find((e) => e.key === key); return extra ? <PreviewTag key={key} label={`${extra.name} x${qty}`} emoji="➕" /> : null })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-black text-[#EE5C13]">{formatCurrency(total)}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white shrink-0">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1} className="flex items-center gap-2">
            <ChevronLeft size={16} />Voltar
          </Button>
          <div className="text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="font-bold text-[#EE5C13]">{formatCurrency(total)}</p>
          </div>
          {step < STEPS.length ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()} className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white flex items-center gap-2">
              Próximo<ChevronRight size={16} />
            </Button>
          ) : (
            <Button onClick={handleAddToCart} disabled={!canProceed()} className="bg-[#EE5C13] hover:bg-[#d94b0d] text-white font-bold px-6">
              Adicionar ao Carrinho
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
