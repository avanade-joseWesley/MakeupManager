-- Remover campo payment_down_payment_pending da tabela appointments
-- Este campo não é mais necessário pois simplificamos o sistema de pagamentos

ALTER TABLE appointments DROP COLUMN IF EXISTS payment_down_payment_pending;

-- Atualizar registros existentes para garantir consistência
-- Como removemos o campo, os registros existentes terão apenas payment_down_payment_paid