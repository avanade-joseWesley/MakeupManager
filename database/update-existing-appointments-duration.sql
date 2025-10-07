-- SCRIPT: Atualizar agendamentos existentes com tempo total
-- Este script calcula e atualiza o tempo total para agendamentos existentes

DO $$
DECLARE
    appointment_record RECORD;
    total_duration INTEGER;
BEGIN
    -- Para cada agendamento existente
    FOR appointment_record IN
        SELECT a.id, a.user_id
        FROM appointments a
        WHERE a.total_duration_minutes = 0 OR a.total_duration_minutes IS NULL
    LOOP
        -- Calcular o tempo total baseado nos serviços do agendamento
        SELECT COALESCE(SUM(s.duration_minutes * COALESCE(aps.quantity, 1)), 0)::INTEGER
        INTO total_duration
        FROM appointment_services aps
        JOIN services s ON s.id = aps.service_id
        WHERE aps.appointment_id = appointment_record.id;

        -- Atualizar o agendamento com o tempo total calculado
        UPDATE appointments
        SET total_duration_minutes = total_duration
        WHERE id = appointment_record.id;

        RAISE NOTICE 'Atualizado agendamento % com tempo total: % minutos', appointment_record.id, total_duration;
    END LOOP;

    RAISE NOTICE 'Script de atualização de tempo total concluído';
END $$;