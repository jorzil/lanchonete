import * as React from "react"

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface OrderReceiptProps {
  tableNumber: string | number
  items: OrderItem[]
  total: number
  customerName?: string
  observation?: string
}

export const OrderReceipt = React.forwardRef<HTMLDivElement, OrderReceiptProps>(
  ({ tableNumber, items, total, customerName, observation }, ref) => {
    return (
      <div ref={ref} className="w-[80mm] bg-white p-4 text-xs text-black font-mono">
        <div className="mb-4 text-center">
          <h1 className="text-sm font-bold uppercase">Lanchonete</h1>
          <p className="text-[10px]">Comprovante de Pedido</p>
        </div>

        <div className="mb-4 border-b border-dashed border-black pb-2">
          <div className="flex justify-between">
            <span>Mesa: {tableNumber}</span>
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {customerName && <div>Cliente: {customerName}</div>}
          {observation && <div>Obs: {observation}</div>}
        </div>

        <div className="mb-4 space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black pt-2">
          <div className="flex justify-between text-sm font-bold">
            <span>TOTAL</span>
            <span>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(total)}
            </span>
          </div>
        </div>
        
        <div className="mt-4 text-center text-[10px]">
          <p>Obrigado pela preferência!</p>
        </div>
      </div>
    )
  }
)
OrderReceipt.displayName = "OrderReceipt"