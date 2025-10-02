import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-4">
            💄 MakeUp Manager
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistema completo de gestão para maquiladoras profissionais
          </p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">✅</div>
              <h3 className="font-semibold text-gray-800">Protótipo</h3>
              <p className="text-sm text-gray-600">100% Funcional</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">🏗️</div>
              <h3 className="font-semibold text-gray-800">Arquitetura</h3>
              <p className="text-sm text-gray-600">Definida</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">🚀</div>
              <h3 className="font-semibold text-gray-800">Roadmap</h3>
              <p className="text-sm text-gray-600">15 Semanas</p>
            </div>
          </div>
        </div>

        {/* Funcionalidades */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 Funcionalidades Implementadas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Sistema de Autenticação</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Calculadora de Orçamentos</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Gestão de Serviços Dinâmica</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Agenda Visual</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Sistema Financeiro</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Gerenciamento de Clientes</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Avaliações por Estrelas</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">Integração WhatsApp</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm">PWA Mobile</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">🚀 Próximos Passos</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">📋 Documentação</h3>
                <ul className="text-sm space-y-1 text-left">
                  <li>• Especificação técnica completa</li>
                  <li>• Arquitetura do sistema</li>
                  <li>• Roadmap detalhado (15 semanas)</li>
                  <li>• Plano de entregas</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">⚡ Stack Tecnológico</h3>
                <ul className="text-sm space-y-1 text-left">
                  <li>• Next.js 14 + TypeScript</li>
                  <li>• Supabase (Database + Auth)</li>
                  <li>• Tailwind CSS</li>
                  <li>• PWA + Offline Support</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              href="/prototype" 
              className="bg-white hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
            >
              📱 Ver Protótipo
            </Link>
            <Link 
              href="/docs" 
              className="bg-white hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
            >
              📚 Documentação
            </Link>
            <Link 
              href="/roadmap" 
              className="bg-white hover:bg-gray-50 text-gray-800 px-6 py-3 rounded-lg shadow-md transition-colors font-medium"
            >
              🗺️ Roadmap
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Template inicial - MakeUp Manager v0.1.0</p>
          <p>Pronto para desenvolvimento da versão real! 🎯</p>
        </div>
      </div>
    </div>
  )
}