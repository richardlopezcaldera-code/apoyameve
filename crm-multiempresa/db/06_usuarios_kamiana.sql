-- ============================================================================
--  USUARIOS KAMIANA — asigna membresías (rol) a los usuarios de la v30.
--
--  IMPORTANTE: en el modelo nuevo las contraseñas las gestiona Supabase Auth,
--  no una tabla. Por eso el flujo es en 2 pasos:
--
--  PASO 1 (manual, en el panel de Supabase → Authentication → Users → Add user):
--    crea un usuario por cada persona, con su CORREO y una clave. El trigger
--    del esquema crea su fila en `perfiles` automáticamente.
--    Usuarios de la v30 (define un correo real para cada uno):
--      RLOPEZ104   → RICHARD LOPEZ    (sugerido: admin_empresa)
--      YURIMAR62   → YURIMAR AVILEZ   (sugerido: admin_empresa)
--      RENE2026    → RENE CALDERA     (vendedor)
--      ISAAC2026   → Isaac Patiño     (vendedor)
--      YURYETH2026 → YURYETH BRITO    (vendedor)
--      Ronaldo2026 → Ronaldo          (vendedor)
--
--  PASO 2 (este script): edita los correos y roles abajo y ejecútalo.
--  Re-ejecutable: no duplica (unique empresa+usuario); actualiza rol si cambia.
-- ============================================================================
do $$
declare v_empresa uuid;
begin
  select id into v_empresa from empresas where slug = 'kamiana';
  if v_empresa is null then raise exception 'Crea la empresa kamiana (05_setup_kamiana.sql) primero.'; end if;

  -- (correo_del_usuario, rol)  << AJUSTA los correos a los reales de Auth
  insert into membresias (empresa_id, usuario_id, rol)
  select v_empresa, p.id, x.rol
  from (values
    ('richardlopez@kamiana.cl',  'admin_empresa'),
    ('yurimar@kamiana.cl',       'admin_empresa'),
    ('rene@kamiana.cl',          'vendedor'),
    ('isaac@kamiana.cl',         'vendedor'),
    ('yuryeth@kamiana.cl',       'vendedor'),
    ('ronaldo@kamiana.cl',       'vendedor')
  ) as x(email, rol)
  join perfiles p on lower(p.email) = lower(x.email)
  on conflict (empresa_id, usuario_id) do update set rol = excluded.rol, activo = true;

  raise notice 'Membresías asignadas para los usuarios encontrados en perfiles.';
end $$;

-- Para nombrar al super admin del holding (ve todas las empresas):
--   update perfiles set es_super_admin = true where lower(email) = 'holding@kamiana.cl';
