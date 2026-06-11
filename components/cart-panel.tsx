"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ShoppingCart,
  Store,
  Bike,
  Trash2,
  Minus,
  Plus,
  Tag,
  Percent,
  X,
  Printer,
  CheckCircle2,
  Sandwich,
  ShoppingBasket,
  Save,
  User,
  Phone,
  MapPin,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency, type CartItem, type OrderType, type Customer } from "@/lib/store"

interface CartPanelProps {
  cart: CartItem[]
  orderType: OrderType
  onSetOrderType: (type: OrderType) => void
  onChangeQuantity: (index: number, delta: number) => void
  onRemoveItem: (index: number) => void
  onOpenCheckout: () => void
  onPrintOrder: () => void
  customerName: string
  customerPhone: string
  deliveryAddress: string
  deliveryFee: number
  onCustomerNameChange: (v: string) => void
  onCustomerPhoneChange: (v: string) => void
  onDeliveryAddressChange: (v: string) => void
  onOrderObservationChange: (v: string) => void
  onDeliveryFeeChange: (v: number) => void
  orderObservation: string
  customers?: Customer[]
  editingTable?: string | null
  onUpdateTable?: () => void
}

export function CartPanel({
  cart,
  orderType,
  onSetOrderType,
  onChangeQuantity,
  onRemoveItem,
  onOpenCheckout,
  onPrintOrder,
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryFee,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onDeliveryAddressChange,
  onOrderObservationChange,
  onDeliveryFeeChange,
  orderObservation,
  customers = [],
  editingTable = null,
  onUpdateTable,
}: CartPanelProps) {
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [customerSearch, setCustomerSearch] = useState("")
  const [discount, setDiscount] = useState<{ type: "fixed" | "percent" | null; value: number }>({ type: null, value: 0 })
  const [discountInputOpen, setDiscountInputOpen] = useState(false)
  const [tempDiscountType, setTempDiscountType] = useState<"fixed" | "percent">("fixed")
  const [tempDiscountValue, setTempDiscountValue] = useState("")

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  let discountedSubtotal = subtotal
  if (discount.type === "fixed") discountedSubtotal = Math.max(0, subtotal - discount.value)
  else if (discount.type === "percent") discountedSubtotal = subtotal * (1 - discount.value / 100)

  const totalDeliveryFee = orderType === "delivery" ? deliveryFee : 0
  const total = discountedSubtotal + totalDeliveryFee

  const openDiscountInput = (type: "fixed" | "percent") => {
    setTempDiscountType(type)
    setTempDiscountValue("")
    setDiscountInputOpen(true)
  }

  const confirmDiscount = () => {
    const val = parseFloat(tempDiscountValue)
    if (!isNaN(val) && val > 0) setDiscount({ type: tempDiscountType, value: val })
    setDiscountInputOpen(false)
  }

  const clearDiscount = () => setDiscount({ type: null, value: 0 })

  return (
    <div className="w-full lg:w-96 bg-card lg:border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          {editingTable ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-black text-primary">{editingTable}</span>
              </div>
              <div>
                <p className="font-black text-sm text-foreground leading-none">Mesa {editingTable}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Modo de edição</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h2 className="font-black text-base text-foreground">Pedido</h2>
            </div>
          )}
          {totalItems > 0 && (
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
              {totalItems} {totalItems === 1 ? "item" : "itens"}
            </span>
          )}
        </div>

        {/* Order Type (only when not editing a table) */}
        {!editingTable && (
          <div className="flex p-0.5 bg-muted rounded-xl mb-3">
            <button
              onClick={() => onSetOrderType("pickup")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all",
                orderType === "pickup"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Store className="h-4 w-4 shrink-0" />
              Retirada
            </button>
            <button
              onClick={() => onSetOrderType("delivery")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all",
                orderType === "delivery"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Bike className="h-4 w-4 shrink-0" />
              Entrega
            </button>
          </div>
        )}

        {/* Delivery fee */}
        {orderType === "delivery" && (
          <div className="flex items-center gap-2 mb-3 p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
            <Bike className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="text-sm font-semibold text-blue-700 whitespace-nowrap flex-1">Taxa de entrega</span>
            <div className="relative w-24">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400 text-xs font-bold">R$</span>
              <Input
                type="number"
                value={deliveryFee.toFixed(2)}
                step="0.50"
                onChange={(e) => onDeliveryFeeChange(parseFloat(e.target.value) || 0)}
                className="pl-7 pr-2 h-8 text-sm font-bold text-blue-700 bg-white border-blue-200 text-right"
              />
            </div>
          </div>
        )}

        {/* Customer fields */}
        <div className="space-y-2">
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={customerName}
              onChange={(e) => {
                onCustomerNameChange(e.target.value)
                setCustomerSearch(e.target.value)
                setShowCustomerSearch(e.target.value.length > 0 && customers.length > 0)
              }}
              onFocus={() => {
                if (customerName.length > 0 && customers.length > 0) setShowCustomerSearch(true)
              }}
              placeholder="Nome do cliente"
              className="h-9 text-sm pl-8"
            />
            {showCustomerSearch && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl max-h-44 overflow-auto">
                {customers
                  .filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
                  .slice(0, 5)
                  .map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors text-sm border-b border-border last:border-0"
                      onClick={() => {
                        onCustomerNameChange(c.name)
                        onCustomerPhoneChange(c.phone)
                        if (c.address) onDeliveryAddressChange(c.address)
                        setShowCustomerSearch(false)
                      }}
                    >
                      <p className="font-bold text-foreground">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </button>
                  ))}
                {customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                  <p className="px-3 py-2.5 text-xs text-muted-foreground">Nenhum cliente encontrado</p>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={customerPhone}
              onChange={(e) => onCustomerPhoneChange(e.target.value)}
              placeholder="WhatsApp"
              className="h-9 text-sm pl-8"
            />
          </div>

          {orderType === "delivery" && (
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Textarea
                value={deliveryAddress}
                onChange={(e) => onDeliveryAddressChange(e.target.value)}
                placeholder="Endereço de entrega"
                rows={2}
                className="text-sm resize-none pl-8"
              />
            </div>
          )}

          <div className="relative">
            <MessageSquare className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Textarea
              value={orderObservation}
              onChange={(e) => onOrderObservationChange(e.target.value)}
              placeholder="Observação (ex: sem cebola)"
              rows={2}
              className="text-sm resize-none pl-8"
            />
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1 bg-muted/20">
        <div className="p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <ShoppingBasket className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">Carrinho vazio</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Clique nos produtos para adicionar</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className={cn(
                  "bg-card rounded-xl p-3 shadow-sm border",
                  item.isCustom ? "border-amber-200 bg-amber-50/50" : "border-border"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1 leading-tight">
                      {item.isCustom && <Sandwich className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      <span className="truncate">{item.name}</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(item.price)} / un</p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors p-1.5 -mr-1 -mt-1 rounded-lg hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {item.observation && (
                  <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted rounded-lg border border-border max-h-16 overflow-y-auto whitespace-pre-line leading-relaxed">
                    {item.observation}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-muted rounded-lg overflow-hidden border border-border">
                    <button
                      onClick={() => onChangeQuantity(index, -1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center font-black text-sm text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => onChangeQuantity(index, 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-card transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="font-black text-primary text-sm">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-4 bg-card">
        {/* Discount section */}
        {discountInputOpen ? (
          <div className="flex gap-2 mb-3 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                {tempDiscountType === "fixed" ? "R$" : "%"}
              </span>
              <Input
                autoFocus
                type="number"
                className="h-9 text-sm pl-8"
                value={tempDiscountValue}
                onChange={(e) => setTempDiscountValue(e.target.value)}
                placeholder={tempDiscountType === "fixed" ? "Valor do desconto" : "% de desconto"}
                onKeyDown={(e) => e.key === "Enter" && confirmDiscount()}
              />
            </div>
            <Button size="sm" className="h-9 w-9 p-0 bg-primary" onClick={confirmDiscount}>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={() => setDiscountInputOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-1.5 mb-3">
            <button
              onClick={() => openDiscountInput("fixed")}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
            >
              <Tag className="h-3 w-3" /> R$ Desc
            </button>
            <button
              onClick={() => openDiscountInput("percent")}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
            >
              <Percent className="h-3 w-3" /> % Desc
            </button>
            {discount.type && (
              <button
                onClick={clearDiscount}
                className="px-2.5 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {discount.type && (
          <div className="flex justify-between text-xs font-bold mb-2 px-3 py-2 bg-primary/10 text-primary rounded-lg">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Desconto aplicado
            </span>
            <span>
              {discount.type === "fixed" ? `-${formatCurrency(discount.value)}` : `-${discount.value}%`}
            </span>
          </div>
        )}

        {/* Totals */}
        <div className="space-y-1 pt-2 border-t border-border mb-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          {orderType === "delivery" && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>Taxa de entrega</span>
              <span className="font-mono font-semibold">{formatCurrency(totalDeliveryFee)}</span>
            </div>
          )}
          {discount.type && (
            <div className="flex justify-between text-sm text-primary">
              <span>Desconto</span>
              <span className="font-mono font-semibold">
                -{formatCurrency(subtotal - discountedSubtotal)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1">
            <span className="text-base font-black text-foreground">TOTAL</span>
            <span className="text-2xl font-black text-primary font-mono">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {editingTable && onUpdateTable && (
            <Button onClick={onUpdateTable} variant="outline" size="sm" className="h-11 px-3">
              <Save className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-11 px-3"
            onClick={onPrintOrder}
            disabled={cart.length === 0}
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            className="flex-1 h-11 font-black text-sm shadow-md"
            style={{
              background: cart.length === 0
                ? undefined
                : "linear-gradient(135deg, hsl(158,72%,36%), hsl(158,72%,28%))",
            }}
            onClick={onOpenCheckout}
            disabled={cart.length === 0}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {editingTable ? "Fechar Conta" : "Finalizar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
