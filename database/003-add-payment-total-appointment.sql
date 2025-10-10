-- ====================================================================
-- MIGRATION: Adicionar Campo Payment Total Appointment
-- Data: 10/10/2025
-- Descrição: Adiciona campo para o valor total do atendimento (serviços + taxas)
-- ====================================================================

-- ⚠️ INSTRUÇÕES DE EXECUÇÃO:
-- 1. Execute DEPOIS da migration 002-add-total-amount-paid.sql
-- 2. Acesse o Supabase Dashboard
-- 3. Vá em SQL Editor
-- 4. Cole este script COMPLETO
-- 5. Execute (botão RUN ou Ctrl+Enter)

-- ====================================================================
-- INÍCIO DA MIGRATION
-- ====================================================================

BEGIN;

-- PASSO 1: Adicionar novo campo
DO $$
BEGIN
    RAISE NOTICE '=== ADICIONANDO CAMPO payment_total_appointment ===';
END $$;

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS payment_total_appointment NUMERIC(10, 2) DEFAULT 0 NOT NULL;

DO $$
BEGIN
    RAISE NOTICE 'Campo payment_total_appointment adicionado com sucesso';
END $$;

-- PASSO 2: Migrar dados existentes
-- Inicialmente, payment_total_appointment = payment_total_service
-- (Depois você pode atualizar manualmente os que tiverem taxa de deslocamento)
DO $$
BEGIN
    RAISE NOTICE '=== MIGRANDO DADOS EXISTENTES ===';
END $$;

UPDATE appointments
SET payment_total_appointment = COALESCE(payment_total_service, 0)
WHERE payment_total_appointment = 0;

DO $$
DECLARE
    migrated_count INTEGER;
BEGIN
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE 'Registros migrados: %', migrated_count;
END $$;

-- PASSO 3: Criar índice para performance
DO $$
BEGIN
    RAISE NOTICE '=== CRIANDO ÍNDICE ===';
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_payment_total_appointment 
ON appointments(payment_total_appointment);

DO $$
BEGIN
    RAISE NOTICE 'Índice criado com sucesso';
END $$;

-- PASSO 4: Adicionar comentário para documentação
COMMENT ON COLUMN appointments.payment_total_appointment IS 
'Valor total que o cliente vai pagar no atendimento (serviços + taxa de deslocamento + extras). Este é o valor final cobrado.';

DO $$
BEGIN
    RAISE NOTICE 'Documentação adicionada';
END $$;

COMMIT;

-- ====================================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ====================================================================

-- Verificar estrutura da coluna
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'appointments' 
  AND column_name = 'payment_total_appointment';

-- Verificar dados migrados
SELECT 
    COUNT(*) as total_registros,
    AVG(payment_total_appointment) as media_total_appointment,
    MAX(payment_total_appointment) as maior_valor,
    MIN(payment_total_appointment) as menor_valor
FROM appointments;

-- Comparar payment_total_service com payment_total_appointment
SELECT 
    id,
    payment_total_service as valor_servicos,
    payment_total_appointment as valor_total_atendimento,
    (payment_total_appointment - payment_total_service) as diferenca_taxa,
    total_amount_paid as valor_pago,
    (payment_total_appointment - total_amount_paid) as valor_pendente
FROM appointments
ORDER BY created_at DESC
LIMIT 5;

-- ====================================================================
-- PRÓXIMOS PASSOS MANUAIS
-- ====================================================================

-- Se você tem agendamentos que incluem taxa de deslocamento,
-- precisa atualizar manualmente o payment_total_appointment

-- EXEMPLO: Atendimento com taxa de deslocamento de R$ 50
/*
UPDATE appointments
SET payment_total_appointment = payment_total_service + 50.00
WHERE service_area_id = 'uuid-da-area-com-taxa';
*/

-- EXEMPLO: Atualizar baseado na taxa cadastrada na área
/*
UPDATE appointments a
SET payment_total_appointment = a.payment_total_service + COALESCE(sa.travel_fee, 0)
FROM service_areas sa
WHERE a.service_area_id = sa.id
  AND sa.travel_fee > 0;
*/

-- ====================================================================
-- RESULTADO ESPERADO
-- ====================================================================

-- A coluna payment_total_appointment deve existir
-- Registros existentes devem ter payment_total_appointment = payment_total_service
-- (Inicialmente sem taxa de deslocamento, você ajusta depois)
-- Índice deve estar criado

-- ====================================================================
-- ROLLBACK (APENAS SE NECESSÁRIO - NÃO EXECUTE NORMALMENTE)
-- ====================================================================

/*
-- ATENÇÃO: Apenas execute se precisar REVERTER a migração

BEGIN;

-- Remover índice
DROP INDEX IF EXISTS idx_appointments_payment_total_appointment;

-- Remover coluna (CUIDADO: dados serão perdidos!)
ALTER TABLE appointments 
DROP COLUMN IF EXISTS payment_total_appointment;

COMMIT;
*/
