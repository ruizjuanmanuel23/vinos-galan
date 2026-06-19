-- Migración: zonas con CRUD + precios por zona.
-- Correr UNA VEZ en el SQL editor de Supabase (Dashboard → SQL Editor).

-- =====================================================================
-- TABLA zonas: grupos de localidades (Berisso, Magdalena, La Plata, etc).
-- Cada zona tiene un ajuste porcentual al precio base de los vinos.
-- =====================================================================
CREATE TABLE IF NOT EXISTS zonas (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  ajuste_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  orden INT NOT NULL DEFAULT 0,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE zonas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon read zonas" ON zonas;
DROP POLICY IF EXISTS "anon write zonas" ON zonas;
CREATE POLICY "anon read zonas" ON zonas FOR SELECT USING (true);
CREATE POLICY "anon write zonas" ON zonas FOR ALL USING (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE zonas;

-- =====================================================================
-- TABLA precios_zona: overrides puntuales de precio para (vino × zona).
-- Si NO hay registro acá, el precio efectivo se calcula con el porcentaje
-- de la zona aplicado al precio_venta del vino.
-- =====================================================================
CREATE TABLE IF NOT EXISTS precios_zona (
  id BIGSERIAL PRIMARY KEY,
  vino_id BIGINT NOT NULL REFERENCES vinos(id) ON DELETE CASCADE,
  zona_id BIGINT NOT NULL REFERENCES zonas(id) ON DELETE CASCADE,
  precio NUMERIC(12,2) NOT NULL,
  UNIQUE(vino_id, zona_id)
);

ALTER TABLE precios_zona ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon read precios_zona" ON precios_zona;
DROP POLICY IF EXISTS "anon write precios_zona" ON precios_zona;
CREATE POLICY "anon read precios_zona" ON precios_zona FOR SELECT USING (true);
CREATE POLICY "anon write precios_zona" ON precios_zona FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE precios_zona;

-- =====================================================================
-- FK zona_id en clientes (apunta al nuevo catálogo).
-- El campo viejo zona (text) se mantiene como respaldo legacy.
-- =====================================================================
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS zona_id BIGINT REFERENCES zonas(id) ON DELETE SET NULL;

-- =====================================================================
-- Seed inicial: arrancamos con La Plata (base, 0%) para que no quede vacío.
-- Si ya existe, no hace nada.
-- =====================================================================
INSERT INTO zonas (nombre, ajuste_porcentaje, orden)
VALUES ('La Plata', 0, 0)
ON CONFLICT (nombre) DO NOTHING;

-- Verificar resultado
SELECT * FROM zonas ORDER BY orden, nombre;
