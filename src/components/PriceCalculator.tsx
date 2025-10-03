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

    // REGRA DE NEGÓCIO: Usar preço regional se existir, senão usar preço padrão
    // Não adicionar taxa de deslocamento - o preço regional JÁ INCLUI tudo
    const finalPrice = regionalPrice ? regionalPrice.price : service.price

    setCalculatedPrice(finalPrice)
    setTotalWithTravel(finalPrice) // Mesmo valor, sem taxa adicional
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
                {area.name}
              </option>
            ))}
          </select>
        </div>

        {/* Resultado do Cálculo */}
        {selectedService && selectedArea && (
          <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">💰 Orçamento Final</h3>
            
            <div className="space-y-3">
              {/* Mostrar preço padrão vs regional */}
              {(() => {
                const service = services.find(s => s.id === selectedService)
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
                          <span className="text-blue-600 font-medium">Preço para {areas.find(a => a.id === selectedArea)?.name}:</span>
                          <span className="font-medium text-blue-600">R$ {regionalPrice.price.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Preço do serviço:</span>
                        <span className="font-medium">R$ {service?.price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )
              })()}
              
              <hr className="my-3" />
              
              <div className="flex justify-between text-xl font-bold">
                <span className="text-gray-800">Total:</span>
                <span className="text-green-600">R$ {calculatedPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Indicador de Preço Regional */}
            {regionalPrices.some(rp => rp.service_id === selectedService && rp.service_area_id === selectedArea) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>⭐ Preço regional aplicado!</strong>
                  <br />
                  Este serviço tem preço especial para a região selecionada.
                </div>
              </div>
            )}
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