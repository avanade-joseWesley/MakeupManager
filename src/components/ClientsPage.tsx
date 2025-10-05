import React from 'react'
import Clients from './Clients'
import ErrorBoundary from './ErrorBoundary'

interface ClientsPageProps {
  onBack: () => void
  user: any
}
export default function ClientsPage({ onBack, user }: ClientsPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-4">
      <div className="w-full max-w-sm mx-auto px-4 space-y-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-blue-100 hover:text-white transition-colors">← Voltar</button>
            <h1 className="text-xl font-bold">👥 Clientes</h1>
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
