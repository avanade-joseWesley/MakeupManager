-- CORREÇÃO DEFINITIVA PARA PROFILES
-- Primeiro, vamos dropar as políticas existentes se houver conflito
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;  
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recriar as políticas corretamente
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Verificar se a função auth.uid() está funcionando
-- Execute esta query para testar:
-- SELECT auth.uid(), current_user;

-- Garantir que a tabela profiles está correta
-- Se necessário, podemos recriar a tabela (descomente as linhas abaixo apenas se necessário)
/*
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  bio TEXT,
  address TEXT,
  instagram TEXT,
  experience_years INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
*/