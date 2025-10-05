-- FIX: Tornar scheduled_date e scheduled_time opcionais
-- Como estamos focando em testar a estrutura básica primeiro

ALTER TABLE appointments
ALTER COLUMN scheduled_date DROP NOT NULL,
ALTER COLUMN scheduled_time DROP NOT NULL;