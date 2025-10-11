-- Migração 004: Adicionar campo travel_fee e is_custom_price à tabela appointments
-- Data: 2025-10-11
-- Descrição: Campos para armazenar a taxa de deslocamento e identificar valores personalizados

-- ============================================================================
-- PASSO 1: Executar PRIMEIRO (criar as colunas)
-- ============================================================================

-- 1. Adicionar coluna travel_fee
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS travel_fee NUMERIC(10,2) DEFAULT 0;

-- 2. Adicionar coluna is_custom_price (indica se foi usado valor diferenciado/personalizado)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS is_custom_price BOOLEAN DEFAULT FALSE;

-- Comentários nas colunas
COMMENT ON COLUMN appointments.travel_fee IS 'Taxa de deslocamento cobrada no atendimento (em reais)';
COMMENT ON COLUMN appointments.is_custom_price IS 'Indica se o atendimento usa valor personalizado/diferenciado (TRUE) ou valor calculado por serviços (FALSE)';


-- ============================================================================
-- PASSO 2: Executar DEPOIS que o PASSO 1 concluir (popular os dados históricos)
-- ============================================================================

-- 3. CORREÇÃO: Atualizar payment_total_appointment zerado
--    Se payment_total_appointment está zerado mas payment_total_service tem valor,
--    copiar o valor do serviço para o total (dados históricos incompletos)
UPDATE appointments
SET payment_total_appointment = payment_total_service
WHERE (payment_total_appointment IS NULL OR payment_total_appointment = 0)
  AND payment_total_service IS NOT NULL
  AND payment_total_service > 0;

-- 4. Identificar valores personalizados existentes (baseado nas notas)
UPDATE appointments
SET is_custom_price = TRUE
WHERE notes LIKE '%diferenciado%' OR notes LIKE '%Valor diferenciado%';

-- 5. Atualizar valores existentes de travel_fee
-- Lógica: Se (payment_total_appointment - payment_total_service) for positiva,
--         significa que há taxa de deslocamento real.
--         Caso contrário (zero, negativo, ou valor personalizado), travel_fee = 0
UPDATE appointments
SET travel_fee = CASE 
  WHEN is_custom_price = TRUE THEN 0  -- Valor personalizado não tem taxa separada
  WHEN (COALESCE(payment_total_appointment, 0) - COALESCE(payment_total_service, 0)) > 0 
  THEN (COALESCE(payment_total_appointment, 0) - COALESCE(payment_total_service, 0))
  ELSE 0  -- Sem taxa, desconto, ou dados inconsistentes
END;

-- 6. Garantir que não existam valores negativos (dupla verificação)
UPDATE appointments
SET travel_fee = 0
WHERE travel_fee < 0;


-- ============================================================================
-- PASSO 3: Executar POR ÚLTIMO (validar os resultados)
-- ============================================================================

-- Verificar se ainda existem registros com payment_total_appointment zerado
SELECT 
  COUNT(*) as registros_com_total_zerado
FROM appointments
WHERE (payment_total_appointment IS NULL OR payment_total_appointment = 0)
  AND payment_total_service > 0;

-- Investigar casos com dados inconsistentes (total menor que serviços)
SELECT 
  id,
  is_custom_price,
  payment_total_service,
  travel_fee,
  payment_total_appointment,
  (payment_total_appointment - payment_total_service) as difference,
  notes
FROM appointments
WHERE payment_total_appointment IS NOT NULL
  AND payment_total_service IS NOT NULL
  AND payment_total_appointment < payment_total_service
ORDER BY created_at DESC
LIMIT 10;

-- Verificar resultados gerais
SELECT 
  id,
  is_custom_price,
  payment_total_service,
  travel_fee,
  payment_total_appointment,
  (payment_total_service + travel_fee) as calculated_total,
  notes
FROM appointments
WHERE payment_total_appointment IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Verificar valores personalizados identificados
SELECT 
  id,
  is_custom_price,
  payment_total_service,
  travel_fee,
  payment_total_appointment,
  notes
FROM appointments
WHERE is_custom_price = TRUE
LIMIT 5;

-- Validação final: Verificar consistência dos dados
SELECT 
  COUNT(*) as total_appointments,
  COUNT(CASE WHEN is_custom_price = TRUE THEN 1 END) as custom_price_count,
  COUNT(CASE WHEN is_custom_price = FALSE THEN 1 END) as calculated_price_count,
  COUNT(CASE WHEN travel_fee > 0 THEN 1 END) as with_travel_fee,
  COUNT(CASE WHEN travel_fee = 0 THEN 1 END) as without_travel_fee,
  COUNT(CASE WHEN travel_fee > 0 AND (payment_total_service + travel_fee) = payment_total_appointment THEN 1 END) as consistent_with_fee
FROM appointments
WHERE payment_total_appointment IS NOT NULL;
