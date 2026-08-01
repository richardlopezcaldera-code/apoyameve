# Estado de la carga en Supabase (registro)

## Proyecto de PRODUCCIÓN — intacto

`htjjxqvzxkrabozopxhe` (supabase-lime-door): **sin cambios**. Se probó una carga
aditiva y luego se **revirtió por completo** a pedido del usuario. Solo existen
sus tablas originales `kam_*` y `mtc_*` (verificado: kam 400/168/718 ·
mtc 160/1001/24). **No se vuelve a tocar**; si acaso, solo lectura.

## Proyecto de PRUEBA (nuevo, sin publicar)

`awdgvtfchubneruyqman` (crm-multiempresa), plan gratuito. Aquí vive el sistema
multiempresa nuevo:

- **Esquema** multiempresa completo (tablas, RLS, funciones, vista holding).
- **2 empresas**: `kamiana` (marca completa) y `mobiliariotech`.
- **Datos de prueba** (muestra real, copiada en solo-lectura desde producción):
  - KAMIANA: 30 clientes, 40 productos.
  - MobiliarioTech: 40 productos.
- **Super admin**: `richardlopezcaldera@gmail.com` (clave temporal
  `CrmHolding2026!`) con `es_super_admin=true`.

> Es una muestra para probar el flujo completo (login → holding → entrar a una
> empresa → catálogo → crear cotización). La copia TOTAL de datos (incl. las 718
> cotizaciones de KAMIANA, 7,3 MB) requiere el método FDW con la contraseña de la
> base de producción, y se hará cuando se decida publicar.

## Cómo probar

1. Abre `app/index.html` con la anon key del proyecto de prueba puesta
   (reemplaza el placeholder o `localStorage.setItem('SUPA_ANON','<anon key>')`).
2. Entra con el super admin → verás el **Panel Holding** con ambas empresas.
3. "Entrar →" a KAMIANA: verás sus clientes y catálogo; crea una cotización de prueba.

## Copia TOTAL más adelante (FDW, solo lectura)

Cuando quieras migrar TODO el histórico:
1. Resetear la *Database password* del proyecto de producción (no afecta el
   cotizador, que usa la anon key).
2. En el proyecto de prueba: `postgres_fdw` apuntando en solo-lectura a producción.
3. `insert into ... select ...` de clientes/productos/proveedores/cotizaciones.
4. Eliminar el server FDW (la contraseña no queda almacenada).
