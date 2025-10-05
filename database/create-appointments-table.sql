-- MIGRAÇÃO: Criar tabela appointments para agendamentos
-- Esta migração cria a estrutura completa para agendamentos

-- Criar tabela appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  service_area_id UUID REFERENCES service_areas(id) ON DELETE CASCADE,

  -- Quantidade de serviços iguais
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),

  -- Data e horário
  scheduled_date DATE,
  scheduled_time TIME,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),

  -- Financeiro
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  -- Localização específica do agendamento
  appointment_address TEXT,

  -- Notas e observações
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para appointments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can view own appointments') THEN
        CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can insert own appointments') THEN
        CREATE POLICY "Users can insert own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can update own appointments') THEN
        CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Users can delete own appointments') THEN
        CREATE POLICY "Users can delete own appointments" ON appointments FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Trigger para updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_appointments_updated_at') THEN
        CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_user_status ON appointments(user_id, status);

-- Comentários
COMMENT ON TABLE appointments IS 'Tabela de agendamentos de serviços';
COMMENT ON COLUMN appointments.quantity IS 'Quantidade de serviços iguais (ex: 4 maquiagens para madrinhas)';
COMMENT ON COLUMN appointments.unit_price IS 'Preço unitário do serviço';
COMMENT ON COLUMN appointments.total_price IS 'Preço total calculado (unit_price × quantity)';
COMMENT ON COLUMN appointments.appointment_address IS 'Endereço específico do agendamento (se diferente do cliente)';