-- CORREÇÃO: Políticas para profiles (que estava faltando no migrations-safe)
DO $$
BEGIN
    -- Políticas para profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
        CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END
$$;

-- NOVA FUNCIONALIDADE: Tabela de preços por região
CREATE TABLE IF NOT EXISTS service_regional_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  service_area_id UUID REFERENCES service_areas(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_id, service_area_id)
);

-- RLS para service_regional_prices
ALTER TABLE service_regional_prices ENABLE ROW LEVEL SECURITY;

-- Políticas para service_regional_prices
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_regional_prices' AND policyname = 'Users can view own regional prices') THEN
        CREATE POLICY "Users can view own regional prices" ON service_regional_prices FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_regional_prices' AND policyname = 'Users can insert own regional prices') THEN
        CREATE POLICY "Users can insert own regional prices" ON service_regional_prices FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_regional_prices' AND policyname = 'Users can update own regional prices') THEN
        CREATE POLICY "Users can update own regional prices" ON service_regional_prices FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_regional_prices' AND policyname = 'Users can delete own regional prices') THEN
        CREATE POLICY "Users can delete own regional prices" ON service_regional_prices FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Trigger para service_regional_prices
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_service_regional_prices_updated_at') THEN
        CREATE TRIGGER update_service_regional_prices_updated_at BEFORE UPDATE ON service_regional_prices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END
$$;