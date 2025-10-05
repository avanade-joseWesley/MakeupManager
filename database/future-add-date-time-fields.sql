-- FUTURO: Adicionar campos de data/hora no modal
-- Quando quiser implementar agendamento com data/hora específica

-- Adicionar campos no modal de agendamento:
-- scheduledDate: useState('')
-- scheduledTime: useState('')

-- No modal, adicionar:
{/*
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    📅 Data do Agendamento
  </label>
  <input
    type="date"
    value={scheduledDate}
    onChange={(e) => setScheduledDate(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    🕐 Horário do Agendamento
  </label>
  <input
    type="time"
    value={scheduledTime}
    onChange={(e) => setScheduledTime(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
</div>
*/}

-- E na função createAppointment, usar:
-- scheduled_date: scheduledDate || null,
-- scheduled_time: scheduledTime || null,