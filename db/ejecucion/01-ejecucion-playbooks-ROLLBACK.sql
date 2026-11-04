-- ============================================================
-- ROLLBACK del PASO 1 · Capa de ejecución (ejec_*)
-- Borra TODO lo creado por 01-ejecucion-playbooks.sql, incluidos los datos
-- (playbooks, tareas, historial de contactos). No toca las tablas kam_.
-- ============================================================
begin;

drop view if exists ejec_conversion_pasos;
drop view if exists ejec_supervisor;
drop view if exists ejec_siguiente;
drop view if exists ejec_cola;

drop function if exists ejec_reasignar(uuid, uuid);
drop function if exists ejec_posponer(uuid, int, text);
drop function if exists ejec_registrar_resultado(uuid, text, text, text);
drop function if exists ejec_iniciar(text, uuid, uuid, text, text, text, text, text, jsonb);
drop function if exists ejec_render(text, ejec_tareas);
drop function if exists ejec_fecha_local(timestamptz);

drop table if exists ejec_contactos;
drop table if exists ejec_tareas;
drop table if exists ejec_playbook_pasos;
drop table if exists ejec_playbooks;

commit;
