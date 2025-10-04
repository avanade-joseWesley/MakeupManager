import React from 'react'
import Clients from './Clients'
import ErrorBoundary from './ErrorBoundary'

interface ClientsPageProps {
  onBack: () => void
  user: any
}
export default function ClientsPage({ onBack, user }: ClientsPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 px-4 py-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-800">← Voltar</button>
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">👥 Clientes</h1>
            <div></div>
          </div>
        </div>

        <ErrorBoundary>
          <Clients user={user} />
        </ErrorBoundary>
      </div>
    </div>
  )
}
