import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types para TypeScript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          address: string | null
          instagram: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone: string
          address?: string | null
          instagram?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string
          address?: string | null
          instagram?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          user_id: string
          name: string
          price: number
          duration_minutes: number
          service_category_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          price: number
          duration_minutes: number
          service_category_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          price?: number
          duration_minutes?: number
          service_category_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      service_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      service_areas: {
        Row: {
          id: string
          user_id: string
          name: string
          travel_fee: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          travel_fee: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          travel_fee?: number
          created_at?: string
          updated_at?: string
        }
      }
      service_regional_prices: {
        Row: {
          id: string
          user_id: string
          service_id: string
          service_area_id: string
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          service_id: string
          service_area_id: string
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          service_id?: string
          service_area_id?: string
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          user_id: string
          client_id: string
          service_id: string
          service_area_id: string
          quantity: number
          unit_price: number
          total_price: number
          status: string
          appointment_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          service_id: string
          service_area_id: string
          quantity: number
          unit_price: number
          total_price: number
          status: string
          appointment_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          service_id?: string
          service_area_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          status?: string
          appointment_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Funções utilitárias
export const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return '0min'

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }

  return `${minutes}min`
}

// Função centralizada para formatação de datas
export const formatDate = (dateString: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
  if (!dateString) return 'Não definida'
  
  try {
    // Se já for uma string de data no formato brasileiro, retorna como está
    if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString
    }
    
    // Converte para Date e formata
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    if (isNaN(date.getTime())) {
      return 'Data inválida'
    }
    
    return date.toLocaleDateString('pt-BR', options)
  } catch (error) {
    console.warn('Erro ao formatar data:', dateString, error)
    return 'Data inválida'
  }
}

// Função para formatação de data e hora
export const formatDateTime = (dateString: string | null | undefined, timeString?: string | null): string => {
  const date = formatDate(dateString)
  if (!timeString || date === 'Não definida' || date === 'Data inválida') {
    return date
  }
  
  return `${date} às ${timeString}`
}