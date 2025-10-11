-- Query para buscar appointments onde valor do serviço = valor total do atendimento
-- Isso indica que não há taxa de deslocamento ou que os valores estão iguais

SELECT 
  id,
  scheduled_date,
  scheduled_time,
  status,
  payment_total_service,
  travel_fee,
  payment_total_appointment,
  is_custom_price,
  total_amount_paid,
  created_at
FROM appointments
WHERE payment_total_service = payment_total_appointment
  AND payment_total_service IS NOT NULL
  AND payment_total_appointment IS NOT NULL
ORDER BY scheduled_date DESC, scheduled_time DESC;

-- Query com informações do cliente junto
SELECT 
  a.id,
  a.scheduled_date,
  a.scheduled_time,
  a.status,
  c.name as client_name,
  c.phone as client_phone,
  a.payment_total_service,
  a.travel_fee,
  a.payment_total_appointment,
  a.is_custom_price,
  a.total_amount_paid,
  (a.payment_total_appointment - a.total_amount_paid) as pending_amount,
  a.created_at
FROM appointments a
LEFT JOIN clients c ON a.client_id = c.id
WHERE a.payment_total_service = a.payment_total_appointment
  AND a.payment_total_service IS NOT NULL
  AND a.payment_total_appointment IS NOT NULL
ORDER BY a.scheduled_date DESC, a.scheduled_time DESC;

-- Query para contar quantos appointments estão nessa situação
SELECT 
  COUNT(*) as total_appointments,
  COUNT(CASE WHEN travel_fee = 0 THEN 1 END) as with_zero_travel_fee,
  COUNT(CASE WHEN travel_fee IS NULL THEN 1 END) as with_null_travel_fee,
  COUNT(CASE WHEN travel_fee > 0 THEN 1 END) as with_positive_travel_fee,
  COUNT(CASE WHEN is_custom_price = TRUE THEN 1 END) as custom_price_count,
  COUNT(CASE WHEN is_custom_price = FALSE THEN 1 END) as calculated_price_count
FROM appointments
WHERE payment_total_service = payment_total_appointment
  AND payment_total_service IS NOT NULL
  AND payment_total_appointment IS NOT NULL;

-- Query para identificar possíveis inconsistências
-- (quando serviço = total mas há taxa de deslocamento positiva)
SELECT 
  a.id,
  a.scheduled_date,
  c.name as client_name,
  a.payment_total_service,
  a.travel_fee,
  a.payment_total_appointment,
  a.is_custom_price,
  CASE 
    WHEN a.travel_fee > 0 AND a.payment_total_service = a.payment_total_appointment 
    THEN 'INCONSISTÊNCIA: Taxa > 0 mas Total = Serviço'
    WHEN a.travel_fee = 0 AND a.payment_total_service = a.payment_total_appointment
    THEN 'OK: Sem taxa de deslocamento'
    ELSE 'Outros'
  END as observation
FROM appointments a
LEFT JOIN clients c ON a.client_id = c.id
WHERE a.payment_total_service = a.payment_total_appointment
  AND a.payment_total_service IS NOT NULL
  AND a.payment_total_appointment IS NOT NULL
ORDER BY a.travel_fee DESC, a.scheduled_date DESC;
