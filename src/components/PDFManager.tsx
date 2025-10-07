import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { WhatsAppButton } from './WhatsAppButton'

interface PDFManagerProps {
  user: any
}

interface PDFDocument {
  id: string
  name: string
  path: string
  size: number
  created_at: string
  updated_at: string
}

export function PDFManager({ user }: PDFManagerProps) {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  // Carregar PDFs do usuário
  const loadPDFs = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase.storage
        .from('budgets')
        .list(user.id + '/', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) throw error

      const pdfDocuments: PDFDocument[] = data?.map(file => ({
        id: file.id || file.name,
        name: file.name,
        path: `${user.id}/${file.name}`,
        size: file.metadata?.size || 0,
        created_at: file.created_at || new Date().toISOString(),
        updated_at: file.updated_at || new Date().toISOString()
      })) || []

      setPdfs(pdfDocuments)
    } catch (err) {
      console.error('Erro ao carregar PDFs:', err)
      setError('Erro ao carregar PDFs')
    } finally {
      setLoading(false)
    }
  }

  // Upload de PDF
  const uploadPDF = async () => {
    if (!selectedFile || !user?.id) return

    try {
      setUploading(true)
      setError('')

      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('budgets')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Limpar formulário
      setSelectedFile(null)
      setFileName('')

      // Recarregar lista
      await loadPDFs()

    } catch (err: any) {
      console.error('Erro ao fazer upload:', err)
      setError(err.message || 'Erro ao fazer upload do PDF')
    } finally {
      setUploading(false)
    }
  }

  // Download de PDF
  const downloadPDF = async (pdf: PDFDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('budgets')
        .download(pdf.path)

      if (error) throw error

      // Criar URL para download
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = pdf.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (err) {
      console.error('Erro ao baixar PDF:', err)
      setError('Erro ao baixar PDF')
    }
  }

  // Compartilhar PDF via WhatsApp
  const sharePDFViaWhatsApp = async (pdf: PDFDocument, phoneNumber: string) => {
    try {
      const { data } = await supabase.storage
        .from('budgets')
        .getPublicUrl(pdf.path)

      if (!data?.publicUrl) throw new Error('URL pública não disponível')

      const message = `*📄 DOCUMENTO DISPONÍVEL*\n\nOlá! Segue o link para visualizar o documento:\n\n${data.publicUrl}\n\n💄 MakeUp Manager`

      // Abrir WhatsApp com a mensagem
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')

    } catch (err) {
      console.error('Erro ao compartilhar PDF:', err)
      setError('Erro ao compartilhar PDF')
    }
  }

  // Excluir PDF
  const deletePDF = async (pdf: PDFDocument) => {
    if (!confirm(`Tem certeza que deseja excluir "${pdf.name}"?`)) return

    try {
      const { error } = await supabase.storage
        .from('budgets')
        .remove([pdf.path])

      if (error) throw error

      await loadPDFs()
    } catch (err) {
      console.error('Erro ao excluir PDF:', err)
      setError('Erro ao excluir PDF')
    }
  }

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    loadPDFs()
  }, [user?.id])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-2xl shadow-xl">
        <h1 className="text-xl font-bold flex items-center">
          📄 Gerenciador de Documentos
        </h1>
        <p className="text-purple-100 text-sm mt-1">
          Faça upload, visualize e compartilhe seus documentos em PDF
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          📤 Fazer Upload de PDF
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📄 Selecionar Arquivo PDF
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setSelectedFile(file)
                  setFileName(file.name)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {selectedFile && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-700">
                📄 Arquivo selecionado: <strong>{fileName}</strong>
                <br />
                📏 Tamanho: {formatFileSize(selectedFile.size)}
              </p>
            </div>
          )}

          <button
            onClick={uploadPDF}
            disabled={!selectedFile || uploading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? '⏳ Fazendo upload...' : '📤 Fazer Upload'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ⚠️ {error}
          <button
            onClick={() => setError('')}
            className="float-right ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* PDFs List */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4">
          <h2 className="text-lg font-semibold flex items-center">
            📋 Meus Documentos ({pdfs.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
            Carregando documentos...
          </div>
        ) : pdfs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📄</div>
            Nenhum documento encontrado
            <br />
            <span className="text-sm">Faça upload do seu primeiro PDF acima</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pdfs.map((pdf) => (
              <div key={pdf.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">
                      📄 {pdf.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      📏 {formatFileSize(pdf.size)} • 📅 {formatDate(pdf.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => downloadPDF(pdf)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Baixar PDF"
                    >
                      📥
                    </button>

                    <button
                      onClick={() => {
                        const phone = prompt('Digite o número do WhatsApp (com DDD):')
                        if (phone) sharePDFViaWhatsApp(pdf, phone)
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Compartilhar via WhatsApp"
                    >
                      📱
                    </button>

                    <button
                      onClick={() => deletePDF(pdf)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir PDF"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}