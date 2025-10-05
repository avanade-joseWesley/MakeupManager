-- VERIFICAÇÃO RÁPIDA: Estrutura das tabelas appointments
-- Execute este script para verificar se as tabelas foram criadas corretamente

-- Verificar se a tabela appointments existe
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'appointments';

-- Verificar estrutura da tabela appointments
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Verificar se a tabela appointment_services existe
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'appointment_services';

-- Verificar estrutura da tabela appointment_services
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'appointment_services'
ORDER BY ordinal_position;

-- Verificar políticas RLS das tabelas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('appointments', 'appointment_services')
ORDER BY tablename, policyname;