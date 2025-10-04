import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import NumericInput from './NumericInput'

interface PriceCalculatorProps {
  user: any
}

interface Service {
  id: string
  name: string
  price: number
  duration_minutes: number
  category_name: string
}

interface ServiceArea {
  id: string
  name: string
  travel_fee: number
}

interface RegionalPrice {
  service_id: string
  service_area_id: string
  price: number
}

export function PriceCalculator({ user }: PriceCalculatorProps) {
  const [services, setServices] = useState<Service[]>([])
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [regionalPrices, setRegionalPrices] = useState<RegionalPrice[]>([])
  
  const [selectedService, setSelectedService] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [calculatedPrice, setCalculatedPrice] = useState(0)
  const [totalWithTravel, setTotalWithTravel] = useState(0)
  
  // Novas opções
  const [includeTravelFee, setIncludeTravelFee] = useState(false)
  const [includeCancellationFee, setIncludeCancellationFee] = useState(false)
  const [cancellationFeePercent, setCancellationFeePercent] = useState(20)
  const [cancellationPercentValid, setCancellationPercentValid] = useState<boolean>(true)
  
  // Dados do cliente
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Carregar serviços com categoria
      const { data: servicesData } = await supabase
        .from('services')
        .select(`
          id,
          name,
          price,
          duration_minutes,
          service_categories!inner(name)
        `)
        .eq('user_id', user.id)

      if (servicesData) {
        const formattedServices = servicesData.map((service: any) => ({
          ...service,
          category_name: service.service_categories?.name || 'Sem categoria'
        }))
        setServices(formattedServices)
      }

      // Carregar regiões
      const { data: areasData } = await supabase
        .from('service_areas')
        .select('*')
        .eq('user_id', user.id)

      if (areasData) {
        setAreas(areasData)
      }

      // Carregar preços regionais
      const { data: regionalPricesData } = await supabase
        .from('service_regional_prices')
        .select('service_id, service_area_id, price')
        .eq('user_id', user.id)

      if (regionalPricesData) {
        setRegionalPrices(regionalPricesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  useEffect(() => {
    calculatePrice()
  }, [selectedService, selectedArea, services, areas, regionalPrices, includeTravelFee, includeCancellationFee, cancellationFeePercent])

  const calculatePrice = () => {
    if (!selectedService || !selectedArea) {
      setCalculatedPrice(0)
      setTotalWithTravel(0)
      return
    }

    // Buscar o serviço selecionado
    const service = services.find(s => s.id === selectedService)
    const area = areas.find(a => a.id === selectedArea)
    if (!service || !area) return

    // Buscar preço regional específico
    const regionalPrice = regionalPrices.find(
      rp => rp.service_id === selectedService && rp.service_area_id === selectedArea
    )

    // REGRA DE NEGÓCIO: Usar preço regional se existir, senão usar preço padrão
    let basePrice = regionalPrice ? regionalPrice.price : service.price
    setCalculatedPrice(basePrice)

    // Calcular preço final com taxas opcionais
    let finalPrice = basePrice

    // Taxa de deslocamento (opcional - não adicionar se já tem preço regional)
    let travelFee = 0
    if (includeTravelFee && !regionalPrice) {
      travelFee = area.travel_fee
      finalPrice += travelFee
    }

    // Taxa de cancelamento (opcional)
    let cancellationFee = 0
    if (includeCancellationFee) {
      cancellationFee = (finalPrice * cancellationFeePercent) / 100
      finalPrice += cancellationFee
    }

    setTotalWithTravel(finalPrice)
  }

  const sendWhatsAppBudget = () => {
    if (!selectedService || !selectedArea || !clientName || !clientPhone) {
      alert('Por favor, preencha todos os campos obrigatórios!')
      return
    }

    const service = services.find(s => s.id === selectedService)
    const area = areas.find(a => a.id === selectedArea)
    const regionalPrice = regionalPrices.find(
      rp => rp.service_id === selectedService && rp.service_area_id === selectedArea
    )

    // Construir mensagem
    let message = `🌟 *ORÇAMENTO PERSONALIZADO* 🌟\n\n`
    message += `👤 *Cliente:* ${clientName}\n`
    message += `📱 *Telefone:* ${clientPhone}\n\n`
    message += `💄 *Serviço:* ${service?.name}\n`
    message += `📍 *Local:* ${area?.name}\n\n`
    
    // Detalhes do preço
    message += `💰 *DETALHES DO ORÇAMENTO:*\n`
    
    if (regionalPrice) {
      message += `• Preço regional: R$ ${regionalPrice.price.toFixed(2)}\n`
      message += `• (Inclui deslocamento para ${area?.name})\n`
    } else {
      message += `• Preço do serviço: R$ ${service?.price.toFixed(2)}\n`
      if (includeTravelFee && area && area.travel_fee > 0) {
        message += `• Taxa de deslocamento: R$ ${area.travel_fee.toFixed(2)}\n`
      }
    }
    
    if (includeCancellationFee) {
      const cancelFee = (calculatedPrice + (includeTravelFee && !regionalPrice && area ? area.travel_fee : 0)) * cancellationFeePercent / 100
      message += `• Taxa de cancelamento (${cancellationFeePercent}%): R$ ${cancelFee.toFixed(2)}\n`
    }
    
    message += `\n🎯 *TOTAL: R$ ${totalWithTravel.toFixed(2)}*\n\n`
    message += `⏰ *Duração:* ${service?.duration_minutes} minutos\n\n`
    message += `✨ Orçamento válido por 7 dias\n`
    message += `📞 Para confirmar, responda esta mensagem!`

    // Criar URL do WhatsApp
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${encodedMessage}`
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        🧮 Calculadora de Preços
      </h2>
      
      <div className="space-y-4">
        {/* Dados do Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              👤 Nome do Cliente *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome completo do cliente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              📱 Telefone do Cliente *
            </label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="11987654321"
            />
          </div>
        </div>

        {/* Seleção de Serviço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Serviço
          </label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Selecione um serviço</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.category_name} - {service.name} (Padrão: R$ {service.price.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Seleção de Região */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Região de Atendimento
          </label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Selecione uma região</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name} {area.travel_fee > 0 && `(Taxa deslocamento: R$ ${area.travel_fee.toFixed(2)})`}
              </option>
            ))}
          </select>
        </div>

        {/* Opções de Taxa */}
        {selectedService && selectedArea && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800">⚙️ Opções de Taxa</h4>
            
            {/* Taxa de Deslocamento */}
            {(() => {
              const area = areas.find(a => a.id === selectedArea)
              const hasRegionalPrice = regionalPrices.some(
                rp => rp.service_id === selectedService && rp.service_area_id === selectedArea
              )
              
              return area && area.travel_fee > 0 && !hasRegionalPrice && (
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="includeTravelFee"
                    checked={includeTravelFee}
                    onChange={(e) => setIncludeTravelFee(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeTravelFee" className="text-sm text-gray-700">
                    Incluir taxa de deslocamento: <strong>R$ {area.travel_fee.toFixed(2)}</strong>
                  </label>
                </div>
              )
            })()}

            {/* Taxa de Cancelamento */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="includeCancellationFee"
                  checked={includeCancellationFee}
                  onChange={(e) => {
                    // only allow enabling if percent is valid
                    if (e.target.checked && !cancellationPercentValid) {
                      alert('Corrija o percentual antes de ativar a taxa de cancelamento.')
                      return
                    }
                    setIncludeCancellationFee(e.target.checked)
                  }}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="includeCancellationFee" className="text-sm text-gray-700">
                  Incluir taxa de cancelamento
                </label>
              </div>
              
              {includeCancellationFee && (
                <div className="ml-7 flex items-center space-x-2">
                  <label htmlFor="cancellationPercent" className="text-sm text-gray-600">
                    Percentual:
                  </label>
                  <NumericInput
                    id="cancellationPercent"
                    value={String(cancellationFeePercent)}
                    onChange={(v) => {
                      const n = parseInt(v, 10)
                      setCancellationFeePercent(Number.isNaN(n) ? 0 : n)
                    }}
                    decimalPlaces={null}
                    allowComma={false}
                    min={0}
                    max={100}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    onValidate={(valid) => setCancellationPercentValid(valid)}
                  />
                  <span className="text-sm text-gray-600">%</span>
                  {!cancellationPercentValid && (
                    <p className="text-xs text-red-600 ml-2">Percentual inválido (0-100).</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resultado do Cálculo */}
        {selectedService && selectedArea && (
          <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">💰 Orçamento Final</h3>
            
            <div className="space-y-3">
              {/* Mostrar preço padrão vs regional */}
              {(() => {
                const service = services.find(s => s.id === selectedService)
                const area = areas.find(a => a.id === selectedArea)
                const regionalPrice = regionalPrices.find(
                  rp => rp.service_id === selectedService && rp.service_area_id === selectedArea
                )
                const isRegionalPrice = !!regionalPrice
                
                return (
                  <div>
                    {isRegionalPrice ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Preço padrão:</span>
                          <span className="line-through">R$ {service?.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600 font-medium">Preço para {area?.name}:</span>
                          <span className="font-medium text-blue-600">R$ {regionalPrice.price.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Preço do serviço:</span>
                        <span className="font-medium">R$ {service?.price.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Taxa de deslocamento */}
                    {includeTravelFee && !isRegionalPrice && area && area.travel_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-orange-600">Taxa de deslocamento:</span>
                        <span className="font-medium text-orange-600">+ R$ {area.travel_fee.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Taxa de cancelamento */}
                    {includeCancellationFee && (
                      <div className="flex justify-between">
                        <span className="text-red-600">Taxa de cancelamento ({cancellationFeePercent}%):</span>
                        <span className="font-medium text-red-600">
                          + R$ {((calculatedPrice + (includeTravelFee && !isRegionalPrice && area ? area.travel_fee : 0)) * cancellationFeePercent / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })()}
              
              <hr className="my-3" />
              
              <div className="flex justify-between text-xl font-bold">
                <span className="text-gray-800">Total:</span>
                <span className="text-green-600">R$ {totalWithTravel.toFixed(2)}</span>
              </div>
            </div>

            {/* Indicadores */}
            <div className="mt-4 space-y-2">
              {/* Indicador de Preço Regional */}
              {regionalPrices.some(rp => rp.service_id === selectedService && rp.service_area_id === selectedArea) && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>⭐ Preço regional aplicado!</strong>
                    <br />
                    Este serviço tem preço especial para a região selecionada (inclui deslocamento).
                  </div>
                </div>
              )}

              {/* Aviso sobre taxa de cancelamento */}
              {includeCancellationFee && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-800">
                    <strong>⚠️ Taxa de cancelamento incluída!</strong>
                    <br />
                    {cancellationFeePercent}% do valor total será cobrado em caso de cancelamento.
                  </div>
                </div>
              )}

              {/* Botão WhatsApp */}
              {clientName && clientPhone && (
                <div className="mt-4">
                  <button
                    onClick={sendWhatsAppBudget}
                    className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>📱</span>
                    <span>Enviar Orçamento pelo WhatsApp</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Explicação */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">📝 Como funciona:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <strong>Preço Padrão:</strong> Valor base do serviço</li>
            <li>• <strong>Preço Regional:</strong> Valor específico para determinada região (se cadastrado)</li>
            <li>• <strong>Regra:</strong> Se existe preço regional, ele substitui completamente o preço padrão</li>
            <li>• <strong>O preço regional JÁ INCLUI</strong> deslocamento, materiais extras, etc.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}