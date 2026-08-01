# Integración de la app v30 en el shell multiempresa

Cómo llevar los módulos del `Cotizador_KAMIANA.html` (v30, mono-empresa) al
`app/index.html` multiempresa. El shell ya resuelve lo difícil: login real,
empresa activa, panel holding y la capa de datos aislada por `empresa_id`.

## 1. Antes de empezar

1. Ejecuta el esquema (`../db/01_schema_multiempresa.sql`) en tu proyecto Supabase.
2. En `app/index.html` completa `SUPA_URL` y `SUPA_ANON`.
3. Activa **Authentication → Email** en Supabase y crea tu usuario.
4. Marca tu super admin y/o crea empresas y membresías (ver `../db/02_seed_demo.sql`).

## 2. El cambio mental clave

| v30 (mono-empresa) | Multiempresa (este shell) |
|---|---|
| `SESSION` = fila de `kam_usuarios` | `MT.user` (Auth) + `MT.perfil` + `MT.rol` |
| `db.get(K.x)` desde `localStorage` | lectura directa con `tSel(tabla)` |
| `supaUp('kam_x', row)` (anon key) | `tInsert('x', row)` / `tUpdate('x', id, patch)` |
| `nextQuoteNum()` local | `await siguienteNumero('cotizacion')` |
| RLS `using(true)` | RLS por `empresa_id` (el servidor filtra) |

Regla: **nunca** pongas `empresa_id` a mano en un `SELECT` como única defensa; los
helpers ya lo agregan y, sobre todo, **RLS lo garantiza**. En `INSERT`/`UPDATE`
el `empresa_id` lo inyecta `tInsert`/`tUpdate` con la empresa activa.

## 3. Portar un módulo (receta)

Para cada módulo de la v30 (productos, cotizaciones, proveedores, etc.):

1. **Marcado (HTML):** copia el `<section>` del módulo dentro del `main` del
   shell, en el bloque `<!-- SLOT: ... -->`. Mantén los mismos `id`.
2. **Menú:** agrega su entrada en `MODULES` con los roles que correspondan.
   Los roles nuevos son: `super_admin`, `admin_empresa`, `supervisor`,
   `vendedor`, `solo_lectura` (antes sólo había `admin`/`vendedor`).
3. **Datos:** en el JS del módulo, reemplaza:
   - Lecturas: `db.get(K.products,[])` → `await tSel('productos','select=*')`.
   - Altas/edición: `supaUp('kam_productos',row)` →
     `await tInsert('productos',row)` (nuevo) o `tUpdate('productos',id,patch)`.
   - Bajas: `supaDel('kam_productos','id',id)` → `await tDelete('productos',id)`.
   - Nombres de tabla: quita el prefijo `kam_` (`kam_clientes`→`clientes`, etc.).
   - IDs: en la v30 eran texto (`uid()`); ahora la base genera `uuid`. Deja que
     el servidor asigne el `id` (no lo mandes en el `INSERT`) y usa el `id`
     devuelto por `tInsert` (que retorna la fila creada).
4. **Numeración:** `nextQuoteNum()` → `await siguienteNumero('cotizacion','COT')`.
5. **Referencias entre tablas:** guarda `cliente_id`/`vendedor_id` como los `uuid`
   nuevos. El `vendedor_id` es `MT.user.id`; el `vendedor_name`, `MT.perfil.nombre`.

## 4. Config por empresa

En la v30 el `%` de venta, IVA, moneda, logo y URL de Apps Script salían de una
config global. Ahora viven en `empresas.config` (jsonb) de la empresa activa.
Cárgalos al entrar a la empresa:

```js
async function cargarConfigEmpresa(){
  const e = await rest("empresas?id=eq."+empId()+"&select=config,logo_url,nombre");
  MT.config = (e[0] && e[0].config) || {};
}
// uso: MT.config.pct_venta, MT.config.iva, MT.config.moneda, MT.config.apps_script_url
```

## 5. Integraciones (Mercado Público / Compra Ágil / correo)

Los puentes (Worker `_worker.js` + Apps Script) **no cambian**. Dos opciones:

- **Simple:** mantener los tickets globales del Worker (una sola cuenta para todas
  las empresas).
- **Por empresa:** guardar `mp_ticket` / `ca_ticket` / `apps_script_url` en
  `empresas.config` y que el frontend/Worker use el de la empresa activa. Es el
  modo recomendado para un holding con varias cuentas de ChileCompra.

## 6. Nada de contraseñas en el HTML

Se elimina el bloque `USUARIOS_BASE` y la tabla `kam_usuarios`. Los usuarios se
crean/gestionan en **Supabase Auth** y se asignan a empresas con `membresias`
(un admin_empresa puede hacerlo por UI vía `insert into membresias ...`, ya
permitido por RLS).

## 6b. Estado de los módulos portados

- **Clientes** ✅ (módulo demo del patrón de datos).
- **Cotizaciones** ✅ — builder con catálogo de la empresa + ítems fuera de
  catálogo, precio neto editable por línea, detalle, **despacho** repartido
  proporcional o lineal (misma matemática que la v30), totales con IVA de
  `empresas.config`, cliente inline, numeración por empresa (`siguiente_numero`),
  **PDF** (jsPDF), listado con búsqueda y **aprobar/rechazar** (según rol).
  El total se guarda en `cotizaciones.data.total` (lo consume el panel Holding).
- **Pendientes** (mismo patrón): Productos, Proveedores, Órdenes de compra,
  Notas de pedido, Resúmenes y Mercado Público / Compra Ágil.

> Nota PDF: esta versión genera un PDF limpio sin incrustar imágenes de producto
> (la v30 usaba proxies CORS externos). Si se requieren imágenes en el PDF, se
> añade la precarga de imágenes por proxy como en la v30.

## 7. Prueba de humo

1. Entra con un usuario de una sola empresa → ves el menú y sus Clientes.
2. Crea un cliente → aparece; recarga → sigue ahí (está en la base, no en
   `localStorage`).
3. Entra con el super admin → ves el **Panel Holding** con todas las empresas y
   puedes "Entrar →" a cualquiera.
4. Con el JWT de la empresa A, intenta leer datos de la empresa B → 0 filas (RLS).
