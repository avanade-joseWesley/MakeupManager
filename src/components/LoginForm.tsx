import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { WhatsAppButton, useWhatsAppMessage } from './WhatsAppButton'
import { WhatsAppAutoSend } from './WhatsAppAutoSend'
import { QuickWhatsAppSender } from './QuickWhatsAppSender'

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { generateAppointmentMessage, generateSimpleMessage } = useWhatsAppMessage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        // Criar conta
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0], // Nome temporário baseado no email
            }
          }
        })

        if (error) throw error

        if (data.user && !data.session) {
          setMessage('Verifique seu email para confirmar a conta!')
        } else {
          setMessage('Conta criada com sucesso!')
          onSuccess?.()
        }
      } else {
        // Fazer login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        setMessage('Login realizado com sucesso!')
        onSuccess?.()
      }
    } catch (error: any) {
      setError(error.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4 py-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
            💄 MakeUp Manager
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {isSignUp ? 'Criar sua conta' : 'Entrar na sua conta'}
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                📧 Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors bg-gray-50 focus:bg-white placeholder-gray-500"
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                🔐 Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors bg-gray-50 focus:bg-white placeholder-gray-500"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.636 6.636a8.966 8.966 0 00-2.115 2.242M9.878 9.878a3 3 0 103.365-3.366M14.12 14.12l3.536 3.536a8.966 8.966 0 002.115-2.242M14.12 14.12a3 3 0 01-3.365 3.366m0 0a8.966 8.966 0 01-4.242-2.242" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            {message && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm leading-relaxed">{message}</p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-4 rounded-lg font-semibold text-base transition-all duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSignUp ? 'Criando...' : 'Entrando...'}
                </span>
              ) : (
                isSignUp ? '🚀 Criar Conta' : '🔓 Entrar'
              )}
            </button>
          </form>

          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">ou</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                  setMessage('')
                }}
                className="w-full text-center text-pink-600 hover:text-pink-500 font-semibold py-2 px-4 rounded-lg hover:bg-pink-50 transition-colors"
              >
                {isSignUp ? '👤 Já tem conta? Entrar' : '✨ Não tem conta? Criar uma'}
              </button>
            </div>
          </div>
        </div>

        {/* Status da conexão - compacto para mobile */}
        <div className="bg-white p-3 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">🔧 Status da Conexão</h3>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Database:</span>
              <span className={import.meta.env.VITE_SUPABASE_URL ? 'text-green-600 font-medium' : 'text-red-600'}>
                {import.meta.env.VITE_SUPABASE_URL ? '✅ Online' : '❌ Offline'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Autenticação:</span>
              <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-green-600 font-medium' : 'text-red-600'}>
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Ativa' : '❌ Inativa'}
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp com Campo Customizado */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">📱 WhatsApp - Enviar para Qualquer Número</h3>
          <WhatsAppButton
            phoneNumber="11984806842" // Número padrão
            message={generateAppointmentMessage({
              clientName: 'Cliente Exemplo',
              service: 'Maquiagem Profissional',
              date: new Date().toLocaleDateString('pt-BR'),
              time: '14:30',
              location: 'A combinar',
              price: 150.00,
              notes: 'Agendamento via MakeUp Manager'
            })}
            allowCustomNumber={true}
            className="w-full"
          >
            📤 Enviar Agendamento
          </WhatsAppButton>
        </div>

        {/* Teste WhatsApp - Opção 1 (Rápidos) */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">📱 WhatsApp - Envios Rápidos</h3>
          <div className="space-y-2">
            <WhatsAppButton
              phoneNumber="11984806842"
              message={generateSimpleMessage('Olá! Este é um teste do sistema MakeUp Manager 💄')}
              className="w-full text-sm"
            >
              📲 Teste Mensagem Simples
            </WhatsAppButton>
            
            <WhatsAppButton
              phoneNumber="11984806842"
              message={generateAppointmentMessage({
                clientName: 'Maria Silva',
                service: 'Maquiagem para Casamento',
                date: '15/10/2024',
                time: '14:30',
                location: 'Salão Beleza Total',
                price: 150.00,
                notes: 'Trazer extensões próprias'
              })}
              className="w-full text-sm"
            >
              💄 Teste Agendamento Fixo
            </WhatsAppButton>
          </div>
        </div>

        {/* Formulário Completo de Agendamento */}
        <QuickWhatsAppSender />

        {/* Teste WhatsApp - Opção 3 (Auto Send) */}
        <WhatsAppAutoSend
          phoneNumber="11984806842"
          message={generateAppointmentMessage({
            clientName: 'Ana Costa',
            service: 'Maquiagem Social + Penteado',
            date: '20/10/2024',
            time: '16:00',
            location: 'Domicílio - Rua das Flores, 123',
            price: 200.00,
            notes: 'Evento às 19h, maquiagem natural'
          })}
          onSent={() => console.log('Mensagem enviada com sucesso!')}
        />
      </div>
    </div>
  )
}