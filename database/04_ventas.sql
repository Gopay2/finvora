-- TABLA DE VENTAS (Historial de salidas de equipos)

CREATE TABLE public.ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imei TEXT NOT NULL,
    producto_id UUID NOT NULL REFERENCES public.productos(id) ON DELETE RESTRICT,
    vendedor_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
    zona TEXT NOT NULL,
    precio_costo DECIMAL(12,2),
    fecha_ingreso TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SEGURIDAD (RLS)
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

-- Política de LECTURA: Solo Admin, Supervisor y Developer pueden ver el historial de ventas
CREATE POLICY "Solo Admin, Supervisor y Developer pueden ver ventas" 
ON public.ventas FOR SELECT TO authenticated 
USING (EXISTS (
    SELECT 1 FROM perfiles 
    WHERE perfiles.id = auth.uid() 
    AND perfiles.role IN ('Admin', 'Supervisor', 'Developer')
));

-- Política de INSERCIÓN: Solo Admin, Supervisor y Developer pueden registrar ventas
CREATE POLICY "Solo Admin, Supervisor y Developer pueden registrar ventas" 
ON public.ventas FOR INSERT TO authenticated 
WITH CHECK (EXISTS (
    SELECT 1 FROM perfiles 
    WHERE perfiles.id = auth.uid() 
    AND perfiles.role IN ('Admin', 'Supervisor', 'Developer')
));
