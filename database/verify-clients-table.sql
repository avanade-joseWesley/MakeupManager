-- VERIFICAÇÃO: Campos necessários na tabela clients
-- Execute este script no Supabase SQL Editor para verificar se a tabela clients tem todos os campos necessários

-- Campos que o código atual usa:
-- SELECT: id, name, phone, address, instagram
-- INSERT: name, phone, address, user_id
-- WHERE: phone, user_id

-- Verificar se a tabela clients existe e tem os campos necessários
DO $$
DECLARE
    table_exists BOOLEAN;
    has_user_id BOOLEAN;
    has_name BOOLEAN;
    has_phone BOOLEAN;
    has_address BOOLEAN;
    has_instagram BOOLEAN;
    has_created_at BOOLEAN;
    has_updated_at BOOLEAN;
BEGIN
    -- Verificar se tabela existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'clients'
    ) INTO table_exists;

    IF NOT table_exists THEN
        RAISE EXCEPTION 'Tabela clients não existe!';
    END IF;

    -- Verificar campos obrigatórios
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'user_id'
    ) INTO has_user_id;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'name'
    ) INTO has_name;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'phone'
    ) INTO has_phone;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'address'
    ) INTO has_address;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'instagram'
    ) INTO has_instagram;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'created_at'
    ) INTO has_created_at;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'updated_at'
    ) INTO has_updated_at;

    -- Resultados
    RAISE NOTICE '=== VERIFICAÇÃO DA TABELA CLIENTS ===';
    RAISE NOTICE 'user_id (obrigatório): %', CASE WHEN has_user_id THEN '✅ Existe' ELSE '❌ FALTA' END;
    RAISE NOTICE 'name (obrigatório): %', CASE WHEN has_name THEN '✅ Existe' ELSE '❌ FALTA' END;
    RAISE NOTICE 'phone (obrigatório): %', CASE WHEN has_phone THEN '✅ Existe' ELSE '❌ FALTA' END;
    RAISE NOTICE 'address (opcional): %', CASE WHEN has_address THEN '✅ Existe' ELSE '⚠️  Opcional' END;
    RAISE NOTICE 'instagram (opcional): %', CASE WHEN has_instagram THEN '✅ Existe' ELSE '⚠️  Opcional' END;
    RAISE NOTICE 'created_at (recomendado): %', CASE WHEN has_created_at THEN '✅ Existe' ELSE '⚠️  Recomendado' END;
    RAISE NOTICE 'updated_at (recomendado): %', CASE WHEN has_updated_at THEN '✅ Existe' ELSE '⚠️  Recomendado' END;

    -- Verificar RLS
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'clients' AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        RAISE NOTICE 'RLS: ✅ Habilitado';
    ELSE
        RAISE NOTICE 'RLS: ❌ DESABILITADO (execute clients_rls.sql)';
    END IF;

    -- Verificar índices
    IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'clients' AND indexname = 'idx_clients_user_id'
    ) THEN
        RAISE NOTICE 'Índice user_id: ✅ Existe';
    ELSE
        RAISE NOTICE 'Índice user_id: ❌ FALTA';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'clients' AND indexname = 'idx_clients_phone'
    ) THEN
        RAISE NOTICE 'Índice phone: ✅ Existe';
    ELSE
        RAISE NOTICE 'Índice phone: ❌ FALTA';
    END IF;

END $$;

-- Script para adicionar campos faltantes (se necessário)
-- Descomente e execute apenas se algum campo estiver faltando

/*
-- Adicionar campos se não existirem
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);

-- Adicionar chave primária se não existir
ALTER TABLE clients ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();

-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (se não existirem)
CREATE POLICY "Clients select own" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Clients insert own" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Clients update own" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Clients delete own" ON clients FOR DELETE USING (auth.uid() = user_id);
*/