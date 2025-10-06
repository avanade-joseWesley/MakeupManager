-- MIGRAÇÃO: Adicionar status 'completed' e 'cancelled' aos agendamentos
-- Permite marcar agendamentos como realizados ou cancelados

-- Verificar se a constraint de status existe e atualizá-la
DO $$
BEGIN
    -- Remover a constraint existente se ela existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'appointments_status_check'
        AND table_name = 'appointments'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;
    END IF;

    -- Adicionar nova constraint com os status atualizados
    ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));
END $$;

-- Comentário atualizado para o campo status
COMMENT ON COLUMN appointments.status IS 'Status do agendamento: pending (pendente), confirmed (confirmado), completed (realizado), cancelled (cancelado)';

-- Atualizar registros existentes que possam ter status inválidos para 'pending'
UPDATE appointments
SET status = 'pending'
WHERE status NOT IN ('pending', 'confirmed', 'completed', 'cancelled');