-- MIGRAÇÃO: Adicionar campo para valor da entrada esperado
-- Permite controlar o valor da entrada planejado vs pago

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS payment_down_payment_expected DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN appointments.payment_down_payment_expected IS 'Valor da entrada esperado/planejado para o cliente';