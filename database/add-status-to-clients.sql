-- MIGRAÇÃO: Adicionar coluna status à tabela clients
-- Esta migração adiciona suporte para agendamentos confirmados e pendentes

-- Adicionar coluna status à tabela clients (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'clients' AND column_name = 'status') THEN
        ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed'));
    END IF;
END $$;

-- Atualizar registros existentes sem status para 'confirmed' (se eram criados como confirmados antes)
UPDATE clients SET status = 'confirmed' WHERE status IS NULL;

-- Criar índice para a coluna status (para consultas mais rápidas)
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Criar índice composto para user_id + status (comum para filtros)
CREATE INDEX IF NOT EXISTS idx_clients_user_status ON clients(user_id, status);

-- Comentário na coluna para documentação
COMMENT ON COLUMN clients.status IS 'Status do agendamento: pending (pendente) ou confirmed (confirmado)';