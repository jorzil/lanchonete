'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, MapPin, Save, RotateCcw } from 'lucide-react'
import { saveDeliveryConfig, pullDeliveryConfig, pushDeliveryConfig, routeFactorOf, unknownFee, feeForDistance, resolveDeliveryFee, normalizeNeighborhood, type DeliveryConfig, type DeliveryZone, type FeeDecision } from '@/lib/delivery-zones'
import { formatCurrency } from '@/lib/data'
import { toast } from 'sonner'

const DEFAULT_ZONES: DeliveryZone[] = [
  { label: 'Até 1km',    maxKm: 1,    fee: 5.0  },
  { label: 'Até 1,5km',  maxKm: 1.5,  fee: 5.99 },
  { label: 'Até 2km',    maxKm: 2,    fee: 6.99 },
  { label: 'Até 2,5km',  maxKm: 2.5,  fee: 7.99 },
  { label: 'Até 3km',    maxKm: 3,    fee: 8.99 },
  { label: 'Até 4km',    maxKm: 4,    fee: 9.99 },
  { label: 'Até 5km',    maxKm: 5,    fee: 11.99 },
  { label: 'Até 5,5km',  maxKm: 5.5,  fee: 12.99 },
  { label: 'Até 6km',    maxKm: 6,    fee: 13.99 },
  { label: 'Até 6,5km',  maxKm: 6.5,  fee: 14.99 },
  { label: 'Até 7km',    maxKm: 7,    fee: 15.99 },
  { label: 'Até 7,5km',  maxKm: 7.5,  fee: 16.99 },
  { label: 'Até 8km',    maxKm: 8,    fee: 17.99 },
  { label: 'Até 8,5km',  maxKm: 8.5,  fee: 18.99 },
  { label: 'Até 9km',    maxKm: 9,    fee: 19.99 },
  { label: 'Até 9,5km',  maxKm: 9.5,  fee: 20.99 },
  { label: 'Até 10km',   maxKm: 10,   fee: 21.99 },
  { label: 'Até 12,5km', maxKm: 12.5, fee: 22.99 },
  { label: 'Até 15km',   maxKm: 15,   fee: 24.99 },
]

const inputCls = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"

export default function EntregaPage() {
  const [config, setConfig] = useState<DeliveryConfig | null>(null)

  useEffect(() => { pullDeliveryConfig().then(setConfig) }, [])

  // ── Simulador de CEP ──────────────────────────────────────────────────────
  const [cepTeste, setCepTeste] = useState('')
  const [subtotalTeste, setSubtotalTeste] = useState(40)
  const [simulando, setSimulando] = useState(false)
  const [erroTeste, setErroTeste] = useState('')
  const [resultado, setResultado] = useState<{
    endereco: { logradouro: string; bairro: string; cidade: string; uf: string
      lat: number | null; lng: number | null; fonte: string; origemCoordenada: string | null
      coordenadas?: { fonte: string; lat: number; lng: number }[]
      divergencia?: { km: number; motivo: string }
      centroide?: { fontes: string[]; motivo: string } }
    decisao: FeeDecision
  } | null>(null)

  // Daqui para baixo não pode haver hook: o React exige que a quantidade e a
  // ordem deles sejam sempre as mesmas, e este return corta a renderização.
  if (!config) return null

  const setZones = (zones: DeliveryZone[]) => setConfig(c => c ? { ...c, zones } : c)
  const setBairros = (neighborhoodFees: { bairro: string; fee: number }[]) =>
    setConfig(c => c ? { ...c, neighborhoodFees } : c)

  /** Linha reta da loja até um ponto — usada só para exibir no simulador. */
  function distanciaAteLoja(lat: number, lng: number): number {
    if (!config) return 0
    const R = 6371
    const dLat = ((lat - config.storeLat) * Math.PI) / 180
    const dLng = ((lng - config.storeLng) * Math.PI) / 180
    const h = Math.sin(dLat / 2) ** 2
      + Math.cos((config.storeLat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.asin(Math.sqrt(h))
  }

  async function simular() {
    const limpo = cepTeste.replace(/\D/g, '')
    if (limpo.length !== 8) { setErroTeste('Digite os 8 dígitos do CEP.'); return }
    if (!config) return
    setSimulando(true); setErroTeste(''); setResultado(null)
    try {
      const refLoja = (config.storeCep ?? '').replace(/\D/g, '')
      const res = await fetch(
        `/api/cep?cep=${limpo}${refLoja.length === 8 && refLoja !== limpo ? `&ref=${refLoja}` : ''}`,
        { cache: 'no-store' },
      )
      if (!res.ok) {
        setErroTeste(res.status === 404
          ? 'Nenhum provedor encontrou este CEP.'
          : 'Não foi possível consultar agora. Tente de novo.')
        return
      }
      const endereco = await res.json()
      const decisao = resolveDeliveryFee({
        bairro: endereco.bairro, lat: endereco.lat, lng: endereco.lng,
        subtotal: subtotalTeste, cfg: config,
      })
      setResultado({ endereco, decisao })
    } catch {
      setErroTeste('Falha de conexão.')
    } finally {
      setSimulando(false)
    }
  }

  function addZone() {
    const last = config!.zones.at(-1)
    setZones([...config!.zones, { label: `Até ${(last?.maxKm ?? 0) + 3}km`, maxKm: (last?.maxKm ?? 0) + 3, fee: (last?.fee ?? 0) + 5 }])
  }

  function removeZone(i: number) {
    setZones(config!.zones.filter((_, idx) => idx !== i))
  }

  function updateZone(i: number, field: keyof DeliveryZone, value: string | number) {
    setZones(config!.zones.map((z, idx) => idx === i ? { ...z, [field]: value } : z))
  }

  async function handleSave() {
    const sorted = [...config!.zones].sort((a, b) => a.maxKm - b.maxKm)
    const next: DeliveryConfig = { ...config!, zones: sorted }
    saveDeliveryConfig(next)
    const ok = await pushDeliveryConfig(next)
    if (ok) toast.success('Configurações salvas — já valem no site!')
    else toast.error('Salvo localmente, mas falhou ao enviar ao servidor. Tente de novo.')
  }

  async function handleReset() {
    const reset: DeliveryConfig = { ...config!, zones: DEFAULT_ZONES }
    setConfig(reset)
    saveDeliveryConfig(reset)
    const ok = await pushDeliveryConfig(reset)
    toast.success(ok ? 'Zonas restauradas para o padrão.' : 'Restaurado localmente; falhou ao enviar ao servidor.')
  }

  const maxKm = Math.max(...config.zones.map(z => z.maxKm), 0)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Taxa de Entrega</h1>
          <p className="text-sm text-gray-500">Configure zonas de entrega por raio de distância</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all">
            <RotateCcw size={14} /> Restaurar padrão
          </button>
          <button onClick={handleSave} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-sm transition-all">
            <Save size={14} /> Salvar
          </button>
        </div>
      </div>

      {/* Store location */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2"><MapPin size={16} className="text-orange-500" /> Localização da Loja</h2>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-600">Endereço (referência visual)</label>
          <input
            type="text"
            value={config.storeAddress}
            onChange={e => setConfig(c => c ? { ...c, storeAddress: e.target.value } : c)}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={config.storeLat}
              onChange={e => setConfig(c => c ? { ...c, storeLat: parseFloat(e.target.value) } : c)}
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={config.storeLng}
              onChange={e => setConfig(c => c ? { ...c, storeLng: parseFloat(e.target.value) } : c)}
              className={inputCls}
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">Acesse <a href="https://www.google.com.br/maps" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline">Google Maps</a>, clique no endereço da loja e copie as coordenadas.</p>

        <div>
          <label className="text-sm font-semibold text-gray-600">CEP da loja</label>
          <input
            value={config.storeCep ?? ''}
            onChange={e => setConfig(c => c ? { ...c, storeCep: e.target.value } : c)}
            placeholder="00000-000"
            className={`${inputCls} mt-2 max-w-[200px]`}
          />
          <p className="mt-1 text-xs text-gray-400">
            Serve de gabarito: se um provedor devolve o <strong>mesmo ponto</strong> para o CEP do
            cliente e para este, ele está dando o centro da cidade, não a posição do CEP — e a
            coordenada é descartada. É o que impede um endereço distante de cair na faixa mais
            barata.
          </p>
        </div>
      </div>

      {/* Frete grátis */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-bold text-gray-800">Frete Grátis</h2>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Frete grátis para todos os pedidos</p>
            <p className="text-xs text-gray-500 mt-0.5">Ignora a tabela de zonas — nenhuma entrega é cobrada.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!!config.freeDelivery}
            onClick={() => setConfig(c => c ? { ...c, freeDelivery: !c.freeDelivery } : c)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${config.freeDelivery ? 'bg-orange-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.freeDelivery ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className={config.freeDelivery ? 'opacity-40 pointer-events-none' : ''}>
          <label className="text-sm font-semibold text-gray-600">Frete grátis a partir de (R$)</label>
          <input
            type="number"
            min={0}
            step={1}
            value={config.freeDeliveryMinOrder ?? 0}
            onChange={e => setConfig(c => c ? { ...c, freeDeliveryMinOrder: parseFloat(e.target.value) || 0 } : c)}
            className={`${inputCls} mt-2`}
            placeholder="0"
          />
          <p className="mt-1 text-xs text-gray-400">
            Pedidos com subtotal igual ou acima deste valor não pagam entrega. Use <strong>0</strong> para desativar.
          </p>
        </div>

        {(config.freeDelivery || (config.freeDeliveryMinOrder ?? 0) > 0) && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm font-medium text-emerald-700">
            🎉 {config.freeDelivery
              ? 'Todos os pedidos estão com frete grátis.'
              : `Frete grátis em pedidos a partir de ${formatCurrency(config.freeDeliveryMinOrder ?? 0)}.`}
          </div>
        )}
      </div>

      {/* Simulador — testar CEP por CEP antes de valer para o cliente */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="font-bold text-gray-800">Testar um CEP</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Digite um CEP e veja exatamente o que o cliente pagaria e por quê. Usa a
            configuração que está na tela, mesmo sem salvar.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={cepTeste}
            onChange={e => setCepTeste(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && simular()}
            placeholder="00000-000"
            className={`${inputCls} max-w-[180px]`}
          />
          <input
            type="number" min={0} step={1}
            value={subtotalTeste}
            onChange={e => setSubtotalTeste(parseFloat(e.target.value) || 0)}
            placeholder="Subtotal"
            className={`${inputCls} max-w-[140px]`}
          />
          <button
            onClick={simular}
            disabled={simulando}
            className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {simulando ? 'Consultando…' : 'Simular'}
          </button>
        </div>
        <p className="text-xs text-gray-400 -mt-2">
          O segundo campo é o valor do pedido, para conferir a regra de frete grátis.
        </p>

        {erroTeste && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erroTeste}
          </div>
        )}

        {resultado && (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {resultado.endereco.logradouro || '(CEP sem logradouro)'}
                {resultado.endereco.bairro && <span className="text-gray-500"> · {resultado.endereco.bairro}</span>}
              </span>
              <span className="text-2xl font-black text-gray-900">{formatCurrency(resultado.decisao.fee)}</span>
            </div>
            <dl className="divide-y divide-gray-100 text-sm">
              {[
                ['Cidade', `${resultado.endereco.cidade} / ${resultado.endereco.uf}`],
                ['Quem respondeu', resultado.endereco.fonte],
                ['Coordenada', resultado.endereco.lat
                  ? `${resultado.endereco.lat.toFixed(5)}, ${resultado.endereco.lng?.toFixed(5)} (${resultado.endereco.origemCoordenada === 'cep' ? 'do próprio CEP' : 'do nome da rua'})`
                  : '— nenhum provedor devolveu coordenada'],
                ['Distância', resultado.decisao.distanceKm !== null
                  ? `${resultado.decisao.distanceKm} km de percurso · ${resultado.decisao.straightKm} km em linha reta`
                  : '— não calculada'],
                ['Como foi decidido', resultado.decisao.explicacao],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-wrap gap-x-3 px-4 py-2">
                  <dt className="w-40 shrink-0 text-gray-400">{k}</dt>
                  <dd className="flex-1 text-gray-700">{v}</dd>
                </div>
              ))}
            </dl>
            {/* O que cada provedor respondeu — é aqui que se vê um deles
                devolvendo o centro da cidade em vez do CEP. */}
            {(resultado.endereco.coordenadas?.length ?? 0) > 0 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Resposta de cada provedor
                </p>
                <div className="mt-2 space-y-1">
                  {resultado.endereco.coordenadas!.map(c => {
                    const km = distanciaAteLoja(c.lat, c.lng)
                    return (
                      <div key={c.fonte} className="flex flex-wrap items-baseline gap-x-3 text-[12px]">
                        <span className="w-28 shrink-0 font-semibold text-gray-600">{c.fonte}</span>
                        <span className="font-mono text-gray-500">{c.lat.toFixed(5)}, {c.lng.toFixed(5)}</span>
                        <span className="text-gray-400">{km.toFixed(2)} km da loja em linha reta</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {resultado.endereco.centroide && (
              <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-800">
                <strong>Centro da cidade detectado.</strong> {resultado.endereco.centroide.motivo}.
                Cobrar por distância a partir desse ponto faria um endereço distante cair na faixa
                mais barata — por isso a coordenada foi descartada.
              </p>
            )}

            {resultado.endereco.divergencia && (
              <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-800">
                <strong>Provedores discordaram.</strong> {resultado.endereco.divergencia.motivo}.
                Quando isso acontece, um dos dois está devolvendo o centro da cidade em vez do CEP —
                cobrar por distância seria chute, então a taxa vem do bairro ou da estimativa.
              </p>
            )}

            {resultado.decisao.estimada && (
              <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                Nenhum provedor localizou este endereço. O cliente veria um aviso de que a taxa
                será confirmada. Cadastre o bairro abaixo para resolver de vez.
              </p>
            )}
            {resultado.endereco.bairro && (
              <div className="border-t border-gray-100 px-4 py-3">
                <button
                  onClick={() => {
                    const bairro = resultado.endereco.bairro
                    const atuais = config.neighborhoodFees ?? []
                    if (atuais.some(n => normalizeNeighborhood(n.bairro) === normalizeNeighborhood(bairro))) {
                      toast.info('Esse bairro já está na tabela.')
                      return
                    }
                    setConfig(c => c ? { ...c, neighborhoodFees: [...atuais, { bairro, fee: resultado.decisao.feeBruta }] } : c)
                    toast.success(`${bairro} adicionado. Ajuste o valor e salve.`)
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  + Fixar taxa para o bairro {resultado.endereco.bairro}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Taxa por bairro */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="font-bold text-gray-800">Taxa por bairro</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Tem prioridade sobre a distância. Entregando numa cidade só, o bairro é o dado
            mais confiável: vem do próprio CEP e não depende de mapa nenhum. Os bairros que
            não estiverem aqui continuam sendo cobrados por distância.
          </p>
        </div>

        {(config.neighborhoodFees ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
            Nenhum bairro cadastrado. Use o simulador acima para adicionar conforme testa.
          </p>
        )}

        <div className="space-y-2">
          {(config.neighborhoodFees ?? []).map((n, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                value={n.bairro}
                onChange={e => setBairros((config.neighborhoodFees ?? []).map((x, j) => j === i ? { ...x, bairro: e.target.value } : x))}
                className={`${inputCls} max-w-[260px]`}
                placeholder="Nome do bairro"
              />
              <span className="text-sm text-gray-400">R$</span>
              <input
                type="number" min={0} step={0.5}
                value={n.fee}
                onChange={e => setBairros((config.neighborhoodFees ?? []).map((x, j) => j === i ? { ...x, fee: parseFloat(e.target.value) || 0 } : x))}
                className={`${inputCls} max-w-[110px]`}
              />
              <button
                onClick={() => setBairros((config.neighborhoodFees ?? []).filter((_, j) => j !== i))}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-50 hover:text-red-600"
              >
                Remover
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setBairros([...(config.neighborhoodFees ?? []), { bairro: '', fee: 0 }])}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          + Adicionar bairro
        </button>
      </div>

      {/* Precisão da cobrança */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="font-bold text-gray-800">Precisão da cobrança</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Dois ajustes que decidem quanto os endereços mais distantes pagam.
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600">Fator de rota</label>
          <input
            type="number" min={1} max={3} step={0.05}
            value={routeFactorOf(config)}
            onChange={e => setConfig(c => c ? { ...c, routeFactor: parseFloat(e.target.value) || 1.35 } : c)}
            className={`${inputCls} mt-2`}
          />
          <p className="mt-1 text-xs text-gray-400">
            A distância é medida em linha reta, mas o entregador contorna quarteirão e mão
            única. Este número converte uma na outra — <strong>1,35</strong> quer dizer que o
            percurso real dá 35% a mais. O erro cresce com a distância, então é isto que
            corrige a cobrança curta nos bairros afastados.
          </p>
          <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            Exemplo: cliente a <strong>6 km</strong> em linha reta vira{' '}
            <strong>{(6 * routeFactorOf(config)).toFixed(1)} km</strong> de percurso →{' '}
            {(() => {
              const z = feeForDistance(6 * routeFactorOf(config), config.zones)
              const antes = feeForDistance(6, config.zones)
              return z
                ? <>cobra <strong>{formatCurrency(z.fee)}</strong>
                    {antes && antes.fee !== z.fee && <> em vez de {formatCurrency(antes.fee)}</>}</>
                : <>fora da área</>
            })()}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600">
            Taxa quando o endereço não é localizado (R$)
          </label>
          <input
            type="number" min={0} step={0.5}
            value={config.feeWhenUnknown ?? unknownFee(config)}
            onChange={e => setConfig(c => c ? { ...c, feeWhenUnknown: parseFloat(e.target.value) || 0 } : c)}
            className={`${inputCls} mt-2`}
          />
          <p className="mt-1 text-xs text-gray-400">
            Nem todo endereço existe no mapa — justamente os de bairro novo ou afastado. Antes
            esses caíam na faixa mais barata da tabela. O cliente vê um aviso de que o valor
            será confirmado pela loja.
          </p>
        </div>
      </div>

      {/* Zones */}
      <div className={`bg-white rounded-2xl border border-gray-200 p-5 space-y-4 ${config.freeDelivery ? 'opacity-50' : ''}`}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Zonas de Entrega</h2>
          <button onClick={addZone} className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
            <Plus size={15} /> Adicionar zona
          </button>
        </div>

        <div className="space-y-3">
          {config.zones.sort((a,b) => a.maxKm - b.maxKm).map((zone, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
              {/* Color band */}
              <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: `hsl(${30 + i * 25}, 80%, 55%)` }} />
              <div className="grid grid-cols-3 gap-2 flex-1">
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1">Label</p>
                  <input
                    type="text"
                    value={zone.label}
                    onChange={e => updateZone(i, 'label', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-800 outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1">Raio máx. (km)</p>
                  <input
                    type="number"
                    min={1}
                    step={0.5}
                    value={zone.maxKm}
                    onChange={e => updateZone(i, 'maxKm', parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-800 outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium mb-1">Taxa (R$)</p>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={zone.fee}
                    onChange={e => updateZone(i, 'fee', parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-800 outline-none focus:border-orange-400"
                  />
                </div>
              </div>
              <button onClick={() => removeZone(i)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {config.zones.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-4">Nenhuma zona configurada. Adicione pelo menos uma.</p>
        )}

        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700">Fora da área de entrega</p>
            <p className="text-xs text-red-400">Clientes além de {maxKm}km não poderão solicitar entrega</p>
          </div>
          <span className="text-sm font-black text-red-600">&gt; {maxKm}km</span>
        </div>
      </div>

      {/* Preview table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-800 mb-4">Resumo das Taxas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Zona</th>
                <th className="text-center py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Distância</th>
                <th className="text-right py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {[...config.zones].sort((a,b) => a.maxKm - b.maxKm).map((z, i, arr) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2.5 font-semibold text-gray-700">{z.label}</td>
                  <td className="py-2.5 text-center text-gray-500">{i === 0 ? `0 – ${z.maxKm}km` : `${arr[i-1].maxKm} – ${z.maxKm}km`}</td>
                  <td className="py-2.5 text-right font-black text-orange-600">{formatCurrency(z.fee)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2.5 font-semibold text-red-500">Fora da área</td>
                <td className="py-2.5 text-center text-red-400">&gt; {maxKm}km</td>
                <td className="py-2.5 text-right text-red-500 font-bold">Não entrega</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
