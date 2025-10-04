import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { WhatsAppButton } from './WhatsAppButton'
import { Settings } from './Settings'
import { PriceCalculator } from './PriceCalculator'
import ClientsPage from './ClientsPage'

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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Voltar
              </button>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                🧮 Calculadora
              </h1>
              <div></div>
            </div>
          </div>
          <PriceCalculator user={user} />
        </div>
      </div>
    )
  }

  if (currentView === 'clients') {
    return <ClientsPage onBack={() => setCurrentView('dashboard')} user={user} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                💄 Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Bem-vinda, {user?.email?.split('@')[0]}!
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('calculator')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
              >
                🧮 Calc
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-pink-600 transition-colors"
              >
                ⚙️ Config
              </button>
              <button
                onClick={() => setCurrentView('clients')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                👥 Clientes
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                🚪 Sair
              </button>
            </div>
          </div>
        </div>

        {/* Cards de Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm text-gray-600">Hoje</div>
              <div className="text-xl font-bold text-pink-600">3</div>
              <div className="text-xs text-gray-500">agendamentos</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="text-center">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-sm text-gray-600">Receita</div>
              <div className="text-xl font-bold text-green-600">R$ 450</div>
              <div className="text-xs text-gray-500">prevista hoje</div>
            </div>
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
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Próximos Agendamentos
          </h2>
          
          <div className="space-y-3">
            <div className="border-l-4 border-pink-500 pl-4 py-2">
              <div className="font-medium text-gray-800">Maria Silva</div>
              <div className="text-sm text-gray-600">Maquiagem para Casamento</div>
              <div className="text-xs text-gray-500">Hoje, 14:30 • R$ 200,00</div>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <div className="font-medium text-gray-800">Ana Costa</div>
              <div className="text-sm text-gray-600">Maquiagem Social</div>
              <div className="text-xs text-gray-500">Hoje, 16:00 • R$ 150,00</div>
            </div>
            
            <div className="border-l-4 border-pink-400 pl-4 py-2">
              <div className="font-medium text-gray-800">Julia Santos</div>
              <div className="text-sm text-gray-600">Maquiagem + Penteado</div>
              <div className="text-xs text-gray-500">Hoje, 18:30 • R$ 100,00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}