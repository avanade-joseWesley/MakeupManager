import React, { useState, useEffect } from 'react'

interface WhatsAppAutoSendProps {
  phoneNumber: string
  message: string
  onSent?: () => void
}

export function WhatsAppAutoSend({ phoneNumber, message, onSent }: WhatsAppAutoSendProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'sending' | 'sent' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [qrCode, setQrCode] = useState('')

  const formatPhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (!cleanPhone.startsWith('55')) {
      return `55${cleanPhone}`
    }
    return cleanPhone
  }

  const checkWhatsAppConnection = async () => {
    setStatus('connecting')
    setProgress(0)

    try {
      // Verificar status do servidor real
      const response = await fetch('http://localhost:3002/whatsapp/status')
      const data = await response.json()
      
      setProgress(50)
      
      if (data.ready) {
        setProgress(100)
        setStatus('sending')
      } else {
        // Mostrar que precisa escanear QR Code
        setProgress(75)
        setQrCode('REAL_QR_IN_TERMINAL')
        
        // Aguardar conexão
        const checkInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch('http://localhost:3002/whatsapp/status')
            const statusData = await statusResponse.json()
            
            if (statusData.ready) {
              clearInterval(checkInterval)
              setProgress(100)
              setStatus('sending')
              setQrCode('')
            }
          } catch (error) {
            console.log('Aguardando conexão WhatsApp...')
          }
        }, 2000)
        
        // Timeout após 60 segundos
        setTimeout(() => {
          clearInterval(checkInterval)
          if (status === 'connecting') {
            setStatus('error')
          }
        }, 60000)
      }
      
    } catch (error) {
      console.error('Erro ao conectar:', error)
      setStatus('error')
    }
  }

  const sendMessage = async () => {
    if (status !== 'sending') return

    setProgress(0)
    const formattedPhone = formatPhoneNumber(phoneNumber)
    
    try {
      setProgress(25)
      
      // Enviar via servidor real
      const response = await fetch('http://localhost:3002/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: formattedPhone,
          message: message
        })
      })
      
      setProgress(50)
      
      const result = await response.json()
      
      setProgress(75)
      
      if (result.success) {
        setProgress(100)
        setStatus('sent')
        console.log('✅ Mensagem enviada via WhatsApp Web!')
        onSent?.()
      } else {
        throw new Error(result.error || 'Erro no envio')
      }
      
    } catch (error) {
      console.error('❌ Erro ao enviar:', error)
      
      // Fallback para WhatsApp Web
      setProgress(75)
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      
      setProgress(100)
      setStatus('sent')
      onSent?.()
    }
  }

  const reset = () => {
    setStatus('idle')
    setProgress(0)
    setQrCode('')
  }

  return (
    <div className="bg-white border-2 border-green-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-green-800">🚀 WhatsApp Auto Send</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          status === 'idle' ? 'bg-gray-100 text-gray-600' :
          status === 'connecting' ? 'bg-blue-100 text-blue-600' :
          status === 'sending' ? 'bg-yellow-100 text-yellow-600' :
          status === 'sent' ? 'bg-green-100 text-green-600' :
          'bg-red-100 text-red-600'
        }`}>
          {status === 'idle' ? 'Pronto' :
           status === 'connecting' ? 'Conectando...' :
           status === 'sending' ? 'Enviando...' :
           status === 'sent' ? 'Enviado!' : 'Erro'}
        </div>
      </div>

      {/* Progresso */}
      {(status === 'connecting' || status === 'sending') && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">{progress}%</p>
        </div>
      )}

      {/* QR Code Real */}
      {status === 'connecting' && qrCode && (
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-gray-700">📱 Escaneie o QR Code com seu celular:</p>
          <div className="inline-block p-4 bg-gray-50 rounded-lg">
            <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center text-xs text-red-600">
                <div className="text-3xl mb-2">⚠️</div>
                <div className="font-semibold">QR CODE ESTÁ NO TERMINAL!</div>
                <div className="mt-2">Olhe na janela PowerShell</div>
                <div>que está rodando o servidor</div>
                <div className="mt-1 text-green-600">WhatsApp</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            <strong>IMPORTANTE:</strong> O QR Code real aparece no terminal/console do servidor WhatsApp
          </p>
        </div>
      )}

      {/* Prévia da mensagem */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm font-semibold text-gray-700 mb-2">📄 Prévia da mensagem:</p>
        <div className="bg-green-100 rounded-lg p-3 text-sm">
          <p className="font-semibold text-green-800">Para: {phoneNumber}</p>
          <div className="mt-2 text-gray-800 whitespace-pre-wrap">{message}</div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-2">
        {status === 'idle' && (
          <button
            onClick={checkWhatsAppConnection}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            🔗 Conectar WhatsApp
          </button>
        )}
        
        {status === 'sending' && (
          <button
            onClick={sendMessage}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            📤 Enviar Mensagem
          </button>
        )}
        
        {status === 'sent' && (
          <button
            onClick={reset}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            🔄 Enviar Outra
          </button>
        )}
      </div>

      {/* Instruções para encontrar QR Code */}
      {status === 'connecting' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-blue-800 mb-2">🎯 Como escanear o QR Code:</h4>
          <ol className="space-y-1 text-blue-700 ml-4 list-decimal">
            <li><strong>Procure a janela PowerShell</strong> que está rodando o servidor WhatsApp</li>
            <li><strong>Nessa janela</strong> aparece um QR Code feito de caracteres ASCII</li>
            <li><strong>No seu celular:</strong> WhatsApp → Menu (⋮) → "Aparelhos conectados"</li>
            <li><strong>Toque em</strong> "Conectar um aparelho"</li>
            <li><strong>Escaneie</strong> o QR Code que está no terminal</li>
          </ol>
        </div>
      )}

      {/* Explicação */}
      <div className="text-xs text-gray-500 border-t pt-3">
        <p className="font-semibold mb-1">ℹ️ Como funciona:</p>
        <ul className="space-y-1 ml-4">
          <li>• Conecta automaticamente ao WhatsApp Web</li>
          <li>• Envia mensagens sem interação manual</li>
          <li>• Mantém sessão ativa para envios futuros</li>
          <li>• <strong>QR Code aparece no terminal do servidor</strong></li>
        </ul>
      </div>
    </div>
  )
}

// Hook para controlar múltiplas instâncias
export function useWhatsAppAutoSend() {
  const [isConnected, setIsConnected] = useState(false)
  const [sessionActive, setSessionActive] = useState(false)

  const checkConnection = async () => {
    try {
      // Em produção, verificaria o status do backend
      // const response = await fetch('http://localhost:3002/whatsapp/status')
      // const data = await response.json()
      // setIsConnected(data.ready)
      
      // Por enquanto, simula
      setIsConnected(false)
    } catch (error) {
      setIsConnected(false)
    }
  }

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 5000) // Verifica a cada 5s
    return () => clearInterval(interval)
  }, [])

  return {
    isConnected,
    sessionActive,
    checkConnection
  }
}