-- MIGRAÇÃO: Adicionar campos para edição e WhatsApp nos agendamentos
-- Permite controlar edições e armazenar informações do WhatsApp

-- Adicionar campos para controle de edição
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES auth.users(id);

-- Adicionar campos para WhatsApp
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;

-- Comentários nos campos
COMMENT ON COLUMN appointments.last_edited_at IS 'Última vez que o agendamento foi editado';
COMMENT ON COLUMN appointments.edited_by IS 'Usuário que fez a última edição';
COMMENT ON COLUMN appointments.whatsapp_sent IS 'Indica se a mensagem do WhatsApp foi enviada';
COMMENT ON COLUMN appointments.whatsapp_sent_at IS 'Quando a mensagem do WhatsApp foi enviada';
COMMENT ON COLUMN appointments.whatsapp_message IS 'Conteúdo da última mensagem enviada por WhatsApp';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_last_edited_at ON appointments(last_edited_at);
CREATE INDEX IF NOT EXISTS idx_appointments_whatsapp_sent ON appointments(whatsapp_sent);