-- TESTE: Verificar se as tabelas appointments foram criadas corretamente
-- Execute este script no Supabase SQL Editor para testar as tabelas

-- 1. Verificar se as tabelas existem
SELECT 'appointments table exists' as test,
       EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'appointments') as result
UNION ALL
SELECT 'appointment_services table exists',
       EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'appointment_services');

-- 2. Verificar estrutura da tabela appointments
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'appointments'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela appointment_services
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'appointment_services'
ORDER BY ordinal_position;

-- 4. Verificar RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('appointments', 'appointment_services');

-- 5. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('appointments', 'appointment_services')
ORDER BY tablename, policyname;

-- 6. Verificar índices
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public' AND tablename IN ('appointments', 'appointment_services')
ORDER BY tablename, indexname;

-- 7. Teste básico de INSERT (vai falhar por causa do RLS, mas mostra se a tabela existe)
-- DESCOMENTE PARA TESTAR:
-- INSERT INTO appointments (user_id, client_id, service_area_id, scheduled_date, scheduled_time)
-- VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', '2025-10-05', '14:00:00');