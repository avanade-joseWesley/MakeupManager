import React, { useState, useEffect } from 'react'
import { supabase, formatDuration } from '../lib/supabase'
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
}

export default function CalendarPage({ user, onBack }: CalendarPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<CalendarAppointment[]>([])
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month')
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

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
        .gte('scheduled_date', firstDay.toISOString().split('T')[0])
        .lte('scheduled_date', lastDay.toISOString().split('T')[0])
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
    const dateStr = date.toISOString().split('T')[0]
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

  // Gerar horas do dia que têm atendimentos
  const generateDayHours = () => {
    if (!selectedDay) return []

    const dayAppointments = getDayAppointments(selectedDay)
    const hours = new Set<number>()

    dayAppointments.forEach(appointment => {
      if (appointment.scheduled_time) {
        const [hourStr] = appointment.scheduled_time.split(':')
        const hour = parseInt(hourStr, 10)
        if (!isNaN(hour)) {
          hours.add(hour)
        }
      }
    })

    return Array.from(hours).sort((a, b) => a - b)
  }

  // Obter agendamentos de uma hora específica
  const getHourAppointments = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split('T')[0]
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
        <>
          {/* Navegação do mês */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-xl">‹</span>
            </button>

            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 text-center">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>

            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-xl">›</span>
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
          <div className="grid grid-cols-7 gap-1 bg-white rounded-lg border border-gray-200 p-1 sm:p-2">
            {calendarDays.map((date, index) => {
              const dayAppointments = getDayAppointments(date)
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <div
                  key={index}
                  onClick={() => selectDayForView(date)}
                  className={`
                    min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                    ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}
                  `}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                    {date.getDate()}
                  </div>

                  {/* Atendimentos do dia */}
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map((appointment, aptIndex) => (
                      <div
                        key={appointment.id}
                        className={`text-xs p-1 rounded border truncate ${getStatusColor(appointment.status)}`}
                        title={`${appointment.clients?.name || 'Cliente'} - ${appointment.scheduled_time || 'Horário não definido'}`}
                      >
                        <div className="hidden sm:block">
                          {appointment.scheduled_time && (
                            <span className="font-medium">{appointment.scheduled_time} </span>
                          )}
                          {appointment.clients?.name || 'Cliente'}
                        </div>
                        <div className="sm:hidden">
                          {appointment.clients?.name?.slice(0, 6) || 'Cliente'}
                        </div>
                      </div>
                    ))}

                    {/* Indicador de mais atendimentos */}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayAppointments.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <>
          {/* Visualização Diária com Timeline */}
          <div className="bg-white rounded-lg border border-gray-200">
            {/* Header da visualização diária */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
              <button
                onClick={() => navigateDay('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-xl">‹</span>
              </button>

              <h2 className="text-sm sm:text-xl font-semibold text-gray-800 text-center px-2">
                {selectedDay ? selectedDay.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                }) : 'Selecione um dia'}
              </h2>

              <button
                onClick={() => navigateDay('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-xl">›</span>
              </button>
            </div>

            {/* Timeline de horas */}
            <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto">
              {dayHours.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-gray-500 px-4">
                  <div className="text-3xl sm:text-4xl mb-2">📅</div>
                  <div className="text-base sm:text-lg font-medium">Nenhum atendimento agendado</div>
                  <div className="text-xs sm:text-sm text-gray-400 mt-1">
                    para {selectedDay?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                </div>
              ) : (
                dayHours.map(hour => {
                  const hourAppointments = selectedDay ? getHourAppointments(selectedDay, hour) : []
                  
                  return (
                    <div key={hour} className="flex border-b border-gray-100">
                      {/* Hora */}
                      <div className="w-14 sm:w-20 p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-600 border-r border-gray-200 bg-gray-50 flex-shrink-0">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      
                      {/* Atendimentos da hora */}
                      <div className="flex-1 p-2 min-h-[60px]">
                        <div className="space-y-2">
                          {hourAppointments.map(appointment => (
                            <div
                              key={appointment.id}
                              className={`p-2 sm:p-3 rounded-lg border ${getStatusColor(appointment.status)} cursor-pointer hover:shadow-sm transition-shadow`}
                              onClick={() => openDayDetails(selectedDay!)}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <div className="font-medium text-xs sm:text-sm">
                                  {appointment.clients?.name || 'Cliente'}
                                </div>
                                <div className="text-xs opacity-75">
                                  {appointment.scheduled_time}
                                </div>
                              </div>
                              <div className="text-xs mt-1 opacity-75">
                                💄 {appointment.appointment_services?.[0]?.services?.name || 'Serviço'}
                                {appointment.total_duration_minutes && (
                                  <span className="ml-1 sm:ml-2">⏱️ {formatDuration(appointment.total_duration_minutes)}</span>
                                )}
                              </div>
                              {appointment.payment_total_service && (
                                <div className="text-xs mt-1 font-medium">
                                  💰 R$ {appointment.payment_total_service.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal de detalhes do dia */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm sm:max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 pr-2">
                  📅 Atendimentos de {selectedDate.toLocaleDateString('pt-BR')}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
              {selectedDateAppointments.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500">
                  <div className="text-3xl sm:text-4xl mb-2">📅</div>
                  Nenhum atendimento agendado para este dia
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {selectedDateAppointments.map(appointment => (
                    <div key={appointment.id} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">
                          {appointment.clients?.name || 'Cliente não informado'}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium self-start sm:self-auto ${getStatusColor(appointment.status)}`}>
                          {appointment.status === 'confirmed' ? 'Confirmado' :
                           appointment.status === 'pending' ? 'Aguardando' :
                           appointment.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <div>🕐 {appointment.scheduled_time || 'Horário não definido'}</div>
                        <div>💄 {appointment.appointment_services?.[0]?.services?.name || 'Serviço'}</div>
                        {appointment.total_duration_minutes && (
                          <div>⏱️ {formatDuration(appointment.total_duration_minutes)}</div>
                        )}
                        {appointment.payment_total_service && (
                          <div>💰 R$ {appointment.payment_total_service.toFixed(2)}</div>
                        )}
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
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-pink-500"></div>
            <span className="text-sm sm:text-base">Carregando calendário...</span>
          </div>
        </div>
      )}
    </Container>
  )
}