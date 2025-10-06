-- MIGRAÇÃO: Criar tabelas appointments e appointment_services
-- Esta migração cria a estrutura completa para agendamentos com múltiplos serviços

-- Tabela principal de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_area_id UUID REFERENCES service_areas(id),

  -- Data e horário do agendamento
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,

  -- Status do agendamento
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),

  -- Localização específica do agendamento
  appointment_address TEXT,

  -- Valor total do atendimento
  payment_total_service DECIMAL(10,2) DEFAULT 0,

  -- Status do pagamento
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'partial')),

  -- Controle de edição
  last_edited_at TIMESTAMP WITH TIME ZONE,
  edited_by UUID REFERENCES auth.users(id),

  -- WhatsApp
  whatsapp_sent BOOLEAN DEFAULT false,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  whatsapp_message TEXT,

  -- Notas e observações
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de serviços realizados no agendamento
CREATE TABLE IF NOT EXISTS appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),

  -- Quantidade realizada
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),

  -- Preços
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- RLS para appointment_services
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;

-- Políticas para appointment_services (através do appointment_id)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointment_services' AND policyname = 'Users can view own appointment services') THEN
        CREATE POLICY "Users can view own appointment services" ON appointment_services FOR SELECT
        USING (EXISTS (SELECT 1 FROM appointments WHERE id = appointment_id AND user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointment_services' AND policyname = 'Users can insert own appointment services') THEN
        CREATE POLICY "Users can insert own appointment services" ON appointment_services FOR INSERT
        WITH CHECK (EXISTS (SELECT 1 FROM appointments WHERE id = appointment_id AND user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointment_services' AND policyname = 'Users can update own appointment services') THEN
        CREATE POLICY "Users can update own appointment services" ON appointment_services FOR UPDATE
        USING (EXISTS (SELECT 1 FROM appointments WHERE id = appointment_id AND user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointment_services' AND policyname = 'Users can delete own appointment services') THEN
        CREATE POLICY "Users can delete own appointment services" ON appointment_services FOR DELETE
        USING (EXISTS (SELECT 1 FROM appointments WHERE id = appointment_id AND user_id = auth.uid()));
    END IF;
END $$;

-- Trigger para updated_at em appointments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_appointments_updated_at') THEN
        CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointments_user_status ON appointments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_last_edited_at ON appointments(last_edited_at);
CREATE INDEX IF NOT EXISTS idx_appointments_whatsapp_sent ON appointments(whatsapp_sent);

CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id ON appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id ON appointment_services(service_id);

-- Comentários
COMMENT ON TABLE appointments IS 'Tabela principal de agendamentos';
COMMENT ON TABLE appointment_services IS 'Serviços realizados em cada agendamento';
COMMENT ON COLUMN appointments.total_received IS 'Valor total efetivamente recebido no atendimento';
COMMENT ON COLUMN appointments.payment_total_service IS 'Valor total do atendimento (soma de todos os serviços)';
COMMENT ON COLUMN appointments.payment_status IS 'Status do pagamento: paid (pago), pending (pendente), partial (parcial)';
COMMENT ON COLUMN appointments.last_edited_at IS 'Última vez que o agendamento foi editado';
COMMENT ON COLUMN appointments.edited_by IS 'Usuário que fez a última edição';
COMMENT ON COLUMN appointments.whatsapp_sent IS 'Indica se a mensagem do WhatsApp foi enviada';
COMMENT ON COLUMN appointments.whatsapp_sent_at IS 'Quando a mensagem do WhatsApp foi enviada';
COMMENT ON COLUMN appointments.whatsapp_message IS 'Conteúdo da última mensagem enviada por WhatsApp';
COMMENT ON COLUMN appointment_services.quantity IS 'Quantidade do serviço realizado';
COMMENT ON COLUMN appointment_services.unit_price IS 'Preço unitário praticado no atendimento';
COMMENT ON COLUMN appointment_services.total_price IS 'Preço total do serviço (unit_price × quantity)';