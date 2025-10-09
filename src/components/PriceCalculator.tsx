import React, { useState, useEffect, useCallback } from 'react'
import { supabase, formatDuration } from '../lib/supabase'
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
  description?: string
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
  const [useManualPrice, setUseManualPrice] = useState(false)
  const [manualPrice, setManualPrice] = useState('')
  
  // Estados dos modais
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [whatsappMessage, setWhatsappMessage] = useState('')
  
  // Estados do modal de agendamento
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [appointmentAddress, setAppointmentAddress] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [appointmentHour, setAppointmentHour] = useState('')
  const [appointmentMinute, setAppointmentMinute] = useState('')
  const [isAppointmentConfirmed, setIsAppointmentConfirmed] = useState(false)

  // Estados de pagamento
  const [downPaymentAmount, setDownPaymentAmount] = useState('0')
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'partial'>('pending')

  // Controle de criação de agendamento
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false)
  
  // Modal de confirmação de pagamento
  const [showPaymentConfirmationModal, setShowPaymentConfirmationModal] = useState(false)
  
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

  // PDFs disponíveis para anexar
  const [availablePdfs, setAvailablePdfs] = useState<Array<{
    id: string
    name: string
    path: string
    size: number
    created_at: string
  }>>([])
  const [selectedPdfForAttachment, setSelectedPdfForAttachment] = useState<string[]>([])
  const [showPdfSelector, setShowPdfSelector] = useState(false)
  const [pdfSearchTerm, setPdfSearchTerm] = useState('')

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

    // Carregar PDFs disponíveis
    ;(async () => {
      if (!user || !user.id) return

      try {
        const { data, error } = await supabase.storage
          .from('budgets')
          .list(user.id + '/', {
            limit: 50,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          })

        if (error) throw error

        if (mounted && data) {
          const pdfDocuments = data.map(file => ({
            id: file.id || file.name,
            name: file.name,
            path: `${user.id}/${file.name}`,
            size: file.metadata?.size || 0,
            created_at: file.created_at || new Date().toISOString()
          }))
          setAvailablePdfs(pdfDocuments)
        }
      } catch (err: any) {
        console.warn('Erro carregando PDFs:', err)
      }
    })()
    return () => { mounted = false }
  }, [user])

  // Filtrar PDFs baseado no termo de pesquisa
  const filteredPdfs = availablePdfs.filter(pdf =>
    pdf.name.toLowerCase().includes(pdfSearchTerm.toLowerCase())
  )

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
          description,
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

  // Definir automaticamente 30% do valor total quando confirmar agendamento
  useEffect(() => {
    if (isAppointmentConfirmed && (calculatedPrices.services.length > 0 || (useManualPrice && manualPrice))) {
      const totalValue = useManualPrice && manualPrice ? 
        parseFloat(manualPrice.replace(',', '.')) : 
        calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)
      const area = areas.find(a => a.id === selectedArea)
      const hasAnyRegionalPrice = calculatedPrices.services.some(service =>
        regionalPrices.some(rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea)
      )
      const travelFee = includeTravelFee && !hasAnyRegionalPrice && area ? area.travel_fee : 0
      const finalTotal = useManualPrice && manualPrice ? totalValue : totalValue + travelFee
      const thirtyPercent = (finalTotal * 0.3).toFixed(2)
      setDownPaymentAmount(thirtyPercent)
    }
  }, [isAppointmentConfirmed, calculatedPrices, selectedArea, areas, regionalPrices, includeTravelFee, useManualPrice, manualPrice])

  // Sincronizar hora e minuto com appointmentTime
  useEffect(() => {
    if (appointmentTime) {
      const [hour, minute] = appointmentTime.split(':')
      setAppointmentHour(hour || '')
      setAppointmentMinute(minute || '')
    } else {
      setAppointmentHour('')
      setAppointmentMinute('')
    }
  }, [appointmentTime])

  // Atualizar appointmentTime quando hora ou minuto mudam
  useEffect(() => {
    if (appointmentHour && appointmentMinute) {
      setAppointmentTime(`${appointmentHour}:${appointmentMinute}`)
    } else if (appointmentHour) {
      setAppointmentTime(`${appointmentHour}:00`)
    } else {
      setAppointmentTime('')
    }
  }, [appointmentHour, appointmentMinute])

  const clearFields = () => {
    setClientName('')
    setClientPhone('')
    setSelectedArea('')
    setAppointmentServices([])
    setIncludeTravelFee(false)
    setUseManualPrice(false)
    setManualPrice('')
    setAppointmentAddress('')
    setAppointmentDate('')
    setAppointmentTime('')
    setAppointmentHour('')
    setAppointmentMinute('')
    setIsAppointmentConfirmed(false)
    setDownPaymentAmount('0')
    setPaymentStatus('pending')
    setSelectedPdfForAttachment([])
  }

  const sendWhatsAppBudget = async () => {
    if (!clientName || !clientPhone || !selectedArea) {
      alert('Por favor, preencha todos os campos obrigatórios!')
      return
    }

    if (!useManualPrice && calculatedPrices.services.length === 0) {
      alert('Por favor, selecione pelo menos um serviço ou habilite o valor diferenciado!')
      return
    }

    if (useManualPrice && (!manualPrice || parseFloat(manualPrice.replace(',', '.')) <= 0)) {
      alert('Por favor, informe um valor válido para o atendimento diferenciado!')
      return
    }

    const area = areas.find(a => a.id === selectedArea)
    const hasAnyRegionalPrice = calculatedPrices.services.some(service =>
      regionalPrices.some(rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea)
    )

    const formatCurrency = (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    // Carregar informações do perfil do usuário
    let userProfile = null
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        userProfile = profileData
      }
    } catch (error) {
      console.warn('Erro ao carregar perfil do usuário:', error)
    }

    const lines: string[] = []
    lines.push('💄 *ORÇAMENTO PERSONALIZADO*')
    lines.push('✨ Produção de Beleza Profissional')
    lines.push('')

    // Informações do cliente
    lines.push('👤 *CLIENTE*')
    lines.push(`Nome: ${clientName}`)
    lines.push(`Telefone: ${clientPhone}`)
    lines.push('')

    if (useManualPrice && manualPrice) {
      const manualValue = parseFloat(manualPrice.replace(',', '.')) || 0
      lines.push('💰 *ATENDIMENTO PERSONALIZADO*')
      lines.push(`Valor definido especialmente: *R$ ${manualValue.toFixed(2)}*`)
      lines.push('• Ajustado conforme necessidades específicas do evento.')
      lines.push('')
    } else {
      lines.push('💄 *SERVIÇOS SOLICITADOS*')

      // Não detalhar preços individuais dos serviços em nenhum caso
      calculatedPrices.services.forEach((service, index) => {
        const serviceInfo = services.find(s => s.id === service.serviceId)

        // DEBUG: Verificar dados do serviço
        console.log('🔍 Serviço encontrado:', serviceInfo)
        console.log('📝 Descrição:', serviceInfo?.description)
        console.log('✅ Tem descrição válida:', !!(serviceInfo?.description && serviceInfo.description.trim() !== ''))

        const serviceLine = `${index + 1}. ${serviceInfo?.name || 'Serviço'} (${service.quantity}x)`
        lines.push(serviceLine)

        // Adicionar descrição se existir, logo após o nome do serviço
        if (serviceInfo?.description && serviceInfo.description.trim() !== '') {
          lines.push(`   ${serviceInfo.description.trim()}`)
        }
      })

      lines.push('')
      lines.push(`📍 *LOCAL DO ATENDIMENTO:* ${area?.name || 'Não informado'}`)
      lines.push('')
    }

    const servicesTotal = calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)
    const travelFeeValue = includeTravelFee && !hasAnyRegionalPrice && area ? area.travel_fee : 0
    const finalTotal = useManualPrice && manualPrice
      ? parseFloat(manualPrice.replace(',', '.')) || 0
      : servicesTotal + (travelFeeValue || 0)

    lines.push('💰 *DETALHES DO ORÇAMENTO*')

    if (useManualPrice && manualPrice) {
      lines.push(`• Valor personalizado do atendimento: *R$ ${finalTotal.toFixed(2)}*`)
      lines.push('• Ajustado conforme necessidades específicas do evento.')
    } else {
      // lines.push(`• Subtotal dos serviços: ${formatCurrency(servicesTotal)}`)
      if (travelFeeValue && travelFeeValue > 0) {
        lines.push(`• *Total geral*: *R$ ${finalTotal.toFixed(2)}* (inclui taxa de deslocamento)`)
      } else if (!includeTravelFee && area && area.travel_fee > 0 && !hasAnyRegionalPrice) {
        // Quando taxa não está incluída, informar o desconto
        lines.push(`• *Total geral*: *R$ ${finalTotal.toFixed(2)}* (taxa de deslocamento foi descontada - R$ ${area.travel_fee.toFixed(2)})`)
      } else {
        lines.push(`• *Total geral*: *R$ ${finalTotal.toFixed(2)}*`)
      }

      if (hasAnyRegionalPrice) {
        lines.push('• Preços regionais já incluem deslocamento e materiais extras.')
      }
    }

    const totalDurationMinutes = calculatedPrices.services.reduce((total, service) => {
      const serviceInfo = services.find(s => s.id === service.serviceId)
      return total + (serviceInfo?.duration_minutes || 0) * service.quantity
    }, 0)

    lines.push('')
    lines.push(`⏱️ *Duração estimada:* ${useManualPrice && manualPrice ? 'A combinar' : formatDuration(totalDurationMinutes)}`)
    lines.push('📅 *Orçamento válido por 7 dias*')
    lines.push('💬 *Responda esta mensagem para confirmar sua data!*')

    // Adicionar redes sociais se existirem
    const socialLines: string[] = []
    if (userProfile && (userProfile.instagram || userProfile.full_name)) {
      socialLines.push('')
      socialLines.push('📱 *SIGA-ME NAS REDES SOCIAIS*')
      if (userProfile.instagram) {
        socialLines.push(`📸 Instagram: https://instagram.com/${userProfile.instagram.replace('@', '')}`)
      }
      if (userProfile.full_name) {
        socialLines.push(`💄 ${userProfile.full_name}`)
      }
    }

    // Adicionar PDFs anexados se selecionados
    const attachmentLines: string[] = []
    if (selectedPdfForAttachment.length > 0) {
      attachmentLines.push('', '*Documentos anexados:*')
      for (const pdfId of selectedPdfForAttachment) {
        const selectedPdf = availablePdfs.find(pdf => pdf.id === pdfId)
        if (selectedPdf) {
          try {
            const { data } = await supabase.storage
              .from('budgets')
              .getPublicUrl(selectedPdf.path)

            if (data?.publicUrl) {
              attachmentLines.push(`• ${selectedPdf.name}`)
              attachmentLines.push(data.publicUrl)
            }
          } catch (err) {
            console.warn(`Erro ao obter URL do PDF ${selectedPdf.name}:`, err)
          }
        }
      }
      attachmentLines.push('Documentos relacionados ao orçamento enviado acima.')
    }

    const message = [...lines, ...socialLines, ...attachmentLines].join('\n')

    setWhatsappMessage(message)
    setShowWhatsAppModal(true)
  }

  const confirmSendWhatsApp = async () => {
    try {
      // 1. Criar agendamento não confirmado automaticamente
      if (!user || !user.id) {
        alert('Erro: Usuário não autenticado')
        return
      }

      // Verificar se o cliente existe, se não existir, criar
      let clientId = knownClients.find(c => c.name === clientName)?.id

      if (!clientId) {
        // Criar novo cliente
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            name: clientName,
            phone: clientPhone,
            address: null
          })
          .select('id')
          .single()

        if (clientError) throw clientError
        clientId = newClient.id
      }

      // Calcular valores
      const totalServiceValue = useManualPrice && manualPrice ? 
        parseFloat(manualPrice.replace(',', '.')) : 
        calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)

      // Criar agendamento não confirmado
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          client_id: clientId,
          service_area_id: selectedArea,
          scheduled_date: null,
          scheduled_time: null,
          status: 'pending',
          appointment_address: null,
          total_received: 0,
          payment_down_payment_paid: 0,
          payment_total_service: totalServiceValue,
          payment_status: 'pending',
          notes: `Orçamento enviado via WhatsApp - ${calculatedPrices.services.length} serviço(s)`
        })
        .select('id')
        .single()

      if (appointmentError) throw appointmentError

      // Inserir os serviços do agendamento
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

      // 2. Enviar mensagem pelo WhatsApp
      const encodedMessage = whatsappMessage.replace(/\n/g, '%0A')
      const cleanedNumber = clientPhone.replace(/\D/g, '')
      const whatsappNumber = cleanedNumber.startsWith('55') ? cleanedNumber : `55${cleanedNumber}`
      const webWhatsappUrl = `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`
      const mobileWhatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`
      const isMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent || ''
      )

      const urlToOpen = isMobileDevice ? mobileWhatsappUrl : webWhatsappUrl
      window.open(urlToOpen, '_blank', 'noopener,noreferrer')

      // 3. Limpar campos e fechar modal
      clearFields()
      setShowWhatsAppModal(false)

      // 4. Recarregar lista de clientes para incluir o novo (se foi criado)
      loadData()

      alert('✅ Orçamento enviado e agendamento criado com sucesso!')

    } catch (error: any) {
      console.error('Erro ao enviar orçamento:', error)
      alert(`Erro ao enviar orçamento: ${error.message}`)
    }
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

    if (!useManualPrice && calculatedPrices.services.length === 0) {
      alert('Por favor, selecione pelo menos um serviço ou habilite o valor diferenciado!')
      return
    }

    if (useManualPrice && (!manualPrice || parseFloat(manualPrice.replace(',', '.')) <= 0)) {
      alert('Por favor, informe um valor válido para o atendimento diferenciado!')
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

    if (isAppointmentConfirmed && !appointmentDate) {
      alert('Por favor, selecione a data do agendamento!')
      return
    }

    if (isAppointmentConfirmed && !appointmentTime) {
      alert('Por favor, selecione o horário do agendamento!')
      return
    }

    // Se for agendamento confirmado, mostrar modal de confirmação de pagamento
    if (isAppointmentConfirmed) {
      setShowPaymentConfirmationModal(true)
      return
    }

    // Para agendamentos pendentes, criar diretamente
    await createAppointmentConfirmed()
  }

  const createAppointmentConfirmed = async () => {
    // Evitar múltiplas execuções simultâneas
    if (isCreatingAppointment) return

    setIsCreatingAppointment(true)

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

      // 2. Verificar se já existe um agendamento duplicado
      const duplicateCheckQuery = supabase
        .from('appointments')
        .select(`
          id,
          appointment_services (
            service_id,
            quantity
          )
        `)
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .eq('service_area_id', selectedArea)

      // Para agendamentos confirmados, verificar data e horário
      if (isAppointmentConfirmed) {
        duplicateCheckQuery
          .eq('scheduled_date', appointmentDate)
          .eq('scheduled_time', appointmentTime)
      }

      const { data: existingAppointments, error: checkError } = await duplicateCheckQuery

      if (checkError) throw checkError

      // Verificar se algum agendamento existente tem os mesmos serviços (apenas se não for valor manual)
      if (existingAppointments && existingAppointments.length > 0 && !useManualPrice) {
        for (const existingAppointment of existingAppointments) {
          const existingServices = existingAppointment.appointment_services || []
          
          // Verificar se tem a mesma quantidade de serviços
          if (existingServices.length === calculatedPrices.services.length) {
            // Verificar se todos os serviços são iguais (mesmo ID e quantidade)
            const servicesMatch = calculatedPrices.services.every(newService => {
              return existingServices.some(existingService => 
                existingService.service_id === newService.serviceId && 
                existingService.quantity === newService.quantity
              )
            })

            if (servicesMatch) {
              alert('⚠️ Agendamento duplicado detectado!\n\nJá existe um agendamento idêntico para este cliente com os mesmos serviços, data e horário.')
              return
            }
          }
        }
      }

      // 3. Calcular valores de pagamento e tempo total
      const totalServiceValue = useManualPrice && manualPrice ? 
        parseFloat(manualPrice.replace(',', '.')) : 
        calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)
      const downPaymentPaid = parseFloat(downPaymentAmount || '0')

      // Calcular tempo total do atendimento (soma da duração de todos os serviços)
      const totalDurationMinutes = useManualPrice && manualPrice ? 
        60 : // Valor padrão para atendimentos com preço diferenciado
        calculatedPrices.services.reduce((total, service) => {
          const serviceInfo = services.find(s => s.id === service.serviceId)
          return total + (serviceInfo?.duration_minutes || 60) * service.quantity
        }, 0)

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

      // 4. Criar o agendamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          client_id: clientId,
          service_area_id: selectedArea,
          scheduled_date: isAppointmentConfirmed ? appointmentDate : null,
          scheduled_time: isAppointmentConfirmed ? appointmentTime : null,
          status: isAppointmentConfirmed ? 'confirmed' : 'pending',
          appointment_address: appointmentAddress || null,
          total_received: downPaymentPaid,

          // Campos de pagamento
          payment_down_payment_paid: downPaymentPaid,
          payment_total_service: totalServiceValue,
          payment_status: finalPaymentStatus,

          // Tempo total do atendimento
          total_duration_minutes: totalDurationMinutes,

          notes: useManualPrice ? 
            `Agendamento criado via calculadora - Valor diferenciado: R$ ${parseFloat(manualPrice.replace(',', '.')).toFixed(2)}` : 
            `Agendamento criado via calculadora - ${calculatedPrices.services.length} serviço(s)`
        })
        .select('id')
        .single()

      if (appointmentError) throw appointmentError

      // 5. Inserir os serviços do agendamento (apenas se não for valor manual)
      if (!useManualPrice && calculatedPrices.services.length > 0) {
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
      }

      // 6. Sucesso - fechar modal e limpar dados
      alert(`✅ Agendamento ${isAppointmentConfirmed ? 'confirmado' : 'criado'} com sucesso!${useManualPrice ? ' (Valor diferenciado aplicado)' : ''}`)
      
      setShowAppointmentModal(false)
      setAppointmentAddress('')
      setAppointmentDate('')
      setAppointmentTime('')
      setIsAppointmentConfirmed(false)
      setDownPaymentAmount('0')
      setPaymentStatus('pending')

      // Limpar todos os campos
      clearFields()

      // Recarregar lista de clientes para incluir o novo (se foi criado)
      loadData()

    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error)
      alert(`Erro ao criar agendamento: ${error.message}`)
    } finally {
      setIsCreatingAppointment(false)
    }
  }

  return (
    <div className="bg-white p-2 sm:p-3 rounded-2xl shadow-xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">
        🧮 Calculadora de Preços
      </h2>
      
      {/* Opção de Valor Manual */}
      <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="useManualPrice"
            checked={useManualPrice}
            onChange={(e) => {
              setUseManualPrice(e.target.checked)
              if (!e.target.checked) {
                setManualPrice('')
              }
            }}
            className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <div className="flex-1">
            <label htmlFor="useManualPrice" className="text-sm font-semibold text-purple-800 cursor-pointer">
              💰 Usar Valor Diferenciado
            </label>
            <p className="text-xs text-purple-600 mt-1">
              Permite definir um valor personalizado para este atendimento, ignorando o cálculo automático dos serviços.
            </p>
          </div>
        </div>
        
        {useManualPrice && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-purple-800 mb-2">
              Valor Total do Atendimento *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">R$</span>
              <NumericInput
                value={manualPrice}
                onChange={setManualPrice}
                decimalPlaces={2}
                formatCurrency={true}
                currency="BRL"
                locale="pt-BR"
                className="w-full pl-12 pr-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {/* Dados do Cliente */}
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              👤 Nome do Cliente *
            </label>
            <input
              list="clients-list"
              type="text"
              value={clientName}
              onChange={(e) => handleClientNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                  <span className="text-2xl font-bold text-green-600">
                    {useManualPrice && manualPrice ? 
                      `R$ ${parseFloat(manualPrice.replace(',', '.')).toFixed(2)}` :
                      `R$ ${(() => {
                        const servicesTotal = calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)
                        const area = areas.find(a => a.id === selectedArea)
                        const hasAnyRegionalPrice = calculatedPrices.services.some(service =>
                          regionalPrices.some(rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea)
                        )
                        const travelFee = includeTravelFee && !hasAnyRegionalPrice && area ? area.travel_fee : 0
                        return (servicesTotal + travelFee).toFixed(2)
                      })()}`
                    }
                  </span>
                </div>
                {useManualPrice && manualPrice && (
                  <div className="mt-2 text-sm text-purple-600">
                    💰 Valor diferenciado aplicado
                  </div>
                )}
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
            <li>• <strong>Valor Diferenciado:</strong> Permite definir um preço personalizado para o atendimento completo</li>
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
              
              {/* Seção de anexar PDFs */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📎 Anexar Documentos (opcional)
                </label>
                
                {availablePdfs.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm text-gray-600 mb-1">Nenhum documento disponível</p>
                    <p className="text-xs text-gray-500">
                      💡 Faça upload de documentos na seção "📄 Gerenciador de Documentos"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availablePdfs.map((pdf) => {
                      const isSelected = selectedPdfForAttachment.includes(pdf.id)
                      return (
                        <div
                          key={pdf.id}
                          className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setSelectedPdfForAttachment(prev =>
                              isSelected
                                ? prev.filter(id => id !== pdf.id)
                                : [...prev, pdf.id]
                            )
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Controlado pelo onClick do container
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  📄 {pdf.name}
                                </span>
                                {isSelected && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                    Selecionado
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                📏 {(pdf.size / 1024 / 1024).toFixed(2)} MB • 
                                � {new Date(pdf.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {selectedPdfForAttachment.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm font-medium text-green-800">
                        {selectedPdfForAttachment.length} documento(s) selecionado(s) para anexar
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem que será enviada:
                </label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
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
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm sm:max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-3 sm:p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-lg sm:text-xl sm:text-2xl">📅</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg sm:text-xl font-bold truncate">
                      {isAppointmentConfirmed ? 'Confirmar' : 'Criar'} Agendamento
                    </h2>
                    <p className="text-blue-100 text-xs sm:text-sm">
                      {clientName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="w-7 h-7 sm:w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 flex-shrink-0"
                >
                  <span className="text-white text-sm sm:text-lg">×</span>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[40vh] sm:max-h-[50vh] overflow-y-auto p-3 sm:p-4 sm:p-6 space-y-3 sm:space-y-4 sm:space-y-5">
              {/* Cliente e Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-2 sm:p-3 sm:p-4 rounded-lg sm:rounded-xl sm:rounded-2xl border border-indigo-100">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                    <span className="mr-1 sm:mr-2">👤</span>
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    readOnly
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl bg-gray-50 text-gray-900 font-medium text-sm sm:text-base"
                  />
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-2 sm:p-3 sm:p-4 rounded-lg sm:rounded-xl sm:rounded-2xl border border-purple-100">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                    <span className="mr-1 sm:mr-2">📱</span>
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    readOnly
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl bg-gray-50 text-gray-900 font-medium text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Serviços do Agendamento */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-2 sm:p-3 sm:p-4 rounded-lg sm:rounded-xl sm:rounded-2xl border border-emerald-100">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                  <span className="mr-1 sm:mr-2">💄</span>
                  Serviços do Agendamento
                </label>

                {useManualPrice && manualPrice ? (
                  <div className="space-y-2">
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-semibold text-purple-900 text-sm">
                            💰 Valor Diferenciado do Atendimento
                          </span>
                          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            Valor Personalizado
                          </span>
                        </div>
                        <span className="font-bold text-purple-600 text-lg">
                          R$ {parseFloat(manualPrice.replace(',', '.')).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : calculatedPrices.services.length > 0 ? (
                  <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                    {calculatedPrices.services.map((service, index) => {
                      const serviceInfo = services.find(s => s.id === service.serviceId)
                      const regionalPrice = regionalPrices.find(
                        rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea
                      )
                      const isRegionalPrice = !!regionalPrice

                      return (
                        <div key={index} className="bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-gray-900 text-xs sm:text-sm">
                                {service.quantity}x {serviceInfo?.name}
                              </span>
                              {isRegionalPrice && (
                                <span className="ml-1 sm:ml-2 px-1 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                  ⭐ Regional
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-green-600 text-xs sm:text-sm ml-2 sm:ml-3">
                              R$ {service.totalPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6 text-gray-500">
                    <div className="text-xl sm:text-2xl mb-1 sm:mb-2">💄</div>
                    <p className="text-xs sm:text-sm">Nenhum serviço selecionado</p>
                  </div>
                )}

                {/* Total dos Serviços */}
                <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-emerald-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 text-xs sm:text-sm">
                      {useManualPrice && manualPrice ? '💰 Valor do Atendimento:' : '💰 Total dos Serviços:'}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-green-600">
                      {useManualPrice && manualPrice ? 
                        `R$ ${parseFloat(manualPrice.replace(',', '.')).toFixed(2)}` :
                        `R$ ${calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0).toFixed(2)}`
                      }
                    </span>
                  </div>
                  {/* Tempo Total do Atendimento */}
                  {!useManualPrice && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-medium text-gray-600 text-xs sm:text-sm">
                        ⏱️ Tempo Estimado:
                      </span>
                      <span className="text-sm sm:text-base font-semibold text-blue-600">
                        {formatDuration(calculatedPrices.services.reduce((total, service) => {
                          const serviceInfo = services.find(s => s.id === service.serviceId)
                          return total + (serviceInfo?.duration_minutes || 60) * service.quantity
                        }, 0))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações de Pagamento */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-2 sm:p-3 sm:p-4 rounded-lg sm:rounded-xl sm:rounded-2xl border border-yellow-100">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                  <span className="mr-1 sm:mr-2">💳</span>
                  Informações de Pagamento
                </label>

                <div className="mb-2 sm:mb-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    💰 Valor da Entrada Paga
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium text-sm">R$</span>
                    <input
                      id="downPaymentAmount"
                      type="number"
                      value={downPaymentAmount}
                      onChange={(e) => setDownPaymentAmount(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200 bg-white text-gray-900 text-sm"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                {/* Status do pagamento calculado */}
                <div className="bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl border border-yellow-200">
                  <div className="text-xs sm:text-sm text-gray-700">
                    <strong>📊 Status calculado:</strong>{' '}
                    <span className="font-medium">
                      {(() => {
                        const totalValue = calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)
                        const downPayment = parseFloat(downPaymentAmount || '0')
                        const pending = totalValue - downPayment

                        if (totalValue === 0) return 'Pago (serviço gratuito)'
                        if (downPayment >= totalValue) return 'Pago (integral)'
                        if (downPayment > 0) return `Parcial (falta R$ ${pending.toFixed(2)})`
                        return 'Pagamento Pendente'
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkbox para confirmar agendamento */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 sm:p-3 sm:p-4 rounded-lg sm:rounded-xl sm:rounded-2xl border border-blue-100">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <input
                    type="checkbox"
                    id="isAppointmentConfirmed"
                    checked={isAppointmentConfirmed}
                    onChange={(e) => setIsAppointmentConfirmed(e.target.checked)}
                    className="mt-0.5 sm:mt-1 h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <label htmlFor="isAppointmentConfirmed" className="text-xs sm:text-sm font-semibold text-gray-700 cursor-pointer">
                      ✅ Confirmar agendamento
                    </label>
                    <p className="text-xs text-gray-600 mt-0.5 sm:mt-1">
                      Requer endereço, data e horário para prosseguir
                    </p>
                  </div>
                </div>
              </div>

              {/* Campos de endereço, data e hora - só aparecem se confirmado */}
              {isAppointmentConfirmed && (
                <>
                  {/* Endereço */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 sm:p-3 sm:p-4 rounded-lg sm:rounded-xl sm:rounded-2xl border border-green-100">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                      <span className="mr-1 sm:mr-2">📍</span>
                      Endereço do Agendamento *
                    </label>
                    <textarea
                      value={appointmentAddress}
                      onChange={(e) => setAppointmentAddress(e.target.value)}
                      rows={2}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white text-gray-900 resize-none text-sm"
                      placeholder="Digite o endereço completo do agendamento"
                    />
                  </div>

                  {/* Data e Horário */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:gap-4">
                    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-2 sm:p-3 sm:p-4 rounded-lg sm:rounded-xl sm:rounded-2xl border border-cyan-100">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                        <span className="mr-1 sm:mr-2">📅</span>
                        Data *
                      </label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white text-gray-900 text-sm"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-2 sm:p-3 sm:p-4 rounded-lg sm:rounded-xl sm:rounded-2xl border border-violet-100">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
                        <span className="mr-1 sm:mr-2">⏰</span>
                        Horário *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={appointmentHour}
                          onChange={(e) => setAppointmentHour(e.target.value)}
                          className="px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200 bg-white text-gray-900 text-sm"
                        >
                          <option value="">Hora</option>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, '0')
                            return (
                              <option key={hour} value={hour}>
                                {hour}
                              </option>
                            )
                          })}
                        </select>
                        <select
                          value={appointmentMinute}
                          onChange={(e) => setAppointmentMinute(e.target.value)}
                          className="px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200 bg-white text-gray-900 text-sm"
                        >
                          <option value="">Min</option>
                          <option value="00">00</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="45">45</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Resumo do Agendamento */}
              <div className={`p-2 sm:p-3 sm:p-4 rounded-lg sm:rounded-xl sm:rounded-2xl border ${isAppointmentConfirmed ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                <h4 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center text-xs sm:text-sm">
                  <span className="mr-1 sm:mr-2">📋</span>
                  Resumo do Agendamento
                </h4>
                <div className={`text-xs sm:text-sm ${isAppointmentConfirmed ? 'text-blue-800' : 'text-orange-800'}`}>
                  <div className="space-y-0.5 sm:space-y-1">
                    <div><strong>💄 Serviços:</strong> {useManualPrice && manualPrice ? 'Valor diferenciado' : `${calculatedPrices.services.length} selecionado(s)`}</div>
                    <div><strong>📍 Local:</strong> {areas.find(a => a.id === selectedArea)?.name}</div>
                    <div><strong>💰 Total:</strong> {useManualPrice && manualPrice ? `R$ ${parseFloat(manualPrice.replace(',', '.')).toFixed(2)}` : `R$ ${calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0).toFixed(2)}`}</div>
                    {!useManualPrice && (
                      <div><strong>⏱️ Tempo Estimado:</strong> {formatDuration(calculatedPrices.services.reduce((total, service) => {
                        const serviceInfo = services.find(s => s.id === service.serviceId)
                        return total + (serviceInfo?.duration_minutes || 60) * service.quantity
                      }, 0))}</div>
                    )}
                    {parseFloat(downPaymentAmount || '0') > 0 && (
                      <>
                        <div><strong>💳 Entrada:</strong> R$ {parseFloat(downPaymentAmount || '0').toFixed(2)}</div>
                        <div><strong>⏳ Pendente:</strong> R$ {(() => {
                          const totalValue = useManualPrice && manualPrice ? parseFloat(manualPrice.replace(',', '.')) : calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)
                          return (totalValue - parseFloat(downPaymentAmount || '0')).toFixed(2)
                        })()}</div>
                      </>
                    )}
                    <div><strong>📊 Status:</strong> {isAppointmentConfirmed ? 'Agendamento Confirmado' : 'Aguardando Confirmação'}</div>
                    {isAppointmentConfirmed && appointmentAddress && (
                      <>
                        <div><strong>🏠 Endereço:</strong> {appointmentAddress}</div>
                        <div><strong>📅 Data:</strong> {appointmentDate ? new Date(appointmentDate).toLocaleDateString('pt-BR') : 'Não definida'}</div>
                        <div><strong>⏰ Horário:</strong> {appointmentTime || 'Não definido'}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-3 sm:px-4 sm:px-6 py-2 sm:py-3 sm:py-4 rounded-b-2xl sm:rounded-b-3xl border-t border-gray-200 flex-shrink-0">
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={() => {
                    setShowAppointmentModal(false)
                    setAppointmentAddress('')
                    setAppointmentDate('')
                    setAppointmentTime('')
                    setAppointmentHour('')
                    setAppointmentMinute('')
                    setIsAppointmentConfirmed(false)
                    setDownPaymentAmount('0')
                    setPaymentStatus('pending')
                  }}
                  className="flex-1 py-2 sm:py-3 px-3 sm:px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 text-xs sm:text-sm"
                >
                  ❌ Cancelar
                </button>
                <button
                  onClick={createAppointment}
                  disabled={isCreatingAppointment}
                  className={`flex-1 py-2 sm:py-3 px-3 sm:px-6 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg text-xs sm:text-sm ${
                    isAppointmentConfirmed
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  }`}
                >
                  {isCreatingAppointment ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Criando...</span>
                    </div>
                  ) : (
                    isAppointmentConfirmed ? '✅ Confirmar Agendamento' : '📝 Criar Agendamento'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Pagamento */}
      {showPaymentConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm sm:max-w-lg w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white p-3 sm:p-4 rounded-t-2xl sm:rounded-t-3xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-lg sm:text-xl">💰</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold truncate">
                      Confirmar Pagamento
                    </h2>
                    <p className="text-green-100 text-xs">
                      Entrada do agendamento
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentConfirmationModal(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 flex-shrink-0 ml-2"
                >
                  <span className="text-white text-sm sm:text-lg">×</span>
                </button>
              </div>
            </div>

            {/* Body - Scrollable */}
            <div className="max-h-[35vh] sm:max-h-[45vh] overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Resumo do Agendamento */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-blue-100">
                <h4 className="font-semibold text-gray-800 mb-1 sm:mb-2 flex items-center text-xs sm:text-sm">
                  <span className="mr-1 sm:mr-2">📋</span>
                  Resumo do Agendamento
                </h4>
                <div className="text-xs text-blue-800 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">👤 Cliente:</span>
                    <span className="truncate ml-1 text-xs">{clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">💰 Total:</span>
                    <span className="font-semibold text-sm">
                      {useManualPrice && manualPrice ? 
                        `R$ ${parseFloat(manualPrice.replace(',', '.')).toFixed(2)}` :
                        `R$ ${(() => {
                          const servicesTotal = calculatedPrices.services.reduce((sum, service) => sum + service.totalPrice, 0)
                          const area = areas.find(a => a.id === selectedArea)
                          const hasAnyRegionalPrice = calculatedPrices.services.some(service =>
                            regionalPrices.some(rp => rp.service_id === service.serviceId && rp.service_area_id === selectedArea)
                          )
                          const travelFee = includeTravelFee && !hasAnyRegionalPrice && area ? area.travel_fee : 0
                          return (servicesTotal + travelFee).toFixed(2)
                        })()}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">💳 Entrada:</span>
                    <span className="font-semibold text-green-600 text-sm">R$ {parseFloat(downPaymentAmount || '0').toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">📅 Data:</span>
                    <span className="truncate ml-1 text-xs">{appointmentDate ? new Date(appointmentDate).toLocaleDateString('pt-BR') : 'Não definida'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">⏰ Horário:</span>
                    <span className="truncate ml-1 text-xs">{appointmentTime || 'Não definido'}</span>
                  </div>
                </div>
              </div>

              {/* Confirmação da Entrada */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-yellow-100">
                <h4 className="font-semibold text-yellow-800 mb-1 sm:mb-2 flex items-center text-xs sm:text-sm">
                  <span className="mr-1 sm:mr-2">💰</span>
                  Confirmação da Entrada
                </h4>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-800 mb-1">
                    R$ {parseFloat(downPaymentAmount || '0').toFixed(2)}
                  </div>
                  <p className="text-xs text-yellow-700">
                    Este valor da entrada realmente foi pago pelo cliente?
                  </p>
                </div>
              </div>

              {/* Aviso Importante */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-red-100">
                <div className="flex items-start space-x-1 sm:space-x-2">
                  <span className="text-red-500 text-base sm:text-lg flex-shrink-0">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1 text-xs sm:text-sm">Importante</h4>
                    <p className="text-xs text-red-700">
                      Ao confirmar, o agendamento será marcado como "Confirmado" e não poderá ser alterado. Certifique-se de que o pagamento foi realmente recebido.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 rounded-b-2xl sm:rounded-b-3xl border-t border-gray-200 flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowPaymentConfirmationModal(false)
                    // Focar no campo de entrada após um pequeno delay
                    setTimeout(() => {
                      const input = document.getElementById('downPaymentAmount') as HTMLInputElement
                      if (input) {
                        input.focus()
                        input.select()
                      }
                    }, 100)
                  }}
                  className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg text-xs sm:text-sm"
                >
                  ✏️ Ajustar Valor
                </button>
                <button
                  onClick={() => {
                    setShowPaymentConfirmationModal(false)
                    createAppointmentConfirmed()
                  }}
                  className="w-full py-2 px-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg text-xs sm:text-sm"
                >
                  ✅ Sim, foi pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de seleção de PDFs */}
      {showPdfSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Selecionar Documentos para Anexar</h3>

            {/* Campo de pesquisa */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="🔍 Pesquisar documentos por nome..."
                value={pdfSearchTerm}
                onChange={(e) => setPdfSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Contador de seleção */}
            <div className="mb-4 text-sm text-gray-600">
              {selectedPdfForAttachment.length} documento{selectedPdfForAttachment.length !== 1 ? 's' : ''} selecionado{selectedPdfForAttachment.length !== 1 ? 's' : ''}
            </div>

            {/* Lista de PDFs */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {filteredPdfs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {availablePdfs.length === 0 ? (
                    <>
                      <div className="text-4xl mb-2">📄</div>
                      Nenhum documento encontrado
                      <br />
                      <span className="text-sm">Faça upload de PDFs primeiro</span>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">🔍</div>
                      Nenhum documento encontrado para "{pdfSearchTerm}"
                    </>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredPdfs.map((pdf) => {
                    const isSelected = selectedPdfForAttachment.includes(pdf.id)
                    return (
                      <div
                        key={pdf.id}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPdfForAttachment(prev => prev.filter(id => id !== pdf.id))
                          } else {
                            setSelectedPdfForAttachment(prev => [...prev, pdf.id])
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Controlled by onClick
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              📄 {pdf.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              📏 {(pdf.size / 1024 / 1024).toFixed(2)} MB • 📅 {new Date(pdf.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowPdfSelector(false)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar ({selectedPdfForAttachment.length})
              </button>
              <button
                onClick={() => {
                  setShowPdfSelector(false)
                  setSelectedPdfForAttachment([])
                  setPdfSearchTerm('')
                }}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
