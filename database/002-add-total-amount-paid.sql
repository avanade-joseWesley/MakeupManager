-- ====================================================================
-- MIGRATION: Adicionar Campo Total Amount Paid
-- Data: 10/10/2025
-- Descrição: Adiciona campo para rastrear o valor total já pago pelo cliente
-- ====================================================================

-- ⚠️ INSTRUÇÕES DE EXECUÇÃO:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script COMPLETO
-- 4. Execute (botão RUN ou Ctrl+Enter)
-- 5. Verifique os resultados das queries de verificação no final

-- ====================================================================
-- INÍCIO DA MIGRATION
-- ====================================================================

BEGIN;

-- PASSO 1: Adicionar novo campo
DO $$
BEGIN
    RAISE NOTICE '=== ADICIONANDO CAMPO total_amount_paid ===';
END $$;

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS total_amount_paid NUMERIC(10, 2) DEFAULT 0 NOT NULL;

DO $$
BEGIN
    RAISE NOTICE 'Campo total_amount_paid adicionado com sucesso';
END $$;

-- PASSO 2: Migrar dados existentes
-- Copiar valores de payment_down_payment_paid para total_amount_paid
DO $$
BEGIN
    RAISE NOTICE '=== MIGRANDO DADOS EXISTENTES ===';
END $$;

UPDATE appointments
SET total_amount_paid = COALESCE(payment_down_payment_paid, 0)
WHERE total_amount_paid = 0;

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

CREATE INDEX IF NOT EXISTS idx_appointments_total_amount_paid 
ON appointments(total_amount_paid);

DO $$
BEGIN
    RAISE NOTICE 'Índice criado com sucesso';
END $$;

-- PASSO 4: Adicionar comentário para documentação
COMMENT ON COLUMN appointments.total_amount_paid IS 
'Valor total já pago pelo cliente (entrada + pagamentos adicionais). Usado para calcular valor pendente.';

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
  AND column_name = 'total_amount_paid';

-- Verificar dados migrados
SELECT 
    COUNT(*) as total_registros,
    SUM(CASE WHEN total_amount_paid > 0 THEN 1 ELSE 0 END) as com_pagamento,
    SUM(CASE WHEN total_amount_paid = 0 THEN 1 ELSE 0 END) as sem_pagamento,
    AVG(total_amount_paid) as media_pago,
    MAX(total_amount_paid) as maior_valor
FROM appointments;

-- Verificar alguns registros de exemplo
SELECT 
    id,
    payment_total_service as total_servico,
    payment_down_payment_paid as entrada_paga,
    total_amount_paid as total_pago,
    (payment_total_service - total_amount_paid) as valor_pendente,
    payment_status
FROM appointments
ORDER BY created_at DESC
LIMIT 5;

-- ====================================================================
-- RESULTADO ESPERADO
-- ====================================================================

-- A coluna total_amount_paid deve existir
-- Registros existentes devem ter total_amount_paid = payment_down_payment_paid
-- Índice deve estar criado
-- Todos os valores devem ser >= 0

-- ====================================================================
-- ROLLBACK (APENAS SE NECESSÁRIO - NÃO EXECUTE NORMALMENTE)
-- ====================================================================

/*
-- ATENÇÃO: Apenas execute se precisar REVERTER a migração

BEGIN;

-- Remover índice
DROP INDEX IF EXISTS idx_appointments_total_amount_paid;

-- Remover coluna (CUIDADO: dados serão perdidos!)
ALTER TABLE appointments 
DROP COLUMN IF EXISTS total_amount_paid;

COMMIT;
*/
