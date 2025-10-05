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
  
  // Opções adicionais
  const [includeTravelFee, setIncludeTravelFee] = useState(false)
  
  // Estados dos modais
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [appointmentAddress, setAppointmentAddress] = useState('')
  
  // Dados do cliente
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [knownClients, setKnownClients] = useState<Array<{id:string,name:string,phone?:string}>>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setClientsLoading(true)
      setClientsError(null)
      try {
        let query = supabase.from('clients').select('id,name,phone,address,instagram').order('created_at', { ascending: false })
        if (user && user.id) query = query.eq('user_id', user.id)
        const { data, error } = await query

        if (error) throw error
        if (mounted && data) {
          setKnownClients(data.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone, address: c.address, instagram: c.instagram })))
        }
      } catch (err: any) {
        console.warn('Erro carregando clients do Supabase', err)
        setClientsError(err.message || String(err))
      } finally {
        setClientsLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleClientNameChange = (v: string) => {
    setClientName(v)
    const match = knownClients.find(c => c.name === v)
    if (match && match.phone) setClientPhone(match.phone)
  }

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
  }, [selectedService, selectedArea, services, areas, regionalPrices, includeTravelFee])

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
    if (includeTravelFee && !regionalPrice && area.travel_fee > 0) {
      finalPrice += area.travel_fee
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
    
    message += `\n🎯 *TOTAL: R$ ${totalWithTravel.toFixed(2)}*\n\n`
    message += `⏰ *Duração:* ${service?.duration_minutes} minutos\n\n`
    message += `✨ Orçamento válido por 7 dias\n`
    message += `📞 Para confirmar, responda esta mensagem!`

    setWhatsappMessage(message)
    setShowWhatsAppModal(true)
  }

  const confirmSendWhatsApp = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage)
    const whatsappUrl = `https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
    setShowWhatsAppModal(false)
  }

  const createAppointment = async () => {
    if (!appointmentAddress.trim()) {
      alert('Por favor, informe o endereço do agendamento!')
      return
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientName,
          phone: clientPhone,
          address: appointmentAddress,
          user_id: user?.id,
          status: 'confirmed'
        })
        .select()
        .single()

      if (error) throw error

      alert('✅ Agendamento confirmado com sucesso!')
      setShowAppointmentModal(false)
      setAppointmentAddress('')
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error)
      alert(`Erro ao criar agendamento: ${error.message}`)
    }
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
              list="clients-list"
              type="text"
              value={clientName}
              onChange={(e) => handleClientNameChange(e.target.value)}
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome completo do cliente"
            />
            <datalist id="clients-list">
              {knownClients.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
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
            <h4 className="font-medium text-gray-800">⚙️ Opções Adicionais</h4>
            
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

              {/* Botões de Ação */}
              {clientName && clientPhone && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={sendWhatsAppBudget}
                      className="py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>📱</span>
                      <span>Enviar Orçamento</span>
                    </button>
                    <button
                      onClick={() => setShowAppointmentModal(true)}
                      className="py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>📅</span>
                      <span>Agendar Serviço</span>
                    </button>
                  </div>
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

      {/* Modal WhatsApp */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📱 Revisar Mensagem do WhatsApp
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem que será enviada:
                </label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Mensagem do WhatsApp"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowWhatsAppModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmSendWhatsApp}
                  className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  📱 Enviar pelo WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agendamento */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📅 Confirmar Agendamento
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 Cliente
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📱 Telefone
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📍 Endereço do Agendamento *
                  </label>
                  <textarea
                    value={appointmentAddress}
                    onChange={(e) => setAppointmentAddress(e.target.value)}
                    className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Digite o endereço completo do agendamento"
                  />
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>💄 Serviço:</strong> {services.find(s => s.id === selectedService)?.name}<br />
                    <strong>📍 Local:</strong> {areas.find(a => a.id === selectedArea)?.name}<br />
                    <strong>💰 Valor:</strong> R$ {totalWithTravel.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createAppointment}
                  className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  ✅ Confirmar Agendamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}