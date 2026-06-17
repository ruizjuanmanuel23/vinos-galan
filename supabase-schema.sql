-- =============================================================================
-- Vinos Galán La Plata — Esquema de base de datos en Supabase
-- =============================================================================
-- Cómo ejecutarlo:
--   1. En el dashboard de Supabase, sidebar izquierdo, click en "SQL Editor"
--      (es el ícono que parece > _ — terminal)
--   2. Click en "+ New query" (botón verde arriba a la derecha)
--   3. Pegar este archivo completo
--   4. Click en "Run" (botón verde abajo, o Ctrl+Enter)
--   5. Si dice "Success. No rows returned" → ¡listo!
-- =============================================================================

-- =============================================================================
-- TABLAS
-- =============================================================================

-- Clientes
create table if not exists clientes (
  id              bigserial primary key,
  nombre          text not null,
  telefono        text,
  direccion       text default '',
  zona            text,
  dia_reparto     text,
  notas           text default '',
  creado_en       timestamptz default now()
);

create index if not exists clientes_dia_reparto_idx on clientes(dia_reparto);
create index if not exists clientes_telefono_idx on clientes(telefono);

-- Vinos / productos de bodega
create table if not exists vinos (
  id                  bigserial primary key,
  nombre              text not null,
  bodega              text default '',
  varietal            text default '',
  precio_venta        numeric(12,2) default 0,
  precio_costo        numeric(12,2) default 0,
  stock               integer default 0,
  activo              boolean default true,
  foto_url            text,
  descripcion         text,
  mostrar_en_catalogo boolean default true,
  creado_en           timestamptz default now()
);

create index if not exists vinos_activo_idx on vinos(activo);

-- Ventas
create table if not exists ventas (
  id          bigserial primary key,
  cliente_id  bigint references clientes(id) on delete set null,
  fecha       timestamptz default now(),
  total       numeric(12,2) default 0,
  notas       text default '',
  -- snapshot del cliente al momento de la venta
  cliente_snapshot jsonb,
  -- detalles embebidos como JSONB para simplificar (vino_id, nombre, cantidad, precio)
  detalles    jsonb default '[]'::jsonb,
  creado_en   timestamptz default now()
);

create index if not exists ventas_cliente_id_idx on ventas(cliente_id);
create index if not exists ventas_fecha_idx on ventas(fecha desc);

-- Deudas / anotaciones de cuentas
create table if not exists deudas (
  id          bigserial primary key,
  cliente_id  bigint not null references clientes(id) on delete cascade,
  descripcion text default '',
  monto       numeric(12,2) default 0,
  fecha       date default current_date,
  creado_en   timestamptz default now()
);

create index if not exists deudas_cliente_id_idx on deudas(cliente_id);

-- Viajes (con paradas embebidas como JSONB para consistencia con frontend)
create table if not exists viajes (
  id                     bigserial primary key,
  fecha                  date not null default current_date,
  titulo                 text,
  notas                  text,
  estado                 text default 'EN_CURSO',  -- EN_CURSO | FINALIZADO
  inicio                 timestamptz default now(),
  fin                    timestamptz,
  cantidad_total_manual  integer,
  cargado                boolean default false,
  fecha_carga            timestamptz,
  -- Paradas como JSONB: array de objetos { id, cliente, orden, estado, notas, horaVisita, items, cantidadProductos }
  paradas                jsonb default '[]'::jsonb,
  creado_en              timestamptz default now()
);

create index if not exists viajes_fecha_idx on viajes(fecha desc);
create index if not exists viajes_estado_idx on viajes(estado);

-- Plantillas de WhatsApp
create table if not exists plantillas_whatsapp (
  id         bigserial primary key,
  nombre     text not null,
  texto      text not null,
  es_default boolean default false,
  creado_en  timestamptz default now()
);

-- =============================================================================
-- RLS (Row Level Security)
-- Como la autenticación es del lado cliente con la clave 'edlp',
-- hacemos las tablas accesibles a cualquier request con la anon key.
-- (Es seguridad limitada, suficiente para este caso de uso.)
-- =============================================================================

alter table clientes              enable row level security;
alter table vinos                 enable row level security;
alter table ventas                enable row level security;
alter table deudas                enable row level security;
alter table viajes                enable row level security;
alter table plantillas_whatsapp   enable row level security;

-- Policies: lectura y escritura libre para anon
do $$
declare
  tabla text;
begin
  foreach tabla in array array['clientes','vinos','ventas','deudas','viajes','plantillas_whatsapp']
  loop
    execute format('drop policy if exists "anon_all_%s" on %I', tabla, tabla);
    execute format('create policy "anon_all_%s" on %I for all using (true) with check (true)', tabla, tabla);
  end loop;
end
$$;

-- =============================================================================
-- REALTIME — activar para todas las tablas
-- =============================================================================
alter publication supabase_realtime add table clientes;
alter publication supabase_realtime add table vinos;
alter publication supabase_realtime add table ventas;
alter publication supabase_realtime add table deudas;
alter publication supabase_realtime add table viajes;
alter publication supabase_realtime add table plantillas_whatsapp;

-- =============================================================================
-- SEED — plantillas iniciales
-- =============================================================================
insert into plantillas_whatsapp (nombre, texto, es_default)
select 'Pedido del día',
       'Hola {nombre}! Te habla Vinos Galán 🍷' || chr(10) || chr(10) ||
       '¿Necesitás algo para el {dia_hoy}? Hoy estamos repartiendo y queríamos saber si te llevamos algo.',
       true
where not exists (select 1 from plantillas_whatsapp);

insert into plantillas_whatsapp (nombre, texto, es_default)
select 'En camino',
       'Hola {nombre}! Estamos en camino para tu zona ({zona}). Llegamos en un rato 🚚',
       false
where (select count(*) from plantillas_whatsapp) < 2;

insert into plantillas_whatsapp (nombre, texto, es_default)
select 'Saludo simple',
       'Hola {nombre}! ¿Cómo estás?',
       false
where (select count(*) from plantillas_whatsapp) < 3;

-- ✓ Listo
