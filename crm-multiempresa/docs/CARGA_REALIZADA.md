# Estado de la carga en Supabase (registro)

## Proyecto de PRODUCCIÓN — intacto

`htjjxqvzxkrabozopxhe` (supabase-lime-door): **sin cambios**. Se probó una carga
aditiva y luego se **revirtió por completo** a pedido del usuario. Solo existen
sus tablas originales `kam_*` y `mtc_*`. **No se vuelve a tocar**; solo lectura.

### Cifras reales de producción (referencia)

| | clientes | productos | proveedores | cotizaciones | aprobadas |
|---|---|---|---|---|---|
| `kam_*` (KAMIANA) | 862 | 238 | 8 | 1.544 | 14 |
| `mtc_*` (MobiliarioTech) | 160 | 1.001 | 7 | 24 | 6 |

## Proyecto de PRUEBA (nuevo, sin publicar)

`awdgvtfchubneruyqman` (crm-multiempresa), plan gratuito. Aquí vive el sistema
multiempresa nuevo: esquema completo (tablas, RLS, funciones, vista holding),
2 empresas (`kamiana`, `mobiliariotech`) y el super admin
`richardlopezcaldera@gmail.com`.

### Cómo se calcula el total de una cotización

Producción **no guarda el total**: se recalcula con la misma matemática de la
v30 y se escribe en `cotizaciones.data.total` (un trigger replica el valor a
`monto_total`).

```
ventaUnit = precioFijo > 0 ? round(precioFijo) : round(costo * (1 + pct/100))
base      = Σ ventaUnit * cantidad
despMode = 'pct'  → qUnit = round(ventaUnit * (1 + despacho/base))     (proporcional)
despMode ≠ 'pct'  → qUnit = round(ventaUnit + despacho/unidades)       (lineal)
total     = round(Σ qUnit * cantidad * 1.19)                            (IVA 19%)
```

Validado contra un caso conocido: `1953-318-COT26` (id `msovywqkbr7mp`,
pct 35, despacho 100.000, modo proporcional) → **$2.682.969**.

### Re-sincronización realizada (número, estado y total)

Las 1.388 filas que tienen `legacy_id` se realinearon **una por una contra
producción**, en 4 bloques por hash del id:

| bloque | filas en producción | actualizadas en prueba |
|---|---|---|
| 0–7 | 376 | 341 |
| 8–15 | 350 | 306 |
| 16–23 | 405 | 371 |
| 24–31 | 413 | 365 |
| **total** | **1.544** | **1.383** |

Además se corrigió `monto_neto` (= `monto_total`/1,19) en 684 filas que habían
quedado con valores de otra cotización.

Motivo: el `numero` y el `total` estaban desfasados respecto del `legacy_id`
(p. ej. `msovywqkbr7mp` figuraba como `1091793-93-COT26` con $982.883 cuando en
producción es `1953-318-COT26` por $2.682.969).

> Los números repetidos (`2109-560-COT26` ×6, `745712-180-COT26` ×6, las dos
> `1953-318-COT26`, etc.) **no son un error de la migración**: existen así en
> producción.

## Pendientes conocidos en el proyecto de prueba

1. **161 cotizaciones de producción sin cargar** (1.544 − 1.383). Requieren la
   fila completa (`items` con imágenes base64), demasiado pesada para la API
   REST; se traen con el método FDW (ver más abajo).
2. **685 cotizaciones sin `legacy_id`** (678 en KAMIANA, 7 en MobiliarioTech).
   Sus números (`2292-656-COT26`, `768-101-COT26`, `3621-253-COT26`, …) **no
   existen ni en `kam_cotizaciones` ni en `mtc_cotizaciones`**, y su `data`
   tiene un esquema distinto (`neto`, `iva`, `costo`, `descuento`,
   `neto_bruto`, `descMode`, `firmaIdx`). Inflan el Panel Holding. **No se
   borran sin confirmación del usuario.**
3. **Clientes mal repartidos**: prueba tiene KAMIANA 714 / MobiliarioTech 657,
   cuando producción es 862 / 160. Hay que reasignar `empresa_id` y completar.

## Copia TOTAL más adelante (FDW, solo lectura)

1. Resetear la *Database password* del proyecto de producción (no afecta al
   cotizador, que usa la anon key).
2. En el proyecto de prueba: `postgres_fdw` apuntando en solo-lectura a producción.
3. `insert into ... select ...` de clientes/productos/proveedores/cotizaciones.
4. Eliminar el server FDW (la contraseña no queda almacenada).

Script listo: `../db/completar_kamiana_dblink.sql`.
