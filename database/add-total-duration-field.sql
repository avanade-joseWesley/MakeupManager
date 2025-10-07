-- MIGRAÇÃO: Adicionar campo total_duration_minutes na tabela appointments
-- Esta migração adiciona um campo para armazenar o tempo total do atendimento

DO $$
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'appointments'
                   AND column_name = 'total_duration_minutes') THEN

        -- Adicionar coluna total_duration_minutes
        ALTER TABLE appointments
        ADD COLUMN total_duration_minutes INTEGER DEFAULT 0;

        -- Adicionar comentário explicativo
        COMMENT ON COLUMN appointments.total_duration_minutes IS 'Tempo total estimado do atendimento em minutos (soma da duração de todos os serviços)';

        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_appointments_total_duration ON appointments(total_duration_minutes);

        RAISE NOTICE 'Campo total_duration_minutes adicionado com sucesso à tabela appointments';
    ELSE
        RAISE NOTICE 'Campo total_duration_minutes já existe na tabela appointments';
    END IF;
END $$;