"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  X,
  Minus,
  Plus,
  Beef,
  ChevronRight,
  Salad,
  Droplets,
  Sandwich,
} from "lucide-react"
import { MENU, formatCurrency, type CustomBurger, type CartItem } from "@/lib/store"
import { cn } from "@/lib/utils"

const STEPS = ["Tamanho", "Carne", "Queijo", "Salada", "Molhos", "Complementos"]

const defaultBurger: CustomBurger = {
  step: 1,
  size: null,
  sizePrice: 0,
  meat: null,
  cheeses: [],
  salads: [],
  sauces: [],
  extras: {},
  total: 0,
}

interface SandwichBuilderProps {
  open: boolean
  onClose: () => void
  onAddToCart: (item: CartItem) => void
}

export function SandwichBuilder({ open, onClose, onAddToCart }: SandwichBuilderProps) {
  const [burger, setBurger] = useState<CustomBurger>({ ...defaultBurger })
  const [customName, setCustomName] = useState("")

  const resetAndClose = useCallback(() => {
    setBurger({ ...defaultBurger })
    setCustomName("")
    onClose()
  }, [onClose])

  const calcTotal = useCallback((b: CustomBurger) => {
    let total = b.sizePrice
    if (b.size) {
      const sizeData = MENU.sizes[b.size as keyof typeof MENU.sizes]
      Object.entries(b.extras).forEach(([key, qty]) => {
        if (qty > 0) {
          total += (sizeData.extras as Record<string, number>)[key] * qty
        }
      })
    }
    return total
  }, [])

  const total = calcTotal(burger)

  const canProceed = () => {
    if (burger.step === 1 && !burger.size) return false
    // Meat and cheese are now optional - steps 2 and 3 can always proceed
    return true
  }

  const nextStep = () => {
    if (!canProceed()) return
    if (burger.step < 6) {
      setBurger((b) => ({ ...b, step: b.step + 1 }))
    }
  }

  const prevStep = () => {
    if (burger.step > 1) {
      setBurger((b) => ({ ...b, step: b.step - 1 }))
    }
  }

  const addToCart = () => {
    if (!burger.size) return

    const extrasDesc = Object.entries(burger.extras)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v}x ${MENU.extras[k].name}`)
      .join(", ")

    const description = [
      `Tamanho: ${burger.size}`,
      `Carne: ${burger.meat || "Sem carne"}`,
      `Queijos: ${burger.cheeses.length > 0 ? burger.cheeses.join(", ") : "Sem queijo"}`,
      `Salada: ${burger.salads.length > 0 ? burger.salads.join(", ") : "Sem salada"}`,
      `Molhos: ${burger.sauces.length > 0 ? burger.sauces.join(", ") : "Sem molho"}`,
      extrasDesc ? `Extras: ${extrasDesc}` : "",
    ]
      .filter(Boolean)
      .join("\n")

    onAddToCart({
      id: `custom_${Date.now()}`,
      name: customName.trim() ? `Lanche ${burger.size} - ${customName}` : `Lanche ${burger.size}`,
      price: total,
      cost: burger.sizePrice * 0.4,
      quantity: 1,
      observation: description,
      isCustom: true,
    })

    resetAndClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="w-full h-full md:max-w-3xl md:h-auto md:max-h-[90vh] md:w-[calc(100vw-2rem)] mx-auto flex flex-col p-0 gap-0 overflow-hidden rounded-none md:rounded-xl">
        {/* Header */}
        <DialogHeader className="p-6 bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Sandwich className="h-6 w-6" />
                Monte seu Lanche
              </DialogTitle>
              <p className="text-sm opacity-80 mt-1">Personalize do seu jeito!</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Total:</p>
              <p className="text-3xl font-black">{formatCurrency(total)}</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex gap-1.5 mt-4">
            {STEPS.map((label, idx) => {
              const stepNum = idx + 1
              const isCurrent = stepNum === burger.step
              const isCompleted = stepNum < burger.step
              return (
                <div
                  key={label}
                  className={cn(
                    "flex-1 py-1.5 px-2 rounded-md text-center text-xs font-semibold transition-all",
                    isCurrent && "bg-card text-foreground shadow-sm",
                    isCompleted && "bg-primary-foreground/20 text-primary-foreground",
                    !isCurrent && !isCompleted && "bg-primary-foreground/10 text-primary-foreground/60"
                  )}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{stepNum}</span>
                </div>
              )
            })}
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 p-6 bg-muted/30">
          {/* Step 1: Tamanho */}
          {burger.step === 1 && (
            <div>
              <h4 className="text-lg font-bold text-foreground mb-4">Escolha o tamanho</h4>
              <div className="grid grid-cols-2 gap-4">
                {(Object.entries(MENU.sizes) as [string, { name: string; price: number }][]).map(([key, size]) => (
                  <button
                    key={key}
                    onClick={() => setBurger((b) => ({ ...b, size: key, sizePrice: size.price }))}
                    className={cn(
                      "p-6 rounded-xl border-2 transition-all text-center",
                      burger.size === key
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-20 h-20 mx-auto mb-3 rounded-full flex items-center justify-center text-card font-black text-2xl",
                        key === "15cm" ? "bg-chart-3" : "bg-primary"
                      )}
                    >
                      {key}
                    </div>
                    <h5 className="font-bold text-lg text-foreground">Lanche {key}</h5>
                    <p className="text-2xl font-black text-primary">{formatCurrency(size.price)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Carne */}
          {burger.step === 2 && (
            <div>
              <h4 className="text-lg font-bold text-foreground mb-2">Escolha sua carne</h4>
              <p className="text-sm text-muted-foreground mb-4">Opcional - pode pular se preferir sem carne</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sem Carne option */}
                <button
                  onClick={() => setBurger((b) => ({ ...b, meat: null }))}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center",
                    burger.meat === null
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <X className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <h5 className="font-bold text-foreground">Sem Carne</h5>
                  <Badge variant="secondary" className="mt-2">
                    Opcional
                  </Badge>
                </button>
                {MENU.meats.map((meat) => (
                  <button
                    key={meat.key}
                    onClick={() => setBurger((b) => ({ ...b, meat: meat.name }))}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      burger.meat === meat.name
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Beef className="h-10 w-10 mx-auto mb-3 text-destructive" />
                    <h5 className="font-bold text-foreground">{meat.name}</h5>
                    <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-0">
                      Incluso
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Queijo */}
          {burger.step === 3 && (
            <div>
              <h4 className="text-lg font-bold text-foreground mb-2">Escolha seu queijo</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Opcional - selecione ate 2 queijos ou pule sem queijo
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Sem Queijo option */}
                <button
                  onClick={() =>
                    setBurger((b) => {
                      const newExtras = { ...b.extras }
                      delete newExtras["queijo"]
                      return { ...b, cheeses: [], extras: newExtras }
                    })
                  }
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center relative",
                    burger.cheeses.length === 0
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {burger.cheeses.length === 0 && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <X className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <h5 className="font-bold text-foreground">Sem Queijo</h5>
                  <Badge variant="secondary" className="mt-2">
                    Opcional
                  </Badge>
                </button>
                {MENU.cheeses.map((cheese) => {
                  const isSelected = burger.cheeses.includes(cheese.name)
                  return (
                    <button
                      key={cheese.key}
                      onClick={() =>
                        setBurger((b) => {
                          let newCheeses: string[]
                          if (isSelected) {
                            newCheeses = b.cheeses.filter((c) => c !== cheese.name)
                          } else if (b.cheeses.length < 2) {
                            newCheeses = [...b.cheeses, cheese.name]
                          } else {
                            newCheeses = [b.cheeses[1], cheese.name]
                          }
                          const newExtras = { ...b.extras }
                          if (newCheeses.length === 2) {
                            newExtras["queijo"] = 1
                          } else {
                            delete newExtras["queijo"]
                          }
                          return { ...b, cheeses: newCheeses, extras: newExtras }
                        })
                      }
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-center relative",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-accent/30 flex items-center justify-center">
                        <span className="text-xl" role="img" aria-label="queijo">&#x1F9C0;</span>
                      </div>
                      <h5 className="font-bold text-foreground">{cheese.name}</h5>
                      <Badge variant="secondary" className="mt-2 bg-primary/10 text-primary border-0">
                        Incluso
                      </Badge>
                    </button>
                  )
                })}
              </div>
              {burger.cheeses.length === 2 && burger.size && (
                <div className="mt-4 p-3 bg-accent/10 border-2 border-accent rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">Queijo em Dobro adicionado!</p>
                    <p className="text-sm text-muted-foreground">
                      {burger.cheeses.join(" + ")} - complemento automatico
                    </p>
                  </div>
                  <Badge className="bg-accent text-accent-foreground font-bold text-sm">
                    +{formatCurrency(
                      (MENU.sizes[burger.size as keyof typeof MENU.sizes].extras as Record<string, number>)["queijo"]
                    )}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Salada */}
          {burger.step === 4 && (
            <div>
              <h4 className="text-lg font-bold text-foreground mb-2">Escolha sua salada</h4>
              <p className="text-sm text-muted-foreground mb-4">Selecione quantos itens quiser</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setBurger((b) => ({ ...b, salads: [...MENU.salads] }))}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-center relative",
                    burger.salads.length === MENU.salads.length ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  {burger.salads.length === MENU.salads.length && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                  <CheckCheck className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="font-semibold text-sm text-foreground">
                    Completa
                  </p>
                </button>
                <button
                  onClick={() => setBurger((b) => ({ ...b, salads: [] }))}
                  className={cn(
                    "p-3 rounded-xl border-2 transition-all text-center relative",
                    burger.salads.length === 0 ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  {burger.salads.length === 0 && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                  <X className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold text-sm text-foreground">
                    Sem Salada
                  </p>
                </button>
                {MENU.salads.map((item) => {
                  const isSelected = burger.salads.includes(item)
                  return (
                    <button
                      key={item}
                      onClick={() =>
                        setBurger((b) => ({
                          ...b,
                          salads: isSelected ? b.salads.filter((s) => s !== item) : [...b.salads, item],
                        }))
                      }
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all text-center relative",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                      <Salad className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="font-semibold text-sm text-foreground">{item}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 5: Molhos */}
          {burger.step === 5 && (
            <div>
              <h4 className="text-lg font-bold text-foreground mb-2">Escolha seus molhos</h4>
              <p className="text-sm text-muted-foreground mb-4">Selecione quantos quiser</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setBurger((b) => ({ ...b, sauces: [] }))}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-center relative",
                    burger.sauces.length === 0 ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  )}
                >
                  {burger.sauces.length === 0 && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                  <X className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <h5 className="font-bold text-sm text-foreground">
                    Sem Molho
                  </h5>
                </button>
                {MENU.sauces.map((sauce) => {
                  const isSelected = burger.sauces.includes(sauce.name)
                  return (
                    <button
                      key={sauce.key}
                      onClick={() =>
                        setBurger((b) => ({
                          ...b,
                          sauces: isSelected
                            ? b.sauces.filter((s) => s !== sauce.name)
                            : [...b.sauces, sauce.name],
                        }))
                      }
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-center relative",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                      <Droplets className="h-8 w-8 mx-auto mb-2 text-destructive" />
                      <h5 className="font-bold text-sm text-foreground">{sauce.name}</h5>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 6: Complementos */}
          {burger.step === 6 && (
            <div>
              <h4 className="text-lg font-bold text-foreground mb-2">Complementos</h4>
              <p className="text-sm text-muted-foreground mb-4">Adicione extras ao seu lanche</p>

              {burger.size && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {Object.entries(MENU.extras).map(([key, extra]) => {
                    const sizeData = MENU.sizes[burger.size as keyof typeof MENU.sizes]
                    const price = (sizeData.extras as Record<string, number>)[key]
                    const qty = burger.extras[key] || 0
                    return (
                      <div key={key} className="bg-card p-4 rounded-xl border-2 border-border text-center">
                        <div className="w-8 h-8 mx-auto mb-2 bg-accent/20 rounded-full flex items-center justify-center">
                          <Beef className="h-4 w-4 text-accent-foreground" />
                        </div>
                        <h5 className="font-bold text-sm text-foreground">{extra.name}</h5>
                        <p className="text-primary font-bold mb-2">+{formatCurrency(price)}</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              setBurger((b) => {
                                const newExtras = { ...b.extras }
                                if (qty > 1) newExtras[key] = qty - 1
                                else delete newExtras[key]
                                return { ...b, extras: newExtras }
                              })
                            }
                            className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-foreground">{qty}</span>
                          <button
                            onClick={() =>
                              setBurger((b) => ({
                                ...b,
                                extras: { ...b.extras, [key]: (b.extras[key] || 0) + 1 },
                              }))
                            }
                            className="w-9 h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mb-6">
                <h5 className="font-bold text-foreground mb-2">Nome do Cliente</h5>
                <Input
                  placeholder="Ex: João, Maria..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="bg-card border-2 border-border focus-visible:ring-primary"
                />
              </div>

              {/* Resumo */}
              <div className="p-4 bg-muted rounded-xl">
                <h5 className="font-bold text-foreground mb-2">Resumo do seu lanche:</h5>
                <div className="text-sm text-muted-foreground space-y-1">
                  {customName && (
                    <p className="font-bold text-primary">
                      <ChevronRight className="h-3 w-3 inline" /> Cliente: {customName}
                    </p>
                  )}
                  {burger.size && (
                    <p>
                      <ChevronRight className="h-3 w-3 inline" /> Tamanho: {burger.size}
                    </p>
                  )}
                  {burger.meat && (
                    <p>
                      <ChevronRight className="h-3 w-3 inline" /> Carne: {burger.meat}
                    </p>
                  )}
                  {burger.cheeses.length > 0 && (
                    <p>
                      <ChevronRight className="h-3 w-3 inline" /> Queijo: {burger.cheeses.join(", ")}
                    </p>
                  )}
                  {burger.salads.length > 0 && (
                    <p>
                      <ChevronRight className="h-3 w-3 inline" /> Salada: {burger.salads.join(", ")}
                    </p>
                  )}
                  {burger.sauces.length > 0 && (
                    <p>
                      <ChevronRight className="h-3 w-3 inline" /> Molhos: {burger.sauces.join(", ")}
                    </p>
                  )}
                  {Object.entries(burger.extras)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => (
                      <p key={k}>
                        <ChevronRight className="h-3 w-3 inline" /> {v}x {MENU.extras[k].name}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex justify-between items-center">
          <Button variant="outline" onClick={prevStep} disabled={burger.step === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetAndClose} className="text-destructive border-destructive/30">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            {burger.step === 6 ? (
              <Button
                onClick={addToCart}
                disabled={!burger.size}
                className="bg-primary text-primary-foreground"
              >
                <Check className="h-4 w-4 mr-2" />
                Adicionar ao Pedido
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canProceed()} className="bg-primary text-primary-foreground">
                Proximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
