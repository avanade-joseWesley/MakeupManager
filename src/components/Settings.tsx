import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface SettingsProps {
  user: any
  onBack: () => void
}

interface UserProfile {
  id: string
  full_name: string
  phone: string
  bio: string
  address: string
  instagram: string
  experience_years: number
}

interface ServiceArea {
  id: string
  name: string
  description: string
  travel_fee: number
}

interface ServiceCategory {
  id: string
  name: string
  description: string
  services: Service[]
}

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration_minutes: number
  category_id: string
}

interface ServiceRegionalPrice {
  id: string
  service_id: string
  service_area_id: string
  price: number
}

export function Settings({ user, onBack }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'areas' | 'services' | 'regional-prices'>('profile')
  const [loading, setLoading] = useState(false)
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    id: user.id,
    full_name: '',
    phone: '',
    bio: '',
    address: '',
    instagram: '',
    experience_years: 0
  })

  // Service areas state
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([])
  const [newArea, setNewArea] = useState<Omit<ServiceArea, 'id'>>({
    name: '',
    description: '',
    travel_fee: 0
  })

  // Services state
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: 0,
    duration_minutes: 60,
    category_id: ''
  })

  // Regional prices state
  const [regionalPrices, setRegionalPrices] = useState<ServiceRegionalPrice[]>([])
  const [selectedService, setSelectedService] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [regionalPrice, setRegionalPrice] = useState(0)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setLoading(true)
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      // Load service areas
      const { data: areasData } = await supabase
        .from('service_areas')
        .select('*')
        .eq('user_id', user.id)

      if (areasData) {
        setServiceAreas(areasData)
      }

      // Load categories and services
      const { data: categoriesData } = await supabase
        .from('service_categories')
        .select(`
          *,
          services (*)
        `)
        .eq('user_id', user.id)

      if (categoriesData) {
        setCategories(categoriesData)
      }

      // Load regional prices
      const { data: regionalPricesData } = await supabase
        .from('service_regional_prices')
        .select('*')
        .eq('user_id', user.id)

      if (regionalPricesData) {
        setRegionalPrices(regionalPricesData)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(profile)

      if (error) throw error
      alert('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Erro ao salvar perfil')
    } finally {
      setLoading(false)
    }
  }

  const addServiceArea = async () => {
    if (!newArea.name) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('service_areas')
        .insert([{ ...newArea, user_id: user.id }])

      if (error) throw error
      
      setNewArea({ name: '', description: '', travel_fee: 0 })
      loadUserData()
    } catch (error) {
      console.error('Error adding service area:', error)
      alert('Erro ao adicionar região')
    } finally {
      setLoading(false)
    }
  }

  const removeServiceArea = async (id: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('service_areas')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadUserData()
    } catch (error) {
      console.error('Error removing service area:', error)
      alert('Erro ao remover região')
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async () => {
    if (!newCategory.name) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('service_categories')
        .insert([{ ...newCategory, user_id: user.id }])

      if (error) throw error
      
      setNewCategory({ name: '', description: '' })
      loadUserData()
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Erro ao adicionar categoria')
    } finally {
      setLoading(false)
    }
  }

  const addService = async () => {
    if (!newService.name || !newService.category_id) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('services')
        .insert([{ ...newService, user_id: user.id }])

      if (error) throw error
      
      setNewService({
        name: '',
        description: '',
        price: 0,
        duration_minutes: 60,
        category_id: ''
      })
      loadUserData()
    } catch (error) {
      console.error('Error adding service:', error)
      alert('Erro ao adicionar serviço')
    } finally {
      setLoading(false)
    }
  }

  const addRegionalPrice = async () => {
    if (!selectedService || !selectedArea || regionalPrice <= 0) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('service_regional_prices')
        .upsert([{
          user_id: user.id,
          service_id: selectedService,
          service_area_id: selectedArea,
          price: regionalPrice
        }])

      if (error) throw error
      
      setSelectedService('')
      setSelectedArea('')
      setRegionalPrice(0)
      loadUserData()
    } catch (error) {
      console.error('Error adding regional price:', error)
      alert('Erro ao adicionar preço regional')
    } finally {
      setLoading(false)
    }
  }

  const removeRegionalPrice = async (id: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('service_regional_prices')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadUserData()
    } catch (error) {
      console.error('Error removing regional price:', error)
      alert('Erro ao remover preço regional')
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const getServiceName = (serviceId: string) => {
    for (const category of categories) {
      const service = category.services?.find(s => s.id === serviceId)
      if (service) return service.name
    }
    return 'Serviço não encontrado'
  }

  const getAreaName = (areaId: string) => {
    const area = serviceAreas.find(a => a.id === areaId)
    return area?.name || 'Região não encontrada'
  }

  const getAllServices = () => {
    const allServices: Service[] = []
    categories.forEach(category => {
      if (category.services) {
        allServices.push(...category.services)
      }
    })
    return allServices
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar
            </button>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
              ⚙️ Configurações
            </h1>
            <div></div>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              👤 Perfil
            </button>
            <button
              onClick={() => setActiveTab('areas')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'areas'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📍 Regiões
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'services'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              💄 Serviços
            </button>
            <button
              onClick={() => setActiveTab('regional-prices')}
              className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'regional-prices'
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              💰 Preços
            </button>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              👤 Informações Pessoais
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone/WhatsApp
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="11987654321"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio/Apresentação
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                placeholder="Conte um pouco sobre você e sua experiência..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço Base
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram
              </label>
              <input
                type="text"
                value={profile.instagram}
                onChange={(e) => setProfile({...profile, instagram: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="@seuinstagram"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anos de Experiência
              </label>
              <input
                type="number"
                value={profile.experience_years}
                onChange={(e) => setProfile({...profile, experience_years: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : '💾 Salvar Perfil'}
            </button>
          </div>
        )}

        {/* Service Areas Tab */}
        {activeTab === 'areas' && (
          <div className="space-y-4">
            {/* Add New Area */}
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📍 Adicionar Nova Região
              </h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={newArea.name}
                  onChange={(e) => setNewArea({...newArea, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Nome da região (ex: Centro, Vila Madalena)"
                />
                
                <input
                  type="text"
                  value={newArea.description}
                  onChange={(e) => setNewArea({...newArea, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Descrição (opcional)"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa de Deslocamento (R$)
                  </label>
                  <input
                    type="number"
                    value={newArea.travel_fee}
                    onChange={(e) => setNewArea({...newArea, travel_fee: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <button
                  onClick={addServiceArea}
                  disabled={loading || !newArea.name}
                  className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adicionando...' : '➕ Adicionar Região'}
                </button>
              </div>
            </div>

            {/* Existing Areas */}
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📋 Regiões Cadastradas
              </h2>
              
              {serviceAreas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma região cadastrada ainda
                </p>
              ) : (
                <div className="space-y-3">
                  {serviceAreas.map((area) => (
                    <div key={area.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">{area.name}</div>
                        {area.description && (
                          <div className="text-sm text-gray-600">{area.description}</div>
                        )}
                        <div className="text-sm text-green-600">
                          Taxa: R$ {area.travel_fee.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeServiceArea(area.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {/* Add New Category */}
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📂 Adicionar Categoria
              </h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Nome da categoria (ex: Noivas, Social, Artística)"
                />
                
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Descrição (opcional)"
                />

                <button
                  onClick={addCategory}
                  disabled={loading || !newCategory.name}
                  className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adicionando...' : '📂 Adicionar Categoria'}
                </button>
              </div>
            </div>

            {/* Add New Service */}
            {categories.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  💄 Adicionar Serviço
                </h2>
                
                <div className="space-y-4">
                  <select
                    value={newService.category_id}
                    onChange={(e) => setNewService({...newService, category_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService({...newService, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Nome do serviço"
                  />
                  
                  <input
                    type="text"
                    value={newService.description}
                    onChange={(e) => setNewService({...newService, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Descrição (opcional)"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preço (R$)
                      </label>
                      <input
                        type="number"
                        value={newService.price}
                        onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duração (min)
                      </label>
                      <input
                        type="number"
                        value={newService.duration_minutes}
                        onChange={(e) => setNewService({...newService, duration_minutes: parseInt(e.target.value) || 60})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="60"
                        min="15"
                        step="15"
                      />
                    </div>
                  </div>

                  <button
                    onClick={addService}
                    disabled={loading || !newService.name || !newService.category_id}
                    className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adicionando...' : '➕ Adicionar Serviço'}
                  </button>
                </div>
              </div>
            )}

            {/* Categories and Services List */}
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📋 Serviços Cadastrados
              </h2>
              
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhuma categoria cadastrada ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="font-semibold text-gray-800 mb-2">
                        📂 {category.name}
                      </div>
                      {category.description && (
                        <div className="text-sm text-gray-600 mb-3">{category.description}</div>
                      )}
                      
                      {category.services && category.services.length > 0 ? (
                        <div className="space-y-2">
                          {category.services.map((service) => (
                            <div key={service.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <div className="font-medium text-gray-800">{service.name}</div>
                                <div className="text-sm text-gray-600">
                                  R$ {service.price.toFixed(2)} • {service.duration_minutes}min
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          Nenhum serviço nesta categoria
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regional Prices Tab */}
        {activeTab === 'regional-prices' && (
          <div className="space-y-4">
            {/* Add New Regional Price */}
            {getAllServices().length > 0 && serviceAreas.length > 0 && (
              <div className="bg-white p-6 rounded-2xl shadow-xl">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  💰 Definir Preço por Região
                </h2>
                
                <div className="space-y-4">
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
                      {categories.map((category) => (
                        <optgroup key={category.id} label={category.name}>
                          {category.services?.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} (Padrão: R$ {service.price.toFixed(2)})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Região
                    </label>
                    <select
                      value={selectedArea}
                      onChange={(e) => setSelectedArea(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma região</option>
                      {serviceAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name} (Taxa: R$ {area.travel_fee.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço Especial (R$)
                    </label>
                    <input
                      type="number"
                      value={regionalPrice}
                      onChange={(e) => setRegionalPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <button
                    onClick={addRegionalPrice}
                    disabled={loading || !selectedService || !selectedArea || regionalPrice <= 0}
                    className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : '💰 Definir Preço Regional'}
                  </button>
                </div>
              </div>
            )}

            {/* Existing Regional Prices */}
            <div className="bg-white p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📋 Preços por Região
              </h2>
              
              {regionalPrices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Nenhum preço regional definido ainda
                  </p>
                  {(getAllServices().length === 0 || serviceAreas.length === 0) && (
                    <p className="text-sm text-gray-400">
                      {getAllServices().length === 0 && "Cadastre serviços primeiro"}
                      {getAllServices().length === 0 && serviceAreas.length === 0 && " e "}
                      {serviceAreas.length === 0 && "Cadastre regiões primeiro"}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {regionalPrices.map((regionalPrice) => (
                    <div key={regionalPrice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">
                          {getServiceName(regionalPrice.service_id)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Região: {getAreaName(regionalPrice.service_area_id)}
                        </div>
                        <div className="text-lg font-semibold text-green-600">
                          R$ {regionalPrice.price.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeRegionalPrice(regionalPrice.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}