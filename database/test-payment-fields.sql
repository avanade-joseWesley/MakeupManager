-- TESTE: Verificar campos de pagamento nos agendamentos
-- Execute após criar agendamentos com informações de pagamento

-- Ver agendamentos com informações de pagamento
SELECT
    a.id,
    a.created_at,
    a.status,
    c.name as client_name,
    a.total_received as valor_recebido,
    a.payment_down_payment_paid as entrada_paga,
    a.payment_total_service as valor_total,
    (a.payment_total_service - a.total_received) as valor_pendente,
    a.payment_status,
    COUNT(asv.*) as services_count
FROM appointments a
JOIN clients c ON a.client_id = c.id
LEFT JOIN appointment_services asv ON a.id = asv.appointment_id
WHERE DATE(a.created_at) = CURRENT_DATE
GROUP BY a.id, a.created_at, a.status, c.name, a.total_received, a.payment_down_payment_paid,
         a.payment_total_service, a.payment_status
ORDER BY a.created_at DESC;

-- Verificar se os campos foram criados corretamente
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'appointments'
AND column_name LIKE 'payment_%'
ORDER BY column_name;

-- Exemplo de consulta para agendamentos pagos
SELECT
    'Agendamentos pagos:' as info,
    COUNT(*) as count
FROM appointments
WHERE payment_status = 'paid';

-- Exemplo de consulta para agendamentos com entrada paga
SELECT
    'Agendamentos com entrada paga:' as info,
    COUNT(*) as count
FROM appointments
WHERE payment_down_payment_paid > 0;

-- Exemplo de consulta para agendamentos com valores pendentes
SELECT
    'Agendamentos com valores pendentes:' as info,
    COUNT(*) as count,
    SUM(payment_total_service - total_received) as total_pendente
FROM appointments
WHERE payment_total_service > total_received;

-- Exemplo de consulta para agendamentos com pagamento parcial
SELECT
    'Agendamentos com pagamento parcial:' as info,
    COUNT(*) as count
FROM appointments
WHERE payment_status = 'partial';