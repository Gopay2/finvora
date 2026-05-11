-- 1. TIPOS ENUMERADOS
CREATE TYPE user_role AS ENUM ('Admin', 'Closer', 'Supervisor', 'Developer');

-- 2. TABLAS
CREATE TABLE public.perfiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  role user_role DEFAULT 'Closer' NOT NULL
);

-- 3. SEGURIDAD (RLS)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.perfiles TO authenticated;

-- Lectura: Todos pueden ver los perfiles para identificar roles
CREATE POLICY "Lectura de perfiles para autenticados" 
ON public.perfiles FOR SELECT TO authenticated USING (true);

-- Escritura: Usuarios pueden actualizar su propio username
CREATE POLICY "Usuarios pueden actualizar su propio username" 
ON public.perfiles FOR UPDATE TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. AUTOMATIZACIÓN (TRIGGERS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, role, email)
  VALUES (new.id, 'Closer', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
