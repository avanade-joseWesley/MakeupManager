import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { WhatsAppButton } from './WhatsAppButton'
import { Settings } from './Settings'
import { PriceCalculator } from './PriceCalculator'
import ClientsPage from './ClientsPage'
import { Container } from './Container'

interface DashboardProps {
  user: any
  onLogout: () => void
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings' | 'calculator' | 'clients'>('dashboard')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const generateAppointmentMessage = (data: {
    clientName: string
    service: string
    date: string
    time: string
    location?: string
    price?: number
    notes?: string
  }) => {
    return `*🎨 AGENDAMENTO CONFIRMADO*

👤 *Cliente:* ${data.clientName}
💄 *Serviço:* ${data.service}
📅 *Data:* ${data.date}
⏰ *Horário:* ${data.time}
📍 *Local:* ${data.location || 'A combinar'}
💰 *Valor:* R$ ${data.price?.toFixed(2) || 'A combinar'}

${data.notes ? `📝 *Observações:* ${data.notes}` : ''}

✨ _Enviado via MakeUp Manager_`
  }

  if (currentView === 'settings') {
    return <Settings user={user} onBack={() => setCurrentView('dashboard')} />
  }

  if (currentView === 'calculator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-4">
        <Container className="space-y-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="text-green-100 hover:text-white transition-colors"
              >
                ← Voltar
              </button>
              <h1 className="text-xl font-bold">
                🧮 Calculadora
              </h1>
              <div></div>
            </div>
          </div>
          <PriceCalculator user={user} onNavigateToClients={() => setCurrentView('clients')} />
        </Container>
      </div>
    )
  }

  if (currentView === 'clients') {
    return <ClientsPage onBack={() => setCurrentView('dashboard')} user={user} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-4">
      <Container className="space-y-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-2xl shadow-xl mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">
                💄 Dashboard
              </h1>
              <p className="text-pink-100 text-sm">
                Bem-vinda, {user?.email?.split('@')[0]}!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-pink-100 hover:text-white transition-colors"
            >
              🚪
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => setCurrentView('calculator')}
            className="bg-gradient-to-br from-green-400 to-green-600 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">🧮</div>
            <div className="text-xs font-semibold">Calculadora</div>
          </button>
          <button
            onClick={() => setCurrentView('clients')}
            className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">👥</div>
            <div className="text-xs font-semibold">Clientes</div>
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            <div className="text-2xl mb-1">⚙️</div>
            <div className="text-xs font-semibold">Config</div>
          </button>
        </div>

        {/* Cards de Status */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-pink-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 font-medium">Hoje</div>
                <div className="text-2xl font-bold text-pink-600">3</div>
                <div className="text-xs text-gray-500">agendamentos</div>
              </div>
              <div className="text-3xl opacity-60">📅</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 font-medium">Receita</div>
                <div className="text-xl font-bold text-green-600">R$ 450</div>
                <div className="text-xs text-gray-500">prevista hoje</div>
              </div>
              <div className="text-3xl opacity-60">💰</div>
            </div>
          </div>
        </div>

        {/* Status Cards Adicionais */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-3 rounded-lg text-center">
            <div className="text-lg font-bold">2</div>
            <div className="text-xs opacity-90">Pendentes</div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-3 rounded-lg text-center">
            <div className="text-lg font-bold">R$ 125</div>
            <div className="text-xs opacity-90">Créditos</div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 text-white p-3 rounded-lg text-center">
            <div className="text-lg font-bold">12</div>
            <div className="text-xs opacity-90">Este mês</div>
          </div>
        </div>

        {/* WhatsApp - Envio Rápido */}
        {/* <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            📱 Enviar WhatsApp
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📞 Número do Cliente
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="11987654321"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                💬 Mensagem
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="space-y-2">
              <WhatsAppButton
                phoneNumber={phoneNumber}
                message={message}
                className="w-full"
              >
                📤 Enviar Mensagem
              </WhatsAppButton>

              <button
                onClick={() => {
                  setMessage(generateAppointmentMessage({
                    clientName: 'Cliente',
                    service: 'Maquiagem Profissional',
                    date: new Date().toLocaleDateString('pt-BR'),
                    time: '14:30',
                    location: 'A combinar',
                    price: 150.00,
                    notes: 'Agendamento confirmado'
                  }))
                }}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                📝 Usar Template de Agendamento
              </button>
            </div>
          </div>
        </div> */}

        {/* Próximos Agendamentos */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4">
            <h2 className="text-lg font-semibold flex items-center">
              📋 Próximos Agendamentos
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100">
            <div className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">Maria Silva</div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Confirmado</span>
                  <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">💒 Maquiagem para Casamento</div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>🕐 Hoje, 14:30</span>
                <span className="font-semibold text-green-600">R$ 200,00</span>
              </div>
            </div>
            
            <div className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">Ana Costa</div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Pendente</span>
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">✨ Maquiagem Social</div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>🕐 Hoje, 16:00</span>
                <span className="font-semibold text-green-600">R$ 150,00</span>
              </div>
            </div>
            
            <div className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">Julia Santos</div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">Crédito</span>
                  <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-1">💅 Maquiagem + Penteado</div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>🕐 Hoje, 18:30</span>
                <span className="font-semibold text-green-600">R$ 100,00</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 border-t">
            <button className="w-full py-2 text-sm text-pink-600 font-semibold hover:text-pink-700 transition-colors">
              Ver todos os agendamentos →
            </button>
          </div>
        </div>
      </Container>
    </div>
  )
}