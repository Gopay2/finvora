-- TABLA DE INVENTARIO FÍSICO (Solo lo disponible para venta)

CREATE TABLE public.stock (
    imei TEXT PRIMARY KEY,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    zona TEXT NOT NULL,
    estado TEXT DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'En envío', 'Vendido')),
    fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SEGURIDAD (RLS)
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

-- Lectura: Todos los autenticados (incluido Closer)
CREATE POLICY "Permitir lectura de stock a todos" 
ON public.stock FOR SELECT TO authenticated USING (true);

-- Escritura: Admin, Supervisor o Developer
CREATE POLICY "Admin, Supervisor y Developer pueden modificar stock" 
ON public.stock FOR ALL TO authenticated 
USING (EXISTS (
    SELECT 1 FROM perfiles 
    WHERE perfiles.id = auth.uid() 
    AND perfiles.role IN ('Admin', 'Supervisor', 'Developer')
));
