import React, { useState, useEffect } from 'react'
import { supabase, formatDuration, formatDate, formatDateTime } from '../lib/supabase'
import { Container } from './Container'

interface CalendarPageProps {
  user: any
  onBack: () => void
}

interface CalendarAppointment {
  id: string
  scheduled_date: string
  scheduled_time: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  clients: any
  appointment_services: any[]
  total_duration_minutes: number | null
  payment_total_service: number | null
  payment_down_payment_paid: number | null
  payment_down_payment_expected: number | null
}

export default function CalendarPage({ user, onBack }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<CalendarAppointment[]>([])
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month')
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())
  const [editingAppointment, setEditingAppointment] = useState<string | null>(null)
  const [editTotalValue, setEditTotalValue] = useState<string>('')
  const [editDownPayment, setEditDownPayment] = useState<string>('')

  // Carregar agendamentos do mês atual
  useEffect(() => {
    loadMonthAppointments()
  }, [currentDate, user])

  const loadMonthAppointments = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // Calcular primeiro e último dia do mês
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          status,
          total_duration_minutes,
          payment_total_service,
          payment_down_payment_paid,
          payment_down_payment_expected,
          clients!inner (
            name,
            phone
          ),
          appointment_services (
            services (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('scheduled_date', firstDay.toLocaleDateString('sv-SE'))
        .lte('scheduled_date', lastDay.toLocaleDateString('sv-SE'))
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })

      if (error) throw error

      setAppointments(data || [])
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Navegação entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  // Ir para mês atual
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Navegação entre dias (para visualização diária)
  const navigateDay = (direction: 'prev' | 'next') => {
    setSelectedDay(prev => {
      if (!prev) return new Date()
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1)
      } else {
        newDate.setDate(newDate.getDate() + 1)
      }
      return newDate
    })
  }

  // Selecionar dia para visualização diária
  const selectDayForView = (date: Date) => {
    setSelectedDay(date)
    setViewMode('day')
  }

  // Gerar dias do mês para o grid
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Começar no domingo

    const days = []
    const current = new Date(startDate)

    // Gerar 42 dias (6 semanas x 7 dias)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  // Obter agendamentos de um dia específico
  const getDayAppointments = (date: Date) => {
    const dateStr = date.toLocaleDateString('sv-SE')
    return appointments.filter(apt => apt.scheduled_date === dateStr)
  }

  // Cores por status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Gerar horas do dia para timeline (0h às 23h)
  const generateDayHours = () => {
    const hours = []
    for (let i = 0; i <= 23; i++) {
      hours.push(i)
    }
    return hours
  }

  // Obter agendamentos de uma hora específica
  const getHourAppointments = (date: Date, hour: number) => {
    const dateStr = date.toLocaleDateString('sv-SE')
    return appointments.filter(apt => {
      if (apt.scheduled_date !== dateStr || !apt.scheduled_time) return false
      
      const [hours] = apt.scheduled_time.split(':').map(Number)
      return hours === hour
    })
  }

  // Abrir modal com detalhes do dia
  const openDayDetails = (date: Date) => {
    const dayAppointments = getDayAppointments(date)
    setSelectedDate(date)
    setSelectedDateAppointments(dayAppointments)
  }

  // Iniciar edição de valores de pagamento
  const startEditingPayment = (appointment: CalendarAppointment) => {
    if (appointment.status === 'cancelled') {
      alert('Não é possível editar valores de agendamentos cancelados.')
      return
    }
    setEditingAppointment(appointment.id)
    setEditTotalValue(appointment.payment_total_service?.toString() || '0')
    setEditDownPayment(appointment.payment_down_payment_expected?.toString() || '0')
  }

  // Salvar alterações dos valores
  const savePaymentChanges = async (appointmentId: string) => {
    try {
      const totalValue = parseFloat(editTotalValue) || 0
      const downPayment = parseFloat(editDownPayment) || 0

      const { error } = await supabase
        .from('appointments')
        .update({
          payment_total_service: totalValue,
          payment_down_payment_expected: downPayment,
          last_edited_at: new Date().toISOString(),
          edited_by: user?.id
        })
        .eq('id', appointmentId)
        .eq('user_id', user?.id)

      if (error) throw error

      // Recarregar agendamentos
      await loadMonthAppointments()

      // Fechar modo de edição
      setEditingAppointment(null)
      setEditTotalValue('')
      setEditDownPayment('')

      alert('Valores atualizados com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar alterações:', error)
      alert('Erro ao salvar alterações. Tente novamente.')
    }
  }

  // Cancelar edição
  const cancelEditing = () => {
    setEditingAppointment(null)
    setEditTotalValue('')
    setEditDownPayment('')
  }

  const calendarDays = generateCalendarDays()
  const dayHours = generateDayHours()

  return (
    <Container>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>←</span>
            <span className="hidden sm:inline">Voltar</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📅 Calendário</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
          <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 Mês
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🕐 Dia
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm font-medium"
          >
            Hoje
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-2 sm:py-4">
          <Container className="space-y-3 sm:space-y-4">
            {/* Navegação do mês */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg group"
              >
                <span className="text-2xl group-hover:text-pink-600 transition-colors">‹</span>
              </button>

              <h2 className="text-lg sm:text-xl font-bold text-gray-800 text-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {formatDate(currentDate, { month: 'long', year: 'numeric' })}
              </h2>

              <button
                onClick={() => navigateMonth('next')}
                className="p-3 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg group"
              >
                <span className="text-2xl group-hover:text-pink-600 transition-colors">›</span>
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-600">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                </div>
              ))}
            </div>

            {/* Grid do calendário */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 bg-white rounded-2xl border border-gray-200 p-2 sm:p-3 shadow-xl overflow-hidden">
              {calendarDays.map((date, index) => {
                const dayAppointments = getDayAppointments(date)
                const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                const isToday = date.toDateString() === new Date().toDateString()
                const hasAppointments = dayAppointments.length > 0

                return (
                  <div
                    key={index}
                    onClick={() => selectDayForView(date)}
                    className={`
                      min-h-[90px] sm:min-h-[120px] p-2 sm:p-3 border border-gray-200 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg relative overflow-hidden
                      ${!isCurrentMonth ? 'bg-gray-50 text-gray-400 opacity-60' : 'bg-gradient-to-br from-white to-gray-50'}
                      ${isToday ? 'ring-2 ring-pink-400 ring-inset shadow-pink-200 shadow-lg bg-gradient-to-br from-pink-50 to-purple-50' : ''}
                      ${hasAppointments ? 'hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50' : 'hover:bg-gradient-to-br hover:from-gray-100 hover:to-white'}
                    `}
                  >
                    {/* Indicador de hoje */}
                    {isToday && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                    )}

                    {/* Indicador de agendamentos */}
                    {hasAppointments && (
                      <div className="absolute top-1 left-1 flex space-x-0.5">
                        {dayAppointments.slice(0, 3).map((apt, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              apt.status === 'confirmed' ? 'bg-green-500' :
                              apt.status === 'pending' ? 'bg-yellow-500' :
                              apt.status === 'completed' ? 'bg-blue-500' : 'bg-red-500'
                            }`}
                          ></div>
                        ))}
                      </div>
                    )}

                    <div className={`text-sm sm:text-lg font-bold mb-2 ${isToday ? 'text-pink-600' : 'text-gray-800'} relative z-10`}>
                      {date.getDate()}
                    </div>

                    {/* Atendimentos do dia */}
                    <div className="space-y-1 relative z-10">
                      {dayAppointments.slice(0, 2).map((appointment, aptIndex) => (
                        <div
                          key={appointment.id}
                          className={`text-xs p-1.5 rounded-lg border-2 shadow-sm transition-all duration-200 ${
                            appointment.status === 'confirmed'
                              ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 text-green-800'
                              : appointment.status === 'pending'
                              ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300 text-yellow-800'
                              : appointment.status === 'completed'
                              ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-800'
                              : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-300 text-red-800'
                          }`}
                          title={`${appointment.clients?.name || 'Cliente'} - ${appointment.scheduled_time || 'Horário não definido'}`}
                        >
                          <div className="hidden sm:block font-medium truncate">
                            {appointment.scheduled_time && (
                              <span className="font-bold">{appointment.scheduled_time} </span>
                            )}
                            {appointment.clients?.name || 'Cliente'}
                          </div>
                          <div className="sm:hidden font-medium truncate">
                            {appointment.clients?.name?.slice(0, 8) || 'Cliente'}
                          </div>
                        </div>
                      ))}

                      {/* Indicador de mais atendimentos */}
                      {dayAppointments.length > 2 && (
                        <div className="text-xs text-gray-600 text-center bg-gray-200 bg-opacity-50 rounded-lg px-2 py-1 font-medium">
                          +{dayAppointments.length - 2} mais ✨
                        </div>
                      )}

                      {/* Placeholder para dias vazios */}
                      {dayAppointments.length === 0 && isCurrentMonth && (
                        <div className="text-xs text-gray-400 text-center opacity-50">
                          📅
                        </div>
                      )}
                    </div>

                    {/* Efeito de brilho para dias especiais */}
                    {isToday && (
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-400/10 to-purple-400/10 rounded-xl pointer-events-none"></div>
                    )}
                  </div>
                )
              })}
            </div>
          </Container>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-2 sm:py-4">
          <Container className="space-y-3 sm:space-y-4">
            {/* Visualização Diária com Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
              {/* Header da visualização diária */}
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateDay('prev')}
                    className="p-3 hover:bg-pink-600 rounded-xl transition-all duration-200 hover:scale-110 group"
                  >
                    <span className="text-2xl group-hover:text-pink-200 transition-colors">‹</span>
                  </button>

                  <h2 className="text-lg font-bold flex items-center">
                    <span className="mr-2">📅</span>
                    {selectedDay ? formatDate(selectedDay, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : 'Selecione um dia'}
                  </h2>

                  <button
                    onClick={() => navigateDay('next')}
                    className="p-3 hover:bg-pink-600 rounded-xl transition-all duration-200 hover:scale-110 group"
                  >
                    <span className="text-2xl group-hover:text-pink-200 transition-colors">›</span>
                  </button>
                </div>
              </div>

              {/* Timeline de horas */}
              <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto p-4 space-y-3">
                {dayHours.map(hour => {
                  const hourAppointments = selectedDay ? getHourAppointments(selectedDay, hour) : []
                  const isCurrentHour = new Date().getHours() === hour

                  return (
                    <div
                      key={hour}
                      className={`
                        flex items-center p-3 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-md relative overflow-hidden
                        ${hourAppointments.length > 0
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-sm'
                          : 'bg-gradient-to-r from-gray-50 to-white border-gray-200 hover:border-gray-300'
                        }
                        ${isCurrentHour ? 'ring-2 ring-pink-400 ring-inset bg-gradient-to-r from-pink-50 to-purple-50' : ''}
                      `}
                    >
                      {/* Indicador de hora atual */}
                      {isCurrentHour && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 to-purple-600 rounded-l-xl"></div>
                      )}

                      {/* Hora */}
                      <div className={`w-16 text-sm font-bold ${isCurrentHour ? 'text-pink-600' : 'text-gray-700'}`}>
                        {hour.toString().padStart(2, '0')}:00
                      </div>

                      {/* Conteúdo da hora */}
                      <div className="flex-1 ml-4">
                        {hourAppointments.length > 0 ? (
                          <div className="space-y-2">
                            {hourAppointments.map(appointment => (
                              <div
                                key={appointment.id}
                                className={`
                                  p-3 rounded-lg border-2 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer
                                  ${appointment.status === 'confirmed'
                                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 text-green-800'
                                    : appointment.status === 'pending'
                                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300 text-yellow-800'
                                    : appointment.status === 'completed'
                                    ? 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-300 text-blue-800'
                                    : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-300 text-red-800'
                                  }
                                `}
                                onClick={() => openDayDetails(selectedDay!)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-bold text-sm flex items-center">
                                      <span className="mr-2">
                                        {appointment.status === 'confirmed' ? '✅' :
                                         appointment.status === 'pending' ? '⏳' :
                                         appointment.status === 'completed' ? '🎉' : '❌'}
                                      </span>
                                      {appointment.clients?.name || 'Cliente'}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      📞 {appointment.clients?.phone || 'Sem telefone'}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                     💄 {appointment.appointment_services && appointment.appointment_services.length > 0
                                        ? appointment.appointment_services.length === 1
                                          ? appointment.appointment_services[0].services?.name
                                          : `${appointment.appointment_services.length} serviços`
                                        : 'Serviço não informado'}
                                      {appointment.total_duration_minutes && (
                                        <span className="ml-2 font-medium">
                                          ⏱️ {formatDuration(appointment.total_duration_minutes)}
                                        </span>
                                      )}
                                    </div>
                                    {appointment.payment_total_service && (
                                      <div className="text-xs mt-1 font-medium">
                                        💰 R$ {appointment.payment_total_service.toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="text-xs text-gray-500">
                                      {appointment.scheduled_time}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm italic flex items-center">
                            <span className="mr-2">🕒</span>
                            Horário disponível
                          </div>
                        )}
                      </div>

                      {/* Efeito de brilho para hora atual */}
                      {isCurrentHour && (
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-400/5 to-purple-400/5 rounded-xl pointer-events-none"></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Container>
        </div>
      )}

      {/* Modal de detalhes do dia */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm sm:max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold flex items-center">
                  <span className="mr-2">📅</span>
                  Atendimentos de {formatDate(selectedDate)}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-white hover:text-pink-200 flex-shrink-0 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
              {selectedDateAppointments.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-5xl mb-4">📅</div>
                  <div className="text-gray-500 text-sm sm:text-base">
                    Nenhum atendimento agendado para este dia
                  </div>
                  <div className="text-gray-400 text-xs mt-2">
                    Que tal agendar o primeiro? ✨
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateAppointments.map(appointment => (
                    <div
                      key={appointment.id}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                        <div className="font-bold text-gray-900 text-base sm:text-lg flex items-center">
                          <span className="mr-2">
                            {appointment.status === 'confirmed' ? '✅' :
                             appointment.status === 'pending' ? '⏳' :
                             appointment.status === 'completed' ? '🎉' : '❌'}
                          </span>
                          {appointment.clients?.name || 'Cliente não informado'}
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full font-bold self-start sm:self-auto ${
                          appointment.status === 'confirmed'
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : appointment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            : appointment.status === 'completed'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {appointment.status === 'confirmed' ? 'Confirmado' :
                           appointment.status === 'pending' ? 'Aguardando' :
                           appointment.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center text-gray-700">
                            <span className="mr-2">📞</span>
                            <span className="font-medium">{appointment.clients?.phone || 'Telefone não informado'}</span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <span className="mr-2">🕐</span>
                            <span className="font-medium">{appointment.scheduled_time || 'Horário não definido'}</span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <span className="mr-2">⏱️</span>
                            <span>{appointment.total_duration_minutes ? formatDuration(appointment.total_duration_minutes) : 'Duração não definida'}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-gray-700">
                            <div className="flex items-center mb-2">
                              <span className="mr-2">💄</span>
                              <span className="font-medium">Serviços:</span>
                            </div>
                            <div className="ml-6 space-y-1">
                              {appointment.appointment_services && appointment.appointment_services.length > 0 ? (
                                appointment.appointment_services.map((service, index) => (
                                  <div key={index} className="text-sm">
                                    • {service.services?.name || 'Serviço'}
                                    {service.quantity > 1 && ` (${service.quantity}x)`}
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-gray-500">Nenhum serviço informado</div>
                              )}
                            </div>
                          </div>
                          {appointment.payment_total_service && (
                            <div className="text-gray-700">
                              {editingAppointment === appointment.id ? (
                                <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      💰 Valor Total (R$)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editTotalValue}
                                      onChange={(e) => setEditTotalValue(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      💵 Valor da Entrada (R$)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editDownPayment}
                                      onChange={(e) => setEditDownPayment(e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => savePaymentChanges(appointment.id)}
                                      className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                                    >
                                      ✅ Salvar
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                                    >
                                      ❌ Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <span className="mr-2">💰</span>
                                    <span className="font-bold text-green-600">R$ {appointment.payment_total_service.toFixed(2)}</span>
                                    {appointment.status !== 'cancelled' && (
                                      <button
                                        onClick={() => startEditingPayment(appointment)}
                                        className="ml-2 text-blue-500 hover:text-blue-700 text-sm"
                                        title="Editar valores"
                                      >
                                        ✏️
                                      </button>
                                    )}
                                  </div>
                                  {appointment.payment_down_payment_expected && appointment.payment_down_payment_expected > 0 && (
                                    <div className="flex items-center text-sm">
                                      <span className="mr-2">💵</span>
                                      <span className="text-blue-600">Entrada: R$ {appointment.payment_down_payment_expected.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {appointment.payment_down_payment_paid && appointment.payment_down_payment_paid > 0 && (
                                    <div className="flex items-center text-sm">
                                      <span className="mr-2">✅</span>
                                      <span className="text-green-600">Entrada paga: R$ {appointment.payment_down_payment_paid.toFixed(2)}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-gradient-to-br from-pink-400/20 via-purple-400/20 to-blue-400/20 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 flex flex-col items-center space-y-4 shadow-2xl border border-white/20">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-4 border-pink-200"></div>
              <div className="absolute inset-0 animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-4 border-pink-500 border-t-transparent"></div>
            </div>
            <div className="text-center">
              <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1">
                Carregando calendário...
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                ✨ Preparando seus agendamentos
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}