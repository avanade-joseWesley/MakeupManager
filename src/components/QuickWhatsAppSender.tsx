import React, { useState } from 'react'
import { WhatsAppButton, useWhatsAppMessage } from './WhatsAppButton'

interface QuickWhatsAppSenderProps {
  className?: string
}

export function QuickWhatsAppSender({ className = '' }: QuickWhatsAppSenderProps) {
  const [clientName, setClientName] = useState('')
  const [service, setService] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('A combinar')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  
  const { generateAppointmentMessage } = useWhatsAppMessage()

  const generateMessage = () => {
    if (!clientName || !service) {
      return 'Preencha pelo menos o nome da cliente e o serviço para gerar a mensagem.'
    }

    return generateAppointmentMessage({
      clientName,
      service,
      date: date || new Date().toLocaleDateString('pt-BR'),
      time: time || 'A combinar',
      location,
      price: price ? parseFloat(price) : undefined,
      notes
    })
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 space-y-4 ${className}`}>
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        📱 Enviar Agendamento por WhatsApp
      </h3>

      {/* Formulário rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            👤 Nome da Cliente *
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Ex: Maria Silva"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            💄 Serviço *
          </label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="">Selecione o serviço</option>
            <option value="Maquiagem Social">Maquiagem Social</option>
            <option value="Maquiagem para Casamento">Maquiagem para Casamento</option>
            <option value="Maquiagem para Formatura">Maquiagem para Formatura</option>
            <option value="Maquiagem + Penteado">Maquiagem + Penteado</option>
            <option value="Maquiagem Artística">Maquiagem Artística</option>
            <option value="Limpeza de Pele">Limpeza de Pele</option>
            <option value="Extensão de Cílios">Extensão de Cílios</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            📅 Data
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            ⏰ Horário
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            📍 Local
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Salão Beleza Total"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            💰 Valor (R$)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="150.00"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          📝 Observações
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Trazer extensões próprias, maquiagem natural..."
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Componente WhatsApp */}
      <WhatsAppButton
        message={generateMessage()}
        allowCustomNumber={true}
        className="w-full mt-4"
      >
        📤 Enviar Agendamento por WhatsApp
      </WhatsAppButton>
    </div>
  )
}