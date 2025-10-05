-- TESTE RÁPIDO: Verificar se agendamentos estão sendo criados
-- Execute após testar a criação de agendamento no frontend

-- Ver todos os agendamentos criados hoje
SELECT
    a.id,
    a.created_at,
    a.status,
    a.total_received,
    c.name as client_name,
    sa.name as area_name,
    COUNT(asv.*) as services_count,
    COALESCE(SUM(asv.total_price), 0) as services_total
FROM appointments a
JOIN clients c ON a.client_id = c.id
JOIN service_areas sa ON a.service_area_id = sa.id
LEFT JOIN appointment_services asv ON a.id = asv.appointment_id
WHERE DATE(a.created_at) = CURRENT_DATE
GROUP BY a.id, a.created_at, a.status, a.total_received, c.name, sa.name
ORDER BY a.created_at DESC;

-- Ver detalhes dos serviços do último agendamento
SELECT
    'Último agendamento criado:' as info,
    a.id as appointment_id,
    a.status,
    a.total_received,
    c.name as client_name
FROM appointments a
JOIN clients c ON a.client_id = c.id
ORDER BY a.created_at DESC
LIMIT 1;

-- Serviços do último agendamento
SELECT
    s.name as service_name,
    asv.quantity,
    asv.unit_price,
    asv.total_price
FROM appointment_services asv
JOIN services s ON asv.service_id = s.id
WHERE asv.appointment_id = (
    SELECT id FROM appointments ORDER BY created_at DESC LIMIT 1
);