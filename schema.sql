-- ============================================================
--  Esquema de base de datos - Sistema de licitaciones + IA
--  PostgreSQL 16
--  Incluye el módulo de COTIZACIONES listo para enlazar.
-- ============================================================

-- ---------- Organismos compradores ----------
CREATE TABLE IF NOT EXISTS organismos (
  codigo_organismo   TEXT PRIMARY KEY,
  nombre             TEXT,
  region             TEXT,
  rut                TEXT
);

-- ---------- Licitaciones / oportunidades ----------
CREATE TABLE IF NOT EXISTS licitaciones (
  codigo             TEXT PRIMARY KEY,      -- ej. 1509-5-L114 (CodigoExterno)
  nombre             TEXT NOT NULL,
  descripcion        TEXT,
  estado             TEXT,                  -- Publicada, Cerrada, Adjudicada...
  codigo_organismo   TEXT REFERENCES organismos(codigo_organismo),
  organismo_nombre   TEXT,
  region             TEXT,
  modalidad          TEXT,                  -- Tipo: L1/LE/LP, Ágil, Convenio...
  monto_estimado     NUMERIC,
  moneda             TEXT,
  cantidad_reclamos  INTEGER,               -- CantidadReclamos: índice de reclamos del comprador
  fecha_publicacion  TIMESTAMPTZ,
  fecha_cierre       TIMESTAMPTZ,
  fecha_adjudicacion TIMESTAMPTZ,
  criterios_json     JSONB,
  items_json         JSONB,
  raw_json           JSONB,
  resumen_ia         TEXT,
  ingesta_at         TIMESTAMPTZ DEFAULT now(),
  actualizado_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lic_estado ON licitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_lic_region ON licitaciones(region);
CREATE INDEX IF NOT EXISTS idx_lic_cierre ON licitaciones(fecha_cierre);
CREATE INDEX IF NOT EXISTS idx_lic_modalidad ON licitaciones(modalidad);
CREATE INDEX IF NOT EXISTS idx_lic_texto ON licitaciones
  USING gin (to_tsvector('spanish', nombre || ' ' || coalesce(descripcion,'')));

-- ---------- Perfiles de búsqueda (líneas de negocio) ----------
CREATE TABLE IF NOT EXISTS perfiles_busqueda (
  id             SERIAL PRIMARY KEY,
  user_id        TEXT NOT NULL,
  nombre         TEXT,
  palabras_clave TEXT[],
  regiones       TEXT[],
  modalidades    TEXT[],
  monto_min      NUMERIC,
  monto_max      NUMERIC,
  creado_at      TIMESTAMPTZ DEFAULT now()
);

-- ---------- Seguimiento / pipeline ----------
CREATE TABLE IF NOT EXISTS seguimiento (
  id             SERIAL PRIMARY KEY,
  user_id        TEXT NOT NULL,
  codigo_lic     TEXT REFERENCES licitaciones(codigo),
  estado_interno TEXT,                      -- interesado, postulando, postulada, adjudicada, descartada
  responsable    TEXT,
  notas          TEXT,
  creado_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, codigo_lic)
);

-- ---------- CAPTACIÓN: oportunidades capturadas por afinidad ----------
CREATE TABLE IF NOT EXISTS capturas (
  codigo             TEXT PRIMARY KEY REFERENCES licitaciones(codigo),
  score              INTEGER,               -- afinidad 0-100
  motivos            TEXT[],
  notificada         BOOLEAN DEFAULT false, -- ya se avisó al usuario
  estado_captacion   TEXT DEFAULT 'nueva',  -- nueva, vista, descartada, en_seguimiento
  capturada_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cap_score ON capturas(score DESC);
CREATE INDEX IF NOT EXISTS idx_cap_notif ON capturas(notificada);

-- ============================================================
--  MÓDULO DE COTIZACIONES  (para enlazar en la siguiente fase)
--  Una cotización es la oferta que el proveedor arma para una
--  licitación. Sus ítems mapean 1:1 (o N:1) con los ítems de la
--  licitación (items_json), permitiendo comparar y calcular márgenes.
-- ============================================================

-- Catálogo propio de productos/servicios del proveedor
CREATE TABLE IF NOT EXISTS catalogo_productos (
  id             SERIAL PRIMARY KEY,
  user_id        TEXT NOT NULL,
  sku            TEXT,
  nombre         TEXT NOT NULL,
  descripcion    TEXT,
  unidad         TEXT,                      -- unidad, caja, kg...
  costo          NUMERIC,                   -- costo interno
  precio_lista   NUMERIC,                   -- precio referencia
  categoria      TEXT,
  creado_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cat_user ON catalogo_productos(user_id);

-- Cabecera de la cotización (oferta a una licitación)
CREATE TABLE IF NOT EXISTS cotizaciones (
  id             SERIAL PRIMARY KEY,
  user_id        TEXT NOT NULL,
  codigo_lic     TEXT REFERENCES licitaciones(codigo),  -- puede ser NULL: cotización libre
  folio          TEXT,                      -- número interno
  estado         TEXT DEFAULT 'borrador',   -- borrador, enviada, adjudicada, rechazada
  moneda         TEXT DEFAULT 'CLP',
  validez_dias   INTEGER,
  observaciones  TEXT,
  subtotal       NUMERIC DEFAULT 0,
  descuento      NUMERIC DEFAULT 0,
  iva            NUMERIC DEFAULT 0,
  total          NUMERIC DEFAULT 0,
  margen_pct     NUMERIC,                   -- margen calculado sobre costos
  creado_at      TIMESTAMPTZ DEFAULT now(),
  actualizado_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cot_user ON cotizaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_cot_lic  ON cotizaciones(codigo_lic);

-- Detalle de la cotización (líneas)
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id                 SERIAL PRIMARY KEY,
  cotizacion_id      INTEGER REFERENCES cotizaciones(id) ON DELETE CASCADE,
  producto_id        INTEGER REFERENCES catalogo_productos(id),
  item_lic_ref       TEXT,                  -- correlativo del ítem en la licitación (mapeo)
  descripcion        TEXT NOT NULL,
  cantidad           NUMERIC NOT NULL DEFAULT 1,
  unidad             TEXT,
  costo_unitario     NUMERIC DEFAULT 0,
  precio_unitario    NUMERIC NOT NULL DEFAULT 0,
  descuento_pct      NUMERIC DEFAULT 0,
  total_linea        NUMERIC GENERATED ALWAYS AS
                       (cantidad * precio_unitario * (1 - COALESCE(descuento_pct,0)/100)) STORED
);
CREATE INDEX IF NOT EXISTS idx_coti_cot ON cotizacion_items(cotizacion_id);
