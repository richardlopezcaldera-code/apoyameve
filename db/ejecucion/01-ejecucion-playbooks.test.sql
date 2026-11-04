-- ============================================================
-- Prueba del PASO 1 (ejec_*). Corre dentro de una transacción y hace
-- ROLLBACK al final: no deja datos. Requiere haber corrido antes
-- 01-ejecucion-playbooks.sql. Si algo falla, se detiene con un error.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/ejecucion/01-ejecucion-playbooks.test.sql
-- ============================================================
begin;

do $$
declare
  emp  uuid := '2946a748-e1be-400f-ba3c-fd090ab1e5c1';  -- MobiliarioTech
  t1 uuid; t2 uuid; t3 uuid; n int; msg text; v_paso text;
begin
  -- La semilla existe una sola vez (aunque el script se haya corrido varias veces)
  select count(*) into n from ejec_playbooks where codigo = 'cotizacion_web' and empresa_id is null;
  assert n = 1, format('esperaba 1 playbook cotizacion_web, hay %s', n);
  select count(*) into n from ejec_playbook_pasos p join ejec_playbooks b on b.id = p.playbook_id
   where b.codigo = 'cotizacion_web' and b.empresa_id is null;
  assert n = 4, format('esperaba 4 pasos, hay %s', n);

  -- Iniciar crea el paso 1 con el mensaje renderizado
  t1 := ejec_iniciar('cotizacion_web', emp, null, 'cotizacion', 'TEST-1',
          'Juan Pérez', '+56912345678', 'juan@ejemplo.cl',
          '{"empresa":"MobiliarioTech","monto":"$450.000","link":"https://x"}');
  assert t1 is not null, 'ejec_iniciar no creó la tarea';
  select c.mensaje, c.paso into msg, v_paso from ejec_cola c where c.id = t1;
  assert v_paso = 'Confirmar recepción', v_paso;
  assert msg = 'Hola Juan Pérez, te escribo de MobiliarioTech. Te enviamos la cotización por $450.000. ¿La recibiste bien? Cualquier duda me dices.', msg;

  -- No duplica si ya está en curso
  assert ejec_iniciar('cotizacion_web', emp, null, 'cotizacion', 'TEST-1') is null, 'duplicó la tarea';

  -- Posponer exige motivo y suma el contador
  begin
    perform ejec_posponer(t1, 60, '');
    assert false, 'posponer sin motivo debió fallar';
  exception when raise_exception then null;
  end;
  perform ejec_posponer(t1, 60, 'cliente de viaje');
  select posposiciones into n from ejec_tareas where id = t1;
  assert n = 1, 'no contó la posposición';

  -- no_contesto -> avanza al paso 2 y conserva la nota de la posposición
  t2 := ejec_registrar_resultado(t1, 'no_contesto', 'sin respuesta', 'Hola Juan…');
  assert t2 is not null, 'no creó el paso 2';
  select c.paso into v_paso from ejec_cola c where c.id = t2;
  assert v_paso = 'Llamada de seguimiento', v_paso;
  select nota into msg from ejec_tareas where id = t1;
  assert msg = 'Pospuesta: cliente de viaje | sin respuesta', msg;
  select count(*) into n from ejec_contactos where tarea_id = t1 and canal = 'whatsapp';
  assert n = 1, 'no registró el contacto';

  -- Una tarea cerrada no se puede volver a cerrar
  begin
    perform ejec_registrar_resultado(t1, 'compro');
    assert false, 'debió fallar al cerrar dos veces';
  exception when raise_exception then null;
  end;

  -- compro -> cierra el playbook (no hay siguiente tarea)
  t3 := ejec_registrar_resultado(t2, 'compro');
  assert t3 is null, 'compro no debería crear otra tarea';
  select count(*) into n from ejec_cola where entidad_id = 'TEST-1';
  assert n = 0, 'quedaron tareas abiertas';

  -- Cerrado el playbook, se puede volver a iniciar para la misma entidad
  assert ejec_iniciar('cotizacion_web', emp, null, 'cotizacion', 'TEST-1') is not null,
         'no permitió reiniciar tras cerrar';

  -- Supervisor
  select ventas_30d into n from ejec_supervisor where empresa_id = emp and vendedor_id is null;
  assert n = 1, format('ventas_30d = %s', n);

  raise notice 'OK: todas las pruebas de ejec_* pasaron';
end $$;

rollback;
