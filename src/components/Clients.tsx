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
      <div className="bg-white p-6 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">📋 Lista de Clientes</h2>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">{filtered.length} resultados</div>
            <button onClick={() => setShowForm(s => !s)} className="py-1 px-3 text-sm bg-pink-50 text-pink-600 rounded">{showForm ? 'Fechar' : '➕ Adicionar'}</button>
          </div>
        </div>

        {/* animated form container (moved into the list card) */}
        <div className={`overflow-hidden transition-all duration-300 ${showForm ? 'max-h-[800px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'}`}>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input ref={nameRef} aria-label="Nome" type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Nome*" value={name} onChange={e => setName(e.target.value)} />
              <input aria-label="Telefone" type="tel" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Telefone*" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input aria-label="Email" type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Email (opcional)" value={email} onChange={e => setEmail(e.target.value)} />
              <input aria-label="Endereço" type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Endereço (opcional)" value={address} onChange={e => setAddress(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input aria-label="Instagram" type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Instagram (opcional)" value={instagram} onChange={e => setInstagram(e.target.value)} />
              <div />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input aria-label="Email" type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Email (opcional)" value={email} onChange={e => setEmail(e.target.value)} />
              {/* search moved outside form - keep placeholder here only */}
              <div />
            </div>

            <textarea className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Notas (opcional)" value={notes} onChange={e => setNotes(e.target.value)} />

            <div className="flex gap-2">
              <button onClick={save} disabled={!name.trim() || !phone.trim()} className="py-2 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg disabled:opacity-50">{editing ? 'Salvar' : 'Adicionar Cliente'}</button>
              <button onClick={resetForm} className="py-2 px-4 border rounded-lg">Limpar</button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <input aria-label="Buscar" type="text" className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50" placeholder="Buscar por nome, telefone ou email" value={query} onChange={e => setQuery(e.target.value)} />
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando clientes...</p>
        ) : error ? (
          <p className="text-red-600">Erro: {error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">Nenhum cliente encontrado.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="p-3 bg-white/60 backdrop-blur-sm border border-gray-100 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 font-semibold text-lg">{(c.name || ' ')[0].toUpperCase()}</div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 truncate">{c.name}</div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 truncate">
                        <a className="whitespace-nowrap text-gray-600 hover:underline" href={`https://wa.me/55${String(c.phone).replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{formatPhone(c.phone)}</a>
                        {c.instagram && (
                          <a className="text-pink-600 truncate hover:underline" target="_blank" rel="noreferrer" href={`https://instagram.com/${String(c.instagram).replace(/^@/, '')}`}>@{String(c.instagram).replace(/^@/, '')}</a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleExpanded(c.id)} aria-label={expandedMap[c.id] ? 'Ocultar detalhes' : 'Mostrar detalhes'} className={`p-2 rounded-full hover:bg-gray-100 transition-transform duration-200 ${expandedMap[c.id] ? 'rotate-180' : 'rotate-0'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 transform transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l5 5a1 1 0 11-1.414 1.414L10 5.414 5.707 9.707A1 1 0 114.293 8.293l5-5A1 1 0 0110 3z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* expanded details */}
                <div className={`overflow-hidden transition-all duration-200 ${expandedMap[c.id] ? 'max-h-96 mt-3 opacity-100' : 'max-h-0 mt-0 opacity-0'}`}>
                  <div className="text-sm text-gray-700 space-y-2">
                    {c.address && <div className="flex items-start gap-2">📍 <span className="truncate">{c.address}</span></div>}
                    {c.email && <div className="flex items-start gap-2 text-gray-700">✉️ <a className="truncate hover:underline" href={`mailto:${c.email}`}>{c.email}</a></div>}
                    {c.notes && <div className="text-xs text-gray-500">📝 {c.notes}</div>}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => startEdit(c)} className="py-1 px-3 text-sm bg-yellow-50 text-yellow-800 rounded">Editar</button>
                      <button onClick={() => remove(c.id)} className="py-1 px-3 text-sm bg-red-50 text-red-600 rounded">Excluir</button>
                    </div>
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
