import './globals.css'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MakeUp Manager',
  description: 'Sistema completo de gestão para maquiladoras profissionais',
  keywords: ['makeup', 'maquiagem', 'gestão', 'agenda', 'clientes'],
  authors: [{ name: 'MakeUp Manager Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B9D" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}