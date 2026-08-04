-- ============================================================================
--  SETUP EMPRESA KAMIANA — crea/configura el tenant 'kamiana' con su marca
--  (razón social, RUT, contacto, bancos y firmas) tomada de la v30.
--  Estos datos alimentan el encabezado del PDF y la config del CRM.
--
--  Ejecutar DESPUÉS de 01_schema_multiempresa.sql y ANTES de 04_catalogo.
--  Re-ejecutable: actualiza sólo la fila de la empresa (su config); nunca toca
--  productos, clientes ni otras empresas.
-- ============================================================================
insert into empresas (nombre, rut, slug, plan, config) values (
  'SERVICIO KAMIANA SPA', '77.727.836-3', 'kamiana', 'enterprise',
  jsonb_build_object(
    'pct_venta', 35, 'iva', 19, 'moneda', 'CLP',
    'razon_social', 'SERVICIO KAMIANA SPA',
    'direccion', 'CARMEN 1865, SANTIAGO',
    'telefono', '+56994237663',
    'emails', 'compraagilkamiana@gmail.com',
    'web', 'cotizador.kamianaspa.com',
    'tienda', 'mobiliariostechchile.cl',
    'apps_script_url', 'https://script.google.com/macros/s/AKfycbyNlQrSAzEDDxDIUsFWAAnfm73Ael3yYo_KybMgG7YVBXpSoJwf7LvFtTIWgJ1WIV1F2A/exec',
    'bancos', jsonb_build_array(
      'Banco Santander · Cuenta Corriente 90309382 · Servicio Kamiana Spa · RUT 77.727.836-3',
      'Banco de Chile · Cuenta Corriente 00-866-05619-10',
      'BancoEstado · Cuenta Vista 34371598652',
      'Banco BCI · Cuenta Corriente 32848030'
    ),
    'firmas', jsonb_build_array(
      jsonb_build_object('nombre','RICHARD LOPEZ','cargo','Gerente de Ventas','tel','+56 9 9423 7663'),
      jsonb_build_object('nombre','YURIMAR AVILEZ','cargo','Gerente General','tel','+56 9 9423 7727')
    )
  )
)
on conflict (slug) do update
  set nombre = excluded.nombre,
      rut    = excluded.rut,
      plan   = excluded.plan,
      -- merge: conserva claves existentes y agrega/actualiza las de la marca
      config = empresas.config || excluded.config;
