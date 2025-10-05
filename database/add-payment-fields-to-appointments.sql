-- MIGRAÇÃO: Adicionar campos de pagamento na tabela appointments
-- Adiciona controle financeiro completo aos agendamentos

-- Adicionar campos de pagamento
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS payment_down_payment_paid DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_total_service DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'partial'));

-- Comentários nos campos
COMMENT ON COLUMN appointments.payment_down_payment_paid IS 'Valor da entrada já pago pelo cliente';
COMMENT ON COLUMN appointments.payment_total_service IS 'Valor total do atendimento (soma de todos os serviços)';
COMMENT ON COLUMN appointments.payment_status IS 'Status do pagamento: paid (pago), pending (pendente), partial (parcial)';

-- Atualizar registros existentes com valores calculados
-- Para agendamentos existentes, definir payment_total_service baseado no total_received
-- e payment_down_payment_paid baseado no total_received (já que era pago integralmente)
UPDATE appointments
SET
    payment_total_service = COALESCE(total_received, 0),
    payment_down_payment_paid = COALESCE(total_received, 0),
    payment_status = CASE
        WHEN total_received > 0 THEN 'paid'
        ELSE 'pending'
    END
WHERE payment_total_service = 0 OR payment_total_service IS NULL;