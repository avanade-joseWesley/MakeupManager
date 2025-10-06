-- MIGRAÇÃO: Adicionar campos estruturados de endereço na tabela appointments
-- Melhora a experiência com Maps e localização precisa

-- Adicionar campos estruturados de endereço
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS address_neighborhood TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS address_zipcode TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS address_complement TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS address_coordinates_lat DECIMAL(10,8);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS address_coordinates_lng DECIMAL(11,8);

-- Adicionar campos de horário obrigatório para agendamentos confirmados
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS scheduled_time_required BOOLEAN DEFAULT false;

-- Comentários nos campos
COMMENT ON COLUMN appointments.address_street IS 'Rua e número do endereço';
COMMENT ON COLUMN appointments.address_neighborhood IS 'Bairro do endereço';
COMMENT ON COLUMN appointments.address_city IS 'Cidade do endereço';
COMMENT ON COLUMN appointments.address_state IS 'Estado do endereço';
COMMENT ON COLUMN appointments.address_zipcode IS 'CEP do endereço';
COMMENT ON COLUMN appointments.address_complement IS 'Complemento do endereço (apartamento, bloco, etc.)';
COMMENT ON COLUMN appointments.address_coordinates_lat IS 'Latitude para integração com Maps';
COMMENT ON COLUMN appointments.address_coordinates_lng IS 'Longitude para integração com Maps';
COMMENT ON COLUMN appointments.scheduled_time_required IS 'Indica se horário é obrigatório (para agendamentos confirmados)';

-- Atualizar registros existentes
UPDATE appointments SET
  scheduled_time_required = CASE
    WHEN status = 'confirmed' THEN true
    ELSE false
  END;

-- Criar função para obter endereço completo formatado
CREATE OR REPLACE FUNCTION get_full_address(appointment_id UUID)
RETURNS TEXT AS $$
DECLARE
    addr_record RECORD;
    full_addr TEXT := '';
BEGIN
    SELECT
        address_street,
        address_neighborhood,
        address_city,
        address_state,
        address_zipcode,
        address_complement
    INTO addr_record
    FROM appointments
    WHERE id = appointment_id;

    -- Construir endereço completo
    IF addr_record.address_street IS NOT NULL THEN
        full_addr := addr_record.address_street;
    END IF;

    IF addr_record.address_neighborhood IS NOT NULL THEN
        IF full_addr != '' THEN full_addr := full_addr || ', '; END IF;
        full_addr := full_addr || addr_record.address_neighborhood;
    END IF;

    IF addr_record.address_city IS NOT NULL THEN
        IF full_addr != '' THEN full_addr := full_addr || ', '; END IF;
        full_addr := full_addr || addr_record.address_city;
    END IF;

    IF addr_record.address_state IS NOT NULL THEN
        IF full_addr != '' THEN full_addr := full_addr || ' - '; END IF;
        full_addr := full_addr || addr_record.address_state;
    END IF;

    IF addr_record.address_zipcode IS NOT NULL THEN
        IF full_addr != '' THEN full_addr := full_addr || ', '; END IF;
        full_addr := full_addr || 'CEP: ' || addr_record.address_zipcode;
    END IF;

    IF addr_record.address_complement IS NOT NULL THEN
        IF full_addr != '' THEN full_addr := full_addr || ' - '; END IF;
        full_addr := full_addr || addr_record.address_complement;
    END IF;

    RETURN COALESCE(full_addr, '');
END;
$$ LANGUAGE plpgsql;

-- Índices para performance em buscas por localização
CREATE INDEX IF NOT EXISTS idx_appointments_address_city ON appointments(address_city);
CREATE INDEX IF NOT EXISTS idx_appointments_address_neighborhood ON appointments(address_neighborhood);
CREATE INDEX IF NOT EXISTS idx_appointments_address_state ON appointments(address_state);
CREATE INDEX IF NOT EXISTS idx_appointments_coordinates ON appointments(address_coordinates_lat, address_coordinates_lng);

-- Trigger para manter compatibilidade com appointment_address antigo
CREATE OR REPLACE FUNCTION sync_appointment_address()
RETURNS TRIGGER AS $$
BEGIN
    -- Se os campos estruturados foram preenchidos, atualizar appointment_address
    IF NEW.address_street IS NOT NULL OR NEW.address_neighborhood IS NOT NULL OR
       NEW.address_city IS NOT NULL OR NEW.address_state IS NOT NULL THEN
        NEW.appointment_address := get_full_address(NEW.id);
    END IF;

    -- Se appointment_address foi atualizado e campos estruturados estão vazios, tentar parsear
    IF NEW.appointment_address IS NOT NULL AND OLD.appointment_address IS DISTINCT FROM NEW.appointment_address AND
       (NEW.address_street IS NULL AND NEW.address_neighborhood IS NULL AND
        NEW.address_city IS NULL AND NEW.address_state IS NULL) THEN
        -- Nota: Parsear endereço automaticamente seria complexo, melhor deixar manual
        -- ou implementar uma função específica para isso
        NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS sync_appointment_address_trigger ON appointments;
CREATE TRIGGER sync_appointment_address_trigger
    BEFORE INSERT OR UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION sync_appointment_address();