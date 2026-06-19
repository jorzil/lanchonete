"use client"

import { Wallet } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function FinanceiroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500">Receitas, despesas, fluxo de caixa e DRE</p>
      </div>
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EE5C13]/10">
          <Wallet className="h-7 w-7 text-[#EE5C13]" />
        </div>
        <p className="text-base font-semibold text-gray-700">Módulo Financeiro</p>
        <p className="mt-1 max-w-sm text-sm text-gray-400">
          Lançamento de receitas e despesas, fluxo de caixa e Demonstração de
          Resultado (DRE). Em desenvolvimento — próxima entrega.
        </p>
      </Card>
    </div>
  )
}
