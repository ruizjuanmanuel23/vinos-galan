-- Migración: cliente puede tener múltiples días de reparto.
-- Correr UNA VEZ en el SQL editor de Supabase (Dashboard → SQL Editor).
--
-- Agrega columna dias_reparto JSONB (array de strings).
-- Convierte los valores existentes de dia_reparto (text singular) en arrays de 1.
-- La columna dia_reparto se mantiene por compatibilidad (queda como "día principal").

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS dias_reparto JSONB DEFAULT '[]'::jsonb;

UPDATE clientes
SET dias_reparto = jsonb_build_array(dia_reparto)
WHERE dia_reparto IS NOT NULL
  AND (dias_reparto IS NULL OR dias_reparto = '[]'::jsonb);

-- Verificar resultado: clientes con días asignados
SELECT id, nombre, dia_reparto, dias_reparto FROM clientes ORDER BY nombre LIMIT 20;
