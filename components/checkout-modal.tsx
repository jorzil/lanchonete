"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Banknote,
  QrCode,
  CreditCard,
  Wallet,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, type PaymentMethod } from "@/lib/store"

const paymentMethods: { key: PaymentMethod; label: string; icon: typeof Banknote; colorClass: string }[] = [
  { key: "money", label: "Dinheiro", icon: Banknote, colorClass: "text-primary" },
  { key: "pix", label: "Pix", icon: QrCode, colorClass: "text-chart-3" },
  { key: "debit", label: "Debito", icon: CreditCard, colorClass: "text-chart-5" },
  { key: "credit", label: "Credito", icon: Wallet, colorClass: "text-accent-foreground" },
]

interface CheckoutModalProps {
  open: boolean
  onClose: () => void
  total: number
  onFinalize: (method: PaymentMethod, changeAmount?: number) => void
}

export function CheckoutModal({ open, onClose, total, onFinalize }: CheckoutModalProps) {
  const [selected, setSelected] = useState<PaymentMethod | null>(null)
  const [cashReceived, setCashReceived] = useState("")

  const change =
    selected === "money" && cashReceived ? Math.max(0, parseFloat(cashReceived) - total) : 0

  const handleFinalize = () => {
    if (!selected) return
    onFinalize(selected, selected === "money" ? change : undefined)
    setSelected(null)
    setCashReceived("")
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-xl font-bold text-foreground">Finalizar Venda</DialogTitle>
          <p className="text-3xl font-black text-primary">{formatCurrency(total)}</p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 py-3 sm:py-4">
          {paymentMethods.map((pm) => {
            const Icon = pm.icon
            const isSelected = selected === pm.key
            return (
              <button
                key={pm.key}
                onClick={() => {
                  setSelected(pm.key)
                  setCashReceived("")
                }}
                className={cn(
                  "p-3 sm:p-4 border-2 rounded-xl text-center transition-all",
                  isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50"
                )}
              >
                <Icon className={cn("h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2", pm.colorClass)} />
                <p className="font-bold text-foreground text-sm sm:text-base">{pm.label}</p>
              </button>
            )
          })}
        </div>

        {/* Cash change calculator */}
        {selected === "money" && (
          <div className="space-y-3 p-4 bg-muted rounded-xl">
            <Label className="text-sm font-semibold text-foreground">Valor recebido:</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0,00"
                className="pl-8 font-mono text-lg"
                autoFocus
              />
            </div>
            {cashReceived && parseFloat(cashReceived) >= total && (
              <div className="flex justify-between text-lg font-bold text-primary p-2 bg-primary/10 rounded-lg">
                <span>Troco:</span>
                <span>{formatCurrency(change)}</span>
              </div>
            )}
            {cashReceived && parseFloat(cashReceived) < total && (
              <p className="text-destructive text-sm font-semibold">Valor insuficiente</p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground"
            onClick={handleFinalize}
            disabled={
              !selected || (selected === "money" && !!cashReceived && parseFloat(cashReceived) < total)
            }
          >
            <Check className="h-4 w-4 mr-2" />
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
