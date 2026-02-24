"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  const [discount, setDiscount] = useState<{ type: "fixed" | "percent" | null; value: number }>({
    type: null,
    value: 0,
  })
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
    if (!isNaN(val) && val > 0) {
      setDiscount({ type: tempDiscountType, value: val })
    }
    setDiscountInputOpen(false)
  }

  const clearDiscount = () => setDiscount({ type: null, value: 0 })

  return (
    <div className="w-full lg:w-96 bg-card shadow-xl lg:border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-muted/50 to-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Pedido
          </h2>
          <Badge variant="default" className="bg-primary text-primary-foreground">
            {totalItems} {totalItems === 1 ? "item" : "itens"}
          </Badge>
        </div>

        {/* Order Type */}
        {editingTable ? (
          <div className="p-3 bg-muted rounded-lg text-center mb-3 border border-dashed border-primary">
            <p className="font-bold text-lg text-foreground">Mesa {editingTable}</p>
            <p className="text-xs text-muted-foreground">Modo de Edição</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              variant={orderType === "pickup" ? "default" : "outline"}
              size="sm"
              onClick={() => onSetOrderType("pickup")}
              className={cn(
                orderType === "pickup" && "bg-primary text-primary-foreground"
              )}
            >
              <Store className="h-4 w-4 mr-1" />
              Retirada
            </Button>
            <Button
              variant={orderType === "delivery" ? "default" : "outline"}
              size="sm"
              onClick={() => onSetOrderType("delivery")}
              className={cn(
                orderType === "delivery" && "bg-chart-3 text-card"
              )}
            >
              <Bike className="h-4 w-4 mr-1" />
              Entrega
            </Button>
          </div>
        )}

        {/* Delivery fee */}
        {orderType === "delivery" && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">Taxa:</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                type="number"
                value={deliveryFee.toFixed(2)}
                step="0.50"
                onChange={(e) => onDeliveryFeeChange(parseFloat(e.target.value) || 0)}
                className="pl-8 font-mono text-sm h-9"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="relative">
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
              placeholder="Nome do cliente (digite para buscar)"
              className="h-9 text-sm"
            />
            {showCustomerSearch && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-auto">
                {customers
                  .filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch))
                  .slice(0, 5)
                  .map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                      onClick={() => {
                        onCustomerNameChange(c.name)
                        onCustomerPhoneChange(c.phone)
                        if (c.address) onDeliveryAddressChange(c.address)
                        setShowCustomerSearch(false)
                      }}
                    >
                      <span className="font-semibold text-foreground">{c.name}</span>
                      {c.phone && <span className="text-xs text-muted-foreground ml-2">{c.phone}</span>}
                    </button>
                  ))}
                {customers.filter((c) => c.name.toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum cliente encontrado</p>
                )}
              </div>
            )}
          </div>
          <Input
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            placeholder="WhatsApp"
            className="h-9 text-sm"
          />
          <Textarea
            value={orderObservation}
            onChange={(e) => onOrderObservationChange(e.target.value)}
            placeholder="Observação do pedido (ex: sem cebola, talher, etc)"
            rows={2}
            className="text-sm resize-none"
          />
          {orderType === "delivery" && (
            <Textarea
              value={deliveryAddress}
              onChange={(e) => onDeliveryAddressChange(e.target.value)}
              placeholder="Endereco de entrega (rua, numero, bairro, referencia)"
              rows={2}
              className="text-sm resize-none"
            />
          )}
        </div>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1 bg-muted/30">
        <div className="p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <ShoppingBasket className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Carrinho vazio</p>
              <p className="text-xs opacity-60 mt-1">Clique nos produtos para adicionar</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className={cn(
                  "bg-card rounded-lg p-3 shadow-sm border border-border",
                  item.isCustom && "border-accent/50 bg-accent/5"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <h4 className={cn("font-bold text-sm text-foreground flex items-center gap-1")}>
                      {item.isCustom && <Sandwich className="h-3.5 w-3.5 text-accent-foreground" />}
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} un.</p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="text-destructive/60 hover:text-destructive transition-colors p-2 -mr-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                {item.observation && (
                  <div className="text-xs text-muted-foreground mb-2 p-2 bg-muted rounded border border-border max-h-20 overflow-y-auto whitespace-pre-line">
                    {item.observation}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-muted rounded-lg border border-border">
                    <button
                      onClick={() => onChangeQuantity(index, -1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-card rounded-l-lg transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => onChangeQuantity(index, 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-card rounded-r-lg transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="font-bold text-primary">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-4 bg-card shadow-lg">
        {discountInputOpen ? (
          <div className="flex gap-2 mb-3 items-center">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                {tempDiscountType === "fixed" ? "R$" : "%"}
              </span>
              <Input
                autoFocus
                type="number"
                className="h-8 text-xs pl-8"
                value={tempDiscountValue}
                onChange={(e) => setTempDiscountValue(e.target.value)}
                placeholder={tempDiscountType === "fixed" ? "Valor" : "Porcentagem"}
                onKeyDown={(e) => e.key === "Enter" && confirmDiscount()}
              />
            </div>
            <Button size="sm" className="h-8 w-8 p-0 bg-primary hover:bg-primary/90" onClick={confirmDiscount}>
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setDiscountInputOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 mb-3">
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openDiscountInput("fixed")}>
              <Tag className="h-3 w-3 mr-1" /> R$ Desc
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openDiscountInput("percent")}>
              <Percent className="h-3 w-3 mr-1" /> % Desc
            </Button>
            <Button variant="outline" size="sm" className="px-3 text-destructive" onClick={clearDiscount}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {discount.type && (
          <div className="flex justify-between text-sm text-primary font-semibold mb-2 p-2 bg-primary/10 rounded-lg">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Desconto:
            </span>
            <span>
              {discount.type === "fixed" ? `-${formatCurrency(discount.value)}` : `-${discount.value}%`}
            </span>
          </div>
        )}

        <div className="space-y-1 border-t border-border pt-3 mb-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal:</span>
            <span className="font-mono">{formatCurrency(subtotal)}</span>
          </div>
          {orderType === "delivery" && (
            <div className="flex justify-between text-sm text-chart-3">
              <span>Taxa de entrega:</span>
              <span className="font-mono">{formatCurrency(totalDeliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-black text-foreground items-center">
            <span>TOTAL:</span>
            <span className="text-primary font-mono">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {editingTable && onUpdateTable && (
            <Button onClick={onUpdateTable} className="flex-1" variant="secondary">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          )}
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onPrintOrder}
            disabled={cart.length === 0}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button
            className="flex-[2] bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onOpenCheckout}
            disabled={cart.length === 0}
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {editingTable ? "FECHAR CONTA" : "FINALIZAR"}
          </Button>
        </div>
      </div>
    </div>
  )
}
