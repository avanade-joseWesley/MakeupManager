import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Client {
  id: string
  name: string
  phone: string
  email?: string
  notes?: string
  address?: string
  instagram?: string
}

type ClientRow = {
  id: string
  user_id: string | null
  name: string
  phone: string
  email?: string | null
  notes?: string | null
  address?: string | null
  instagram?: string | null
  created_at?: string
  updated_at?: string
}

const generateId = () => Math.random().toString(36).slice(2, 9)

function formatPhone(raw: string) {
  // simple BR phone formatting: keep digits and format as (XX) XXXXX-XXXX or (XX) XXXX-XXXX
  const digits = raw.replace(/\D/g, '')
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`
}

export default function Clients({ user }: { user?: any }) {
  const [clients, setClients] = useState<Client[]>([])
  const [editing, setEditing] = useState<Client | null>(null)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [address, setAddress] = useState('')
  const [instagram, setInstagram] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement | null>(null)

  // autofocus name input when form opens
  useEffect(() => {
    if (showForm && nameRef.current) {
      setTimeout(() => nameRef.current?.focus(), 50)
    }
  }, [showForm])

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    setLoading(true)
    setError(null)
    try {
  let query = supabase.from('clients').select('*').order('created_at', { ascending: false })
      if (user && user.id) {
        query = query.eq('user_id', user.id)
      }
      const { data, error } = await query

      if (error) throw error
      if (data) {
        setClients(data.map(d => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          email: d.email || undefined,
          notes: d.notes || undefined,
          address: d.address || undefined,
          instagram: d.instagram || undefined
        })))
      }
    } catch (err: any) {
      console.error('Erro carregando clientes:', err)
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditing(null)
    setName('')
    setPhone('')
    setEmail('')
    setNotes('')
    setAddress('')
    setInstagram('')
  }

  const startEdit = (c: Client) => {
    setEditing(c)
    setName(c.name)
    setPhone(c.phone)
    setEmail(c.email || '')
    setNotes(c.notes || '')
    setAddress(c.address || '')
    setInstagram(c.instagram || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setShowForm(true)
  }

  const save = () => {
    if (!name.trim() || !phone.trim()) {
      alert('Nome e telefone são obrigatórios')
      return
    }
    ;(async () => {
      try {
        if (editing) {
          const payload: any = { name: name.trim(), phone: phone.trim(), email: email.trim() || null, notes: notes.trim() || null, address: address.trim() || null, instagram: instagram.trim() || null }
          if (user && user.id) payload.user_id = user.id
          const { data, error } = await supabase
            .from('clients')
            .update(payload)
            .eq('id', editing.id)
            .select()

          if (error) throw error
          if (data) await loadClients()
        } else {
          const payload: any = { name: name.trim(), phone: phone.trim(), email: email.trim() || null, notes: notes.trim() || null, address: address.trim() || null, instagram: instagram.trim() || null }
          if (user && user.id) payload.user_id = user.id
          const { data, error } = await supabase
            .from('clients')
            .insert(payload)
            .select()

          if (error) throw error
          if (data) await loadClients()
        }
      } catch (err: any) {
        console.error('Erro salvando cliente:', err)
        alert('Erro salvando cliente: ' + (err.message || String(err)))
      } finally {
        resetForm()
        setShowForm(false)
      }
    })()
  }

  const remove = (id: string) => {
    if (!window.confirm('Excluir cliente?')) return
    ;(async () => {
      try {
        const { error } = await supabase.from('clients').delete().eq('id', id)
        if (error) throw error
        await loadClients()
      } catch (err: any) {
        console.error('Erro ao excluir cliente:', err)
        alert('Erro ao excluir cliente: ' + (err.message || String(err)))
      }
    })()
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || '').toLowerCase().includes(q))
  }, [clients, query])

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({})
  const toggleExpanded = (id: string) => setExpandedMap(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center">📋 Lista de Clientes</h2>
            <button 
              onClick={() => setShowForm(s => !s)} 
              className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition-colors"
            >
              {showForm ? 'Fechar' : '➕ Adicionar'}
            </button>
          </div>
          <div className="text-blue-100 text-sm mt-1">{filtered.length} clientes cadastrados</div>
        </div>
        
        <div className="p-4">

          {/* Formulário */}
          <div className={`overflow-hidden transition-all duration-300 ${showForm ? 'max-h-[800px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'}`}>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg space-y-3 mb-4">
              <div className="text-center mb-3">
                <h3 className="font-semibold text-gray-800">{editing ? '✏️ Editar Cliente' : '➕ Novo Cliente'}</h3>
              </div>
              
              <div className="space-y-3">
                <input 
                  ref={nameRef} 
                  aria-label="Nome" 
                  type="text" 
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors" 
                  placeholder="Nome completo*" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
                <input 
                  aria-label="Telefone" 
                  type="tel" 
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors" 
                  placeholder="Telefone*" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                />
                <input 
                  aria-label="Email" 
                  type="email" 
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors" 
                  placeholder="Email (opcional)" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
                <input 
                  aria-label="Endereço" 
                  type="text" 
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors" 
                  placeholder="Endereço (opcional)" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                />

                <input 
                  aria-label="Instagram" 
                  type="text" 
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors" 
                  placeholder="Instagram (opcional)" 
                  value={instagram} 
                  onChange={e => setInstagram(e.target.value)} 
                />
                <textarea 
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors" 
                  placeholder="Notas adicionais (opcional)" 
                  rows={3}
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={save} 
                  disabled={!name.trim() || !phone.trim()} 
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg disabled:opacity-50 font-semibold hover:from-blue-600 hover:to-blue-700 transition-colors"
                >
                  {editing ? '💾 Salvar' : '➕ Adicionar'}
                </button>
                <button 
                  onClick={() => { resetForm(); setShowForm(false); }} 
                  className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>

          {/* Busca */}
          <div className="mb-4">
            <div className="relative">
              <input 
                aria-label="Buscar" 
                type="text" 
                className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-lg bg-gray-50 focus:border-blue-500 focus:outline-none transition-colors" 
                placeholder="🔍 Buscar clientes..." 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </div>

          {/* Lista de Clientes */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2">Carregando clientes...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">❌ Erro: {error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-gray-500">Nenhum cliente encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(c => (
                <div key={c.id} className="bg-gradient-to-r from-white to-blue-50 border border-blue-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {(c.name || ' ')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800 truncate">{c.name}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <a 
                              className="text-green-600 hover:text-green-700 font-medium" 
                              href={`https://wa.me/55${String(c.phone).replace(/\D/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                            >
                              📱 {formatPhone(c.phone)}
                            </a>
                          </div>
                          {c.instagram && (
                            <a 
                              className="text-pink-600 text-sm hover:text-pink-700 font-medium" 
                              target="_blank" 
                              rel="noreferrer" 
                              href={`https://instagram.com/${String(c.instagram).replace(/^@/, '')}`}
                            >
                              📷 @{String(c.instagram).replace(/^@/, '')}
                            </a>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={() => toggleExpanded(c.id)} 
                        className={`p-2 rounded-full hover:bg-blue-100 transition-all duration-200 ${expandedMap[c.id] ? 'rotate-180 bg-blue-100' : 'rotate-0'}`}
                      >
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Detalhes expandidos */}
                    <div className={`overflow-hidden transition-all duration-300 ${expandedMap[c.id] ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 mt-0 opacity-0'}`}>
                      <div className="border-t border-blue-100 pt-3 space-y-2">
                        {c.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-blue-600">✉️</span>
                            <a className="text-gray-700 hover:text-blue-600" href={`mailto:${c.email}`}>{c.email}</a>
                          </div>
                        )}
                        {c.address && (
                          <div className="flex items-start gap-2 text-sm">
                            <span className="text-blue-600">📍</span>
                            <span className="text-gray-700">{c.address}</span>
                          </div>
                        )}
                        {c.notes && (
                          <div className="flex items-start gap-2 text-sm">
                            <span className="text-blue-600">📝</span>
                            <span className="text-gray-600 italic">{c.notes}</span>
                          </div>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => startEdit(c)} 
                            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            onClick={() => remove(c.id)} 
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
