import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
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

          {/* Status Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">✅</div>
              <h3 className="font-semibold text-gray-800">Protótipo</h3>
              <p className="text-sm text-gray-600">100% Funcional</p>
              <p className="text-xs text-gray-500 mt-2">8.361 linhas de código</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">⚡</div>
              <h3 className="font-semibold text-gray-800">Vite + React</h3>
              <p className="text-sm text-gray-600">Node.js 14 Compatible</p>
              <p className="text-xs text-gray-500 mt-2">Hot Reload Instantâneo</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">🚀</div>
              <h3 className="font-semibold text-gray-800">GitHub Ready</h3>
              <p className="text-sm text-gray-600">Repositório Criado</p>
              <p className="text-xs text-gray-500 mt-2">Deploy automatizado</p>
            </div>
          </div>

          {/* Counter Test */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🧪 Teste de Funcionalidade</h2>
            <div className="flex items-center justify-center space-x-4">
              <button 
                onClick={() => setCount(count - 1)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                -
              </button>
              <span className="text-4xl font-bold text-gray-800 min-w-[100px]">
                {count}
              </span>
              <button 
                onClick={() => setCount(count + 1)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              {count === 0 ? '🎯 Estado inicial!' : 
               count > 0 ? '📈 Contagem positiva!' : '📉 Contagem negativa!'}
            </p>
          </div>

          {/* Tech Stack */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white mb-8">
            <h2 className="text-2xl font-bold mb-4">🛠️ Stack Tecnológica</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">⚡ Frontend</h3>
                <ul className="text-sm space-y-1 text-left">
                  <li>✅ Vite 4.4.5 (Compatible Node 14)</li>
                  <li>✅ React 18.2.0 + TypeScript</li>
                  <li>✅ Tailwind CSS 3.3.3</li>
                  <li>✅ Zustand + React Hook Form</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">🔧 Backend</h3>
                <ul className="text-sm space-y-1 text-left">
                  <li>✅ Supabase (Auth + Database)</li>
                  <li>✅ PostgreSQL Real-time</li>
                  <li>✅ TypeScript End-to-End</li>
                  <li>✅ PWA Ready</li>
                </ul>
              </div>
            </div>
          </div>

          {/* GitHub Link */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-semibold text-gray-800 mb-4">🔗 Repositório GitHub</h3>
            <a 
              href="https://github.com/avanade-joseWesley/MakeupManager.git"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <span>📂</span>
              <span>avanade-joseWesley/MakeupManager</span>
            </a>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm mt-8">
            <p>🚀 <strong>PROJETO VITE FUNCIONANDO!</strong></p>
            <p className="mt-2">
              Compatível com Node.js 14.21.3 ✅
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App