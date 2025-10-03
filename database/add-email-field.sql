-- ADICIONAR CAMPO EMAIL À TABELA PROFILES
-- Campo opcional para email do usuário

-- Adicionar coluna email (se não existir)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Verificar estrutura da tabela
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;