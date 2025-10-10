-- ====================================================================
-- MIGRATION: Simplificar Status de Pagamento
-- Data: 10/10/2025
-- Descrição: Remove status 'partial' deixando apenas 'paid' e 'pending'
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

-- PASSO 1: Verificar status atuais ANTES da migração
DO $$
BEGIN
    RAISE NOTICE '=== VERIFICANDO STATUS ANTES DA MIGRAÇÃO ===';
END $$;

SELECT 'ANTES:' as momento, payment_status, COUNT(*) as total
FROM appointments 
GROUP BY payment_status
ORDER BY payment_status;

-- PASSO 2: Atualizar registros existentes com status 'partial' para 'pending'
UPDATE appointments 
SET payment_status = 'pending' 
WHERE payment_status = 'partial';

DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Registros atualizados de partial para pending: %', updated_count;
END $$;

-- PASSO 3: Remover constraint antigo
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_payment_status_check;

DO $$
BEGIN
    RAISE NOTICE 'Constraint antigo removido';
END $$;

-- PASSO 4: Adicionar novo constraint apenas com 'paid' e 'pending'
ALTER TABLE appointments 
ADD CONSTRAINT appointments_payment_status_check 
CHECK (payment_status = ANY (ARRAY['paid'::text, 'pending'::text]));

DO $$
BEGIN
    RAISE NOTICE 'Novo constraint adicionado (apenas paid e pending)';
END $$;

COMMIT;

COMMIT;

-- ====================================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ====================================================================

-- Verificar status DEPOIS da migração
SELECT 'DEPOIS:' as momento, payment_status, COUNT(*) as total
FROM appointments 
GROUP BY payment_status
ORDER BY payment_status;

-- Verificar o constraint atual
SELECT conname as constraint_name, 
       pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'appointments_payment_status_check';

-- Testar se o constraint está funcionando (DEVE DAR ERRO)
-- Descomente a linha abaixo para testar:
-- INSERT INTO appointments (user_id, payment_status) VALUES (auth.uid(), 'partial');
-- ❌ Erro esperado: new row violates check constraint "appointments_payment_status_check"

-- Resultado esperado da query de verificação:
-- momento | payment_status | total
-- --------+----------------+-------
-- DEPOIS  | paid           | X
-- DEPOIS  | pending        | Y
-- 
-- Não deve aparecer 'partial'!

-- ====================================================================
-- ROLLBACK (APENAS SE NECESSÁRIO - NÃO EXECUTE NORMALMENTE)
-- ====================================================================

/*
-- ATENÇÃO: Apenas execute se precisar REVERTER a migração

BEGIN;

-- 1. Remover constraint novo
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_payment_status_check;

-- 2. Adicionar constraint antigo (com 'partial')
ALTER TABLE appointments 
ADD CONSTRAINT appointments_payment_status_check 
CHECK (payment_status = ANY (ARRAY['paid'::text, 'pending'::text, 'partial'::text]));

COMMIT;

-- NOTA: Não há como restaurar automaticamente os registros que tinham 'partial'
-- pois a informação foi perdida na atualização para 'pending'
*/
