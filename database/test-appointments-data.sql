-- TESTE FUNCIONAL: Inserir dados de teste nas tabelas appointments
-- Execute este script APENAS se quiser inserir dados de teste
-- IMPORTANTE: Substitua os UUIDs pelos IDs reais do seu usuário e dados existentes

-- ⚠️  ATENÇÃO: Este script insere dados de teste
-- Execute apenas se quiser testar com dados reais
-- Certifique-se de que os IDs existem nas tabelas relacionadas

DO $$
DECLARE
    test_user_id UUID := 'SEU_USER_ID_AQUI'; -- Substitua pelo seu user_id real
    test_client_id UUID;
    test_service_area_id UUID;
    test_service_id UUID;
    test_appointment_id UUID;
BEGIN
    -- Verificar se temos dados para testar
    SELECT id INTO test_client_id FROM clients WHERE user_id = test_user_id LIMIT 1;
    SELECT id INTO test_service_area_id FROM service_areas WHERE user_id = test_user_id LIMIT 1;
    SELECT id INTO test_service_id FROM services WHERE user_id = test_user_id LIMIT 1;

    IF test_client_id IS NULL OR test_service_area_id IS NULL OR test_service_id IS NULL THEN
        RAISE NOTICE '❌ Dados insuficientes para teste. Verifique se existem: clients, service_areas e services para o usuário';
        RETURN;
    END IF;

    -- 1. Criar um agendamento de teste
    INSERT INTO appointments (
        user_id, client_id, service_area_id,
        scheduled_date, scheduled_time, status,
        appointment_address, total_received, notes
    ) VALUES (
        test_user_id, test_client_id, test_service_area_id,
        CURRENT_DATE + INTERVAL '1 day', '14:00:00', 'confirmed',
        'Endereço de teste', 150.00, 'Agendamento de teste'
    ) RETURNING id INTO test_appointment_id;

    RAISE NOTICE '✅ Agendamento criado com ID: %', test_appointment_id;

    -- 2. Adicionar serviços ao agendamento
    INSERT INTO appointment_services (
        appointment_id, service_id, quantity, unit_price, total_price
    ) VALUES (
        test_appointment_id, test_service_id, 1, 120.00, 120.00
    );

    INSERT INTO appointment_services (
        appointment_id, service_id, quantity, unit_price, total_price
    ) VALUES (
        test_appointment_id, test_service_id, 1, 30.00, 30.00
    );

    RAISE NOTICE '✅ Serviços adicionados ao agendamento';

    -- 3. Verificar os dados inseridos
    RAISE NOTICE '=== DADOS DO AGENDAMENTO ===';
    FOR rec IN
        SELECT a.scheduled_date, a.scheduled_time, a.status, a.total_received,
               c.name as client_name,
               COUNT(asv.*) as services_count,
               SUM(asv.total_price) as services_total
        FROM appointments a
        JOIN clients c ON a.client_id = c.id
        LEFT JOIN appointment_services asv ON a.id = asv.appointment_id
        WHERE a.id = test_appointment_id
        GROUP BY a.id, a.scheduled_date, a.scheduled_time, a.status, a.total_received, c.name
    LOOP
        RAISE NOTICE 'Data: %, Hora: %, Status: %, Recebido: R$%, Cliente: %, Serviços: %, Total Serviços: R$%',
            rec.scheduled_date, rec.scheduled_time, rec.status, rec.total_received,
            rec.client_name, rec.services_count, rec.services_total;
    END LOOP;

    RAISE NOTICE '=== SERVIÇOS DETALHADOS ===';
    FOR rec IN
        SELECT s.name, asv.quantity, asv.unit_price, asv.total_price
        FROM appointment_services asv
        JOIN services s ON asv.service_id = s.id
        WHERE asv.appointment_id = test_appointment_id
    LOOP
        RAISE NOTICE 'Serviço: %, Qtd: %, Unit: R$%, Total: R$%',
            rec.name, rec.quantity, rec.unit_price, rec.total_price;
    END LOOP;

    -- 4. Limpar dados de teste (opcional - descomente se quiser remover)
    -- DELETE FROM appointment_services WHERE appointment_id = test_appointment_id;
    -- DELETE FROM appointments WHERE id = test_appointment_id;
    -- RAISE NOTICE '🗑️ Dados de teste removidos';

END $$;