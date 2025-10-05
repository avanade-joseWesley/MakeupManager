import React, { useState, useEffect, useCallback } from 'react'
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
  const [whatsappMessage, setWhatsappMessage] = useState('')
  
  // Estados do modal de agendamento
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [appointmentAddress, setAppointmentAddress] = useState('')
  const [isAppointmentConfirmed, setIsAppointmentConfirmed] = useState(false)

  // Estados de pagamento
  const [downPaymentAmount, setDownPaymentAmount] = useState('0')
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'partial'>('pending')
  
  // Múltiplos serviços no agendamento
  const [appointmentServices, setAppointmentServices] = useState<Array<{
    serviceId: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>>([])
  
  // Controle de categorias expandidas
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  
  // Dados do cliente
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [knownClients, setKnownClients] = useState<Array<{id:string,name:string,phone?:string}>>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientsError, setClientsError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!user || !user.id) return
      
      setClientsLoading(true)
      setClientsError(null)
      try {
        let query = supabase.from('clients').select('id,name,phone,address,instagram').order('created_at', { ascending: false })
        query = query.eq('user_id', user.id)
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
  }, [user])

  const handleClientNameChange = (v: string) => {
    setClientName(v)
    const match = knownClients.find(c => c.name === v)
    if (match && match.phone) setClientPhone(match.phone)
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    if (!user || !user.id) return
    
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

  // Calcular preços derivados usando useMemo
  const calculatedPrices = React.useMemo(() => {
    if (appointmentServices.length === 0 || !selectedArea) {
      return {
        services: [],
        servicesTotal: 0,
        totalWithTravel: 0
      }
    }

    // Recalcular preços de todos os serviços
    const updatedServices = appointmentServices.map(service => {
      const serviceInfo = services.find(s => s.id === service.serviceId)
      const regionalPrice = regionalPrices.find(
        rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea
      )

      const unitPrice = regionalPrice ? regionalPrice.price : (serviceInfo?.price || 0)
      const totalPrice = unitPrice * service.quantity

      return {
        ...service,
        unitPrice,
        totalPrice
      }
    })

    // Calcular total
    const servicesTotal = updatedServices.reduce((sum, service) => sum + service.totalPrice, 0)
    const area = areas.find(a => a.id === selectedArea)
    const hasAnyRegionalPrice = updatedServices.some(service =>
      regionalPrices.some(rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea)
    )

    let finalPrice = servicesTotal

    // Taxa de deslocamento (opcional - não adicionar se já tem preço regional)
    if (includeTravelFee && !hasAnyRegionalPrice && area && area.travel_fee > 0) {
      finalPrice += area.travel_fee
    }

    return {
      services: updatedServices,
      servicesTotal,
      totalWithTravel: finalPrice
    }
  }, [appointmentServices, selectedArea, services, areas, regionalPrices, includeTravelFee])

  // Usar os valores calculados diretamente, sem atualizar o estado

  const sendWhatsAppBudget = () => {
    if (!clientName || !clientPhone || calculatedPrices.services.length === 0 || !selectedArea) {
      alert('Por favor, preencha todos os campos obrigatórios e selecione pelo menos um serviço!')
      return
    }

    const area = areas.find(a => a.id === selectedArea)
    const hasAnyRegionalPrice = calculatedPrices.services.some(service =>
      regionalPrices.some(rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea)
    )

    // Construir mensagem
    let message = `🌟 *ORÇAMENTO PERSONALIZADO* 🌟\n\n`
    message += `👤 *Cliente:* ${clientName}\n`
    message += `📱 *Telefone:* ${clientPhone}\n\n`
    message += `💄 *Serviços Solicitados:*\n`

    calculatedPrices.services.forEach((service, index) => {
      const serviceInfo = services.find(s => s.id === service.serviceId)
      const regionalPrice = regionalPrices.find(
        rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea
      )
      const unitPrice = regionalPrice ? regionalPrice.price : service.unitPrice

      message += `${index + 1}. ${serviceInfo?.name} (${service.quantity}x) - R$ ${(unitPrice * service.quantity).toFixed(2)}\n`
      if (regionalPrice) {
        message += `   └ Preço regional para ${area?.name}\n`
      }
    })

    message += `\n📍 *Local:* ${area?.name}\n\n`

    // Detalhes do preço
    message += `💰 *DETALHES DO ORÇAMENTO:*\n`

    const servicesTotal = calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)
    message += `• Subtotal dos serviços: R$ ${servicesTotal.toFixed(2)}\n`

    if (includeTravelFee && !hasAnyRegionalPrice && area && area.travel_fee > 0) {
      message += `• Taxa de deslocamento: R$ ${area.travel_fee.toFixed(2)}\n`
    }

    const finalTotal = servicesTotal + (includeTravelFee && !hasAnyRegionalPrice && area ? area.travel_fee : 0)
    message += `\n🎯 *TOTAL: R$ ${finalTotal.toFixed(2)}*\n\n`

    if (hasAnyRegionalPrice) {
      message += `⭐ *Preços regionais aplicados* (inclui deslocamento)\n\n`
    }

    message += `⏰ *Duração estimada:* ${calculatedPrices.services.reduce((total, service) => {
      const serviceInfo = services.find(s => s.id === service.serviceId)
      return total + (serviceInfo?.duration_minutes || 0) * service.quantity
    }, 0)} minutos\n\n`
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

  const addServiceToAppointment = (serviceId: string, quantity: number) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return

    const regionalPrice = regionalPrices.find(
      rp => rp.service_id === serviceId && rp.service_area_id === selectedArea
    )
    const unitPrice = regionalPrice ? regionalPrice.price : service.price
    const totalPrice = unitPrice * quantity

    setAppointmentServices(prev => [...prev, {
      serviceId,
      quantity,
      unitPrice,
      totalPrice
    }])
  }

  const createAppointment = async () => {
    if (!user || !user.id) {
      alert('Erro: Usuário não autenticado')
      return
    }

    if (!clientName || !clientPhone) {
      alert('Por favor, preencha o nome e telefone do cliente!')
      return
    }

    if (calculatedPrices.services.length === 0) {
      alert('Por favor, selecione pelo menos um serviço!')
      return
    }

    if (!selectedArea) {
      alert('Por favor, selecione uma região!')
      return
    }

    if (isAppointmentConfirmed && !appointmentAddress.trim()) {
      alert('Por favor, preencha o endereço do agendamento!')
      return
    }

    try {
      // 1. Verificar se o cliente existe, se não existir, criar
      let clientId = knownClients.find(c => c.name === clientName)?.id

      if (!clientId) {
        // Criar novo cliente
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            name: clientName,
            phone: clientPhone,
            address: appointmentAddress || null
          })
          .select('id')
          .single()

        if (clientError) throw clientError
        clientId = newClient.id
      }

      // 2. Calcular valores de pagamento
      const totalServiceValue = calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)
      const downPaymentPaid = parseFloat(downPaymentAmount || '0')

      // Determinar status do pagamento
      let finalPaymentStatus: 'pending' | 'paid' | 'partial' = 'pending'
      if (isAppointmentConfirmed) {
        if (totalServiceValue === 0) {
          finalPaymentStatus = 'paid' // Serviço gratuito
        } else if (downPaymentPaid >= totalServiceValue) {
          finalPaymentStatus = 'paid' // Pago integralmente
        } else if (downPaymentPaid > 0) {
          finalPaymentStatus = 'partial' // Pagamento parcial
        } else {
          finalPaymentStatus = 'pending' // Pendente
        }
      }

      // 3. Criar o agendamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          client_id: clientId,
          service_area_id: selectedArea,
          scheduled_date: null, // Será definido depois
          scheduled_time: null, // Será definido depois
          status: isAppointmentConfirmed ? 'confirmed' : 'pending',
          appointment_address: appointmentAddress || null,
          total_received: downPaymentPaid,

          // Campos de pagamento
          payment_down_payment_paid: downPaymentPaid,
          payment_total_service: totalServiceValue,
          payment_status: finalPaymentStatus,

          notes: `Agendamento criado via calculadora - ${calculatedPrices.services.length} serviço(s)`
        })
        .select('id')
        .single()

      if (appointmentError) throw appointmentError

      // 4. Inserir os serviços do agendamento
      const appointmentServicesData = calculatedPrices.services.map(service => ({
        appointment_id: appointment.id,
        service_id: service.serviceId,
        quantity: service.quantity,
        unit_price: service.unitPrice,
        total_price: service.totalPrice
      }))

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(appointmentServicesData)

      if (servicesError) throw servicesError

      // 5. Sucesso - fechar modal e limpar dados
      alert(`✅ Agendamento ${isAppointmentConfirmed ? 'confirmado' : 'criado'} com sucesso!`)
      
      setShowAppointmentModal(false)
      setAppointmentAddress('')
      setIsAppointmentConfirmed(false)
      setDownPaymentAmount('0')
      setPaymentStatus('pending')

      // Recarregar lista de clientes para incluir o novo (se foi criado)
      loadData()

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error)
      alert(`Erro ao criar agendamento: ${error.message}`)
    }
  }

  return (
    <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        🧮 Calculadora de Preços
      </h2>
      
      <div className="space-y-3">
        {/* Dados do Cliente */}
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
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

        {/* Seleção de Serviços por Categoria */}
        <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            💄 Serviços Disponíveis
          </label>

          {/* Cards de Categorias */}
          <div className="space-y-1">
            {(() => {
              // Agrupar serviços por categoria
              const servicesByCategory = services.reduce((acc, service) => {
                const category = service.category_name || 'Sem categoria'
                if (!acc[category]) acc[category] = []
                acc[category].push(service)
                return acc
              }, {} as Record<string, typeof services>)

              return Object.entries(servicesByCategory).map(([categoryName, categoryServices]) => {
                const isExpanded = expandedCategories.includes(categoryName)

                return (
                  <div key={categoryName} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Header da Categoria */}
                    <button
                      onClick={() => {
                        setExpandedCategories(prev =>
                          prev.includes(categoryName)
                            ? prev.filter(c => c !== categoryName)
                            : [...prev, categoryName]
                        )
                      }}
                      className="w-full px-2 py-1 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors flex items-center justify-between text-left"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-gray-800">
                          {categoryName}
                        </span>
                        <span className="text-xs text-gray-600 bg-white px-1.5 py-0.5 rounded-full">
                          {categoryServices.length}
                        </span>
                      </div>
                      <span className={`transform transition-transform text-gray-600 ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {/* Serviços da Categoria */}
                    {isExpanded && (
                      <div className="p-1 bg-white border-t border-gray-100">
                        <div className="space-y-1">
                          {categoryServices.map((service) => {
                            const isSelected = appointmentServices.some(s => s.serviceId === service.id)
                            const selectedService = appointmentServices.find(s => s.serviceId === service.id)
                            const regionalPrice = regionalPrices.find(
                              rp => rp.service_id === service.id && rp.service_area_id === selectedArea
                            )
                            const displayPrice = regionalPrice ? regionalPrice.price : service.price

                            return (
                              <div key={service.id} className="p-1 rounded hover:bg-gray-50">
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="checkbox"
                                    id={`service-${service.id}`}
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        // Adicionar serviço
                                        const unitPrice = regionalPrice ? regionalPrice.price : service.price
                                        setAppointmentServices(prev => [...prev, {
                                          serviceId: service.id,
                                          quantity: 1,
                                          unitPrice,
                                          totalPrice: unitPrice
                                        }])
                                      } else {
                                        // Remover serviço
                                        setAppointmentServices(prev => prev.filter(s => s.serviceId !== service.id))
                                      }
                                    }}
                                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded flex-shrink-0"
                                  />

                                  <div className="flex-1 min-w-0 flex items-center justify-between">
                                    <label
                                      htmlFor={`service-${service.id}`}
                                      className="text-xs font-medium text-gray-800 cursor-pointer min-w-0 leading-tight"
                                    >
                                      {service.name}
                                    </label>
                                    <div className="text-xs font-medium text-gray-800 flex items-center space-x-1 flex-shrink-0 ml-1 mr-2">
                                      <span>R$ {displayPrice.toFixed(2)}</span>
                                      {regionalPrice && (
                                        <span className="text-blue-600 font-medium text-xs">⭐</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {isSelected && (
                                  <div className="flex items-center justify-end mt-2 ml-5">
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs text-gray-600 mr-2">Quantidade:</span>
                                      <button
                                        onClick={() => {
                                          const currentQuantity = selectedService?.quantity || 1
                                          if (currentQuantity > 1) {
                                            const newQuantity = currentQuantity - 1
                                            const unitPrice = regionalPrice ? regionalPrice.price : service.price
                                            setAppointmentServices(prev => prev.map(s =>
                                              s.serviceId === service.id
                                                ? { ...s, quantity: newQuantity, totalPrice: unitPrice * newQuantity }
                                                : s
                                            ))
                                          }
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-sm touch-manipulation"
                                      >
                                        −
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        value={selectedService?.quantity || 1}
                                        onChange={(e) => {
                                          const newQuantity = parseInt(e.target.value) || 1
                                          const unitPrice = regionalPrice ? regionalPrice.price : service.price
                                          setAppointmentServices(prev => prev.map(s =>
                                            s.serviceId === service.id
                                              ? { ...s, quantity: newQuantity, totalPrice: unitPrice * newQuantity }
                                              : s
                                          ))
                                        }}
                                        className="w-12 h-8 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                      />
                                      <button
                                        onClick={() => {
                                          const currentQuantity = selectedService?.quantity || 1
                                          const newQuantity = currentQuantity + 1
                                          const unitPrice = regionalPrice ? regionalPrice.price : service.price
                                          setAppointmentServices(prev => prev.map(s =>
                                            s.serviceId === service.id
                                              ? { ...s, quantity: newQuantity, totalPrice: unitPrice * newQuantity }
                                              : s
                                          ))
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold text-sm touch-manipulation"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
        </div>
        {calculatedPrices.services.length > 0 && selectedArea && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="mr-2">⚙️</span>
              Opções Adicionais
            </h4>

            {/* Taxa de Deslocamento */}
            {(() => {
              const area = areas.find(a => a.id === selectedArea)
              const hasAnyRegionalPrice = calculatedPrices.services.some(service =>
                regionalPrices.some(rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea)
              )

              return area && area.travel_fee > 0 && !hasAnyRegionalPrice && (
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <input
                    type="checkbox"
                    id="includeTravelFee"
                    checked={includeTravelFee}
                    onChange={(e) => setIncludeTravelFee(e.target.checked)}
                    className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeTravelFee" className="text-sm text-orange-800 font-medium">
                    🚗 Incluir taxa de deslocamento: <strong>R$ {area.travel_fee.toFixed(2)}</strong>
                  </label>
                </div>
              )
            })()}

            {(() => {
              const area = areas.find(a => a.id === selectedArea)
              const hasAnyRegionalPrice = calculatedPrices.services.some(service =>
                regionalPrices.some(rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea)
              )
              return !(area && area.travel_fee > 0 && !hasAnyRegionalPrice) && (
                <div className="text-sm text-gray-500 italic">
                  Nenhuma opção adicional disponível para esta combinação de serviços e região.
                </div>
              )
            })()}
          </div>
        )}        {/* Resultado do Cálculo */}
        {calculatedPrices.services.length > 0 && selectedArea && (
          <div className="mt-4 p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-xl border border-pink-200 shadow-lg">
            <h3 className="font-bold text-gray-800 mb-4 text-xl flex items-center">
              <span className="mr-2">💰</span>
              Orçamento Final
            </h3>

            <div className="space-y-4">
              {/* Detalhes de cada serviço */}
              <div className="space-y-3">
                {calculatedPrices.services.map((service, index) => {
                  const serviceInfo = services.find(s => s.id === service.serviceId)
                  const area = areas.find(a => a.id === selectedArea)
                  const regionalPrice = regionalPrices.find(
                    rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea
                  )
                  const isRegionalPrice = !!regionalPrice
                  const unitPrice = regionalPrice ? regionalPrice.price : service.unitPrice

                  return (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <span className="font-semibold text-gray-800 text-lg">
                            {service.quantity}x {serviceInfo?.name}
                          </span>
                          {isRegionalPrice && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              ⭐ Preço Regional
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-green-600 text-lg">
                          R$ {(unitPrice * service.quantity).toFixed(2)}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Preço unitário:</span>
                          <span>R$ {unitPrice.toFixed(2)}</span>
                        </div>
                        {isRegionalPrice && (
                          <div className="flex justify-between text-blue-600 mt-1">
                            <span>Preço padrão:</span>
                            <span className="line-through">R$ {service.unitPrice.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Taxa de deslocamento */}
              {includeTravelFee && (() => {
                const area = areas.find(a => a.id === selectedArea)
                const hasAnyRegionalPrice = calculatedPrices.services.some(service =>
                  regionalPrices.some(rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea)
                )
                return !hasAnyRegionalPrice && area && area.travel_fee > 0 && (
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <div className="flex justify-between text-orange-800">
                      <span className="font-medium">🚗 Taxa de deslocamento:</span>
                      <span className="font-bold">+ R$ {area.travel_fee.toFixed(2)}</span>
                    </div>
                  </div>
                )
              })()}

              <hr className="border-gray-300" />

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-green-600">R$ {(() => {
                    const servicesTotal = calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)
                    const area = areas.find(a => a.id === selectedArea)
                    const hasAnyRegionalPrice = calculatedPrices.services.some(service =>
                      regionalPrices.some(rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea)
                    )
                    const travelFee = includeTravelFee && !hasAnyRegionalPrice && area ? area.travel_fee : 0
                    return (servicesTotal + travelFee).toFixed(2)
                  })()}</span>
                </div>
              </div>
            </div>

            {/* Indicadores */}
            <div className="mt-4 space-y-2">
              {/* Indicador de Preço Regional */}
              {calculatedPrices.services.some(service =>
                regionalPrices.some(rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea)
              ) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>⭐ Preços regionais aplicados!</strong>
                    <br />
                    Alguns serviços têm preço especial para a região selecionada (inclui deslocamento).
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              {clientName && clientPhone && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={sendWhatsAppBudget}
                      className="w-full py-4 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg text-base"
                    >
                      <span>📱</span>
                      <span>Enviar Orçamento</span>
                    </button>
                    
                    <button
                      onClick={() => setShowAppointmentModal(true)}
                      className="w-full py-4 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg text-base"
                    >
                      <span>📅</span>
                      <span>Criar Agendamento</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}        {/* Explicação */}
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">📝 Como funciona:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <strong>Clique nas categorias</strong> para expandir e ver os serviços disponíveis</li>
            <li>• <strong>Marque os checkboxes</strong> para selecionar serviços desejados</li>
            <li>• <strong>Ajuste as quantidades</strong> dos serviços selecionados</li>
            <li>• <strong>Preço Padrão:</strong> Valor base de cada serviço</li>
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
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📅 {isAppointmentConfirmed ? 'Confirmar' : 'Criar'} Agendamento
              </h3>
              
              <div className="space-y-4">
                {/* Cliente e Telefone lado a lado em telas maiores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      👤 Cliente
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📱 Telefone
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                  </div>
                </div>

                {/* Serviços do Agendamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💄 Serviços do Agendamento
                  </label>
                  
                  {/* Lista de serviços selecionados - compacta */}
                  {calculatedPrices.services.length > 0 && (
                    <div className="space-y-2 mb-3 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                      {calculatedPrices.services.map((service, index) => {
                        const serviceInfo = services.find(s => s.id === service.serviceId)
                        const regionalPrice = regionalPrices.find(
                          rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea
                        )
                        const isRegionalPrice = !!regionalPrice

                        return (
                          <div key={index} className="p-2 bg-gray-50 rounded border text-sm">
                            <div className="flex justify-between items-center">
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-gray-800 text-sm">
                                  {service.quantity}x {serviceInfo?.name}
                                </span>
                                {isRegionalPrice && (
                                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                    ⭐
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-green-600 text-sm ml-2">
                                R$ {service.totalPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Seção de Pagamento */}
                <div className="border-t border-gray-200 pt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💳 Informações de Pagamento
                  </label>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      💰 Valor da Entrada Paga
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500 text-sm">R$</span>
                      <input
                        type="number"
                        value={downPaymentAmount}
                        onChange={(e) => setDownPaymentAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        placeholder="0,00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Status do pagamento calculado */}
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <strong>📊 Status calculado:</strong>{' '}
                    {(() => {
                      const totalValue = calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)
                      const downPayment = parseFloat(downPaymentAmount || '0')
                      const pending = totalValue - downPayment

                      if (totalValue === 0) return 'Pago (serviço gratuito)'
                      if (downPayment >= totalValue) return 'Pago (integral)'
                      if (downPayment > 0) return `Parcial (falta R$ ${pending.toFixed(2)})`
                      return 'Pendente'
                    })()}
                  </div>
                </div>

                {/* Checkbox para confirmar agendamento */}
                <div className="flex items-center space-x-2 py-2 border-t border-gray-200">
                  <input
                    type="checkbox"
                    id="isAppointmentConfirmed"
                    checked={isAppointmentConfirmed}
                    onChange={(e) => setIsAppointmentConfirmed(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAppointmentConfirmed" className="text-sm text-gray-700">
                    <strong>Confirmar agendamento</strong> (requer endereço)
                  </label>
                </div>
                
                {isAppointmentConfirmed && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📍 Endereço do Agendamento *
                    </label>
                    <textarea
                      value={appointmentAddress}
                      onChange={(e) => setAppointmentAddress(e.target.value)}
                      className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                      placeholder="Digite o endereço completo do agendamento"
                    />
                  </div>
                )}
                
                <div className={`p-3 rounded-lg text-sm ${isAppointmentConfirmed ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'}`}>
                  <div className={`text-sm ${isAppointmentConfirmed ? 'text-blue-800' : 'text-orange-800'}`}>
                    <strong>💄 Serviços:</strong><br />
                    {calculatedPrices.services.map((service, index) => {
                      const serviceInfo = services.find(s => s.id === service.serviceId)
                      const regionalPrice = regionalPrices.find(
                        rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea
                      )
                      return (
                        <div key={index} className="ml-2">
                          • {service.quantity}x {serviceInfo?.name} - R$ {service.totalPrice.toFixed(2)}
                          {regionalPrice && <span className="text-blue-600"> ⭐</span>}
                        </div>
                      )
                    })}
                    <br />
                    <strong>� Local:</strong> {areas.find(a => a.id === selectedArea)?.name}<br />
                    <strong>💰 Total geral:</strong> R$ {calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0).toFixed(2)}
                    {parseFloat(downPaymentAmount || '0') > 0 && (
                      <>
                        <br />
                        <strong>💳 Entrada paga:</strong> R$ {parseFloat(downPaymentAmount || '0').toFixed(2)}
                        <br />
                        <strong>⏳ Pendente:</strong> R$ {(calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0) - parseFloat(downPaymentAmount || '0')).toFixed(2)}
                      </>
                    )}
                    <br />
                    <strong>📊 Status:</strong> {isAppointmentConfirmed ? 'Confirmado' : 'Pendente'}
                    {isAppointmentConfirmed && appointmentAddress && (
                      <>
                        <br />
                        <strong>🏠 Endereço:</strong> {appointmentAddress}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAppointmentModal(false)
                    setAppointmentAddress('')
                    setIsAppointmentConfirmed(false)
                    setDownPaymentAmount('0')
                    setPaymentStatus('pending')
                  }}
                  className="flex-1 py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={createAppointment}
                  className={`flex-1 py-2 px-4 text-white rounded-lg font-medium transition-colors text-sm ${
                    isAppointmentConfirmed 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {isAppointmentConfirmed ? '✅ Confirmar' : '📝 Criar'} Agendamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
