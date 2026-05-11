-- 1. Actualizar permisos de Productos
DROP POLICY IF EXISTS "Admin y Supervisor pueden modificar productos" ON public.productos;
CREATE POLICY "Admin, Supervisor y Developer pueden modificar productos" 
ON public.productos FOR ALL TO authenticated 
USING (EXISTS (
    SELECT 1 FROM perfiles 
    WHERE perfiles.id = auth.uid() 
    AND perfiles.role IN ('Admin', 'Supervisor', 'Developer')
));

-- 2. Actualizar permisos de Stock (Inventario)
DROP POLICY IF EXISTS "Admin y Supervisor pueden modificar stock" ON public.stock;
CREATE POLICY "Admin, Supervisor y Developer pueden modificar stock" 
ON public.stock FOR ALL TO authenticated 
USING (EXISTS (
    SELECT 1 FROM perfiles 
    WHERE perfiles.id = auth.uid() 
    AND perfiles.role IN ('Admin', 'Supervisor', 'Developer')
));
