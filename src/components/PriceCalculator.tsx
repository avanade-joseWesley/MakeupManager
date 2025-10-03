import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

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
  }, [selectedService, selectedArea, services, areas, regionalPrices])

  const calculatePrice = () => {
    if (!selectedService || !selectedArea) {
      setCalculatedPrice(0)
      setTotalWithTravel(0)
      return
    }

    // Buscar o serviço selecionado
    const service = services.find(s => s.id === selectedService)
    if (!service) return

    // Buscar preço regional específico
    const regionalPrice = regionalPrices.find(
      rp => rp.service_id === selectedService && rp.service_area_id === selectedArea
    )

    // Usar preço regional se existir, senão usar preço padrão
    const servicePrice = regionalPrice ? regionalPrice.price : service.price

    // Buscar taxa de deslocamento da região
    const area = areas.find(a => a.id === selectedArea)
    const travelFee = area ? area.travel_fee : 0

    setCalculatedPrice(servicePrice)
    setTotalWithTravel(servicePrice + travelFee)
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        🧮 Calculadora de Preços
      </h2>
      
      <div className="space-y-4">
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
                {area.name} (Taxa: R$ {area.travel_fee.toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        {/* Resultado do Cálculo */}
        {selectedService && selectedArea && (
          <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">💰 Resultado do Orçamento</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Serviço:</span>
                <span className="font-medium">R$ {calculatedPrice.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa de Deslocamento:</span>
                <span className="font-medium">R$ {(totalWithTravel - calculatedPrice).toFixed(2)}</span>
              </div>
              
              <hr className="my-2" />
              
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-800">Total:</span>
                <span className="text-green-600">R$ {totalWithTravel.toFixed(2)}</span>
              </div>
            </div>

            {/* Indicador de Preço Regional */}
            {regionalPrices.some(rp => rp.service_id === selectedService && rp.service_area_id === selectedArea) && (
              <div className="mt-3 text-sm text-blue-600">
                ⭐ Preço especial para esta região aplicado!
              </div>
            )}
          </div>
        )}

        {/* Explicação */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">📝 Como funciona:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Preço do Serviço:</strong> Usa preço regional se cadastrado, senão usa preço padrão</li>
            <li>• <strong>Taxa de Deslocamento:</strong> Valor fixo por região para cobrir transporte</li>
            <li>• <strong>Total:</strong> Soma do serviço + taxa de deslocamento</li>
          </ul>
        </div>
      </div>
    </div>
  )
}