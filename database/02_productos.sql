-- TABLA DE CATÁLOGO DE PRODUCTOS (SKUs)

CREATE TABLE public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    color TEXT NOT NULL,
    ram TEXT,
    almacenamiento TEXT NOT NULL,
    precio NUMERIC(12, 2) NOT NULL
);

-- SEGURIDAD (RLS)
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;

-- Lectura: Todos los autenticados (incluido Closer)
CREATE POLICY "Permitir lectura de productos a todos" 
ON public.productos FOR SELECT TO authenticated USING (true);

-- Escritura: Solo Admin o Supervisor
CREATE POLICY "Admin y Supervisor pueden modificar productos" 
ON public.productos FOR ALL TO authenticated 
USING (EXISTS (
    SELECT 1 FROM perfiles 
    WHERE perfiles.id = auth.uid() 
    AND perfiles.role IN ('Admin', 'Supervisor')
));
