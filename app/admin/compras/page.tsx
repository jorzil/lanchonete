"use client"

import { Truck } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function ComprasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
        <p className="text-sm text-gray-500">Pedidos a fornecedores, recebimento e controle de notas</p>
      </div>
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EE5C13]/10">
          <Truck className="h-7 w-7 text-[#EE5C13]" />
        </div>
        <p className="text-base font-semibold text-gray-700">Módulo de Compras</p>
        <p className="mt-1 max-w-sm text-sm text-gray-400">
          Recebimento de mercadorias com entrada automática no estoque e
          recálculo de custo médio. Em desenvolvimento — próxima entrega.
        </p>
      </Card>
    </div>
  )
}
