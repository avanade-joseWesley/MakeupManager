#!/usr/bin/env node
// CommonJS seed script for projects where package.json has "type": "module"
const { createClient } = require('@supabase/supabase-js')

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_KEY

if (!url || !key) {
  console.error('Please set SUPABASE_URL and SUPABASE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(url, key)

const sample = [
  { name: 'Maria Silva', phone: '11987654321', email: 'maria@example.com', notes: 'Prefere produtos oil-free', address: 'Av. Paulista, 1000', instagram: '@maria.s' },
  { name: 'Ana Costa', phone: '11991234567', email: 'ana@example.com', notes: 'Evento dia 20', address: 'Rua das Flores, 45', instagram: '@anacosta' },
  { name: 'Julia Santos', phone: '11999887766', email: 'julia@example.com', notes: '', address: 'R. do Mercado, 12', instagram: '@julias' }
]

async function seed() {
  try {
    const { data, error } = await supabase.from('clients').insert(sample)
    if (error) throw error
    console.log('Seeded clients:', data)
  } catch (err) {
    console.error('Error seeding clients:', err)
    process.exit(1)
  }
}

seed()
