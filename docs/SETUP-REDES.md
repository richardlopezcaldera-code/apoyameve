# Guía: conectar Instagram y Facebook para publicar automático

Esta guía te lleva paso a paso a obtener los 4 valores que el sistema necesita:
`IG_USER_ID`, `IG_ACCESS_TOKEN`, `FB_PAGE_ID`, `FB_PAGE_TOKEN`.

> Importante: estos valores los genera Meta con **tu** cuenta. Nadie más puede
> crearlos por vos. Reservate ~30–40 min la primera vez.

---

## Requisitos previos (una sola vez)

1. **Página de Facebook** de MobiliarioTech (no un perfil personal).
   Si no tenés, creala en facebook.com/pages/create.
2. **Cuenta de Instagram Business o Creator**.
   En la app de Instagram: Configuración → Cuenta → *Cambiar a cuenta profesional*.
3. **Vincular** el Instagram a la Página de Facebook.
   En la Página de Facebook: Configuración → *Cuentas vinculadas* → Instagram → conectar.
4. **Meta Business Suite**: entrá a business.facebook.com y confirmá que la Página
   y el Instagram aparecen en tu negocio.

---

## Paso 1 — Crear la app de Meta

1. Andá a **developers.facebook.com** → *Mis apps* → **Crear app**.
2. Tipo de app: **Empresa (Business)**.
3. Nombre: `MobiliarioTech Avisos`. Asociala a tu Business.
4. En el panel de la app, agregá los productos:
   - **Instagram Graph API**
   - **Facebook Login for Business** (para generar el token con permisos)

## Paso 2 — Permisos necesarios

La app tiene que pedir estos permisos (scopes):

- `instagram_basic`
- `instagram_content_publish`
- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `business_management`

> Para publicar en cuentas que no sean la tuya de prueba, Meta pide **App Review**
> (revisión). Mientras esté en modo desarrollo, funciona con tu propia cuenta y la
> de los administradores/testers de la app. Para producción real, enviá esos
> permisos a revisión desde *App Review → Permisos y funciones*.

## Paso 3 — Obtener los IDs y un token

La forma más rápida es con el **Explorador de la API Graph**
(developers.facebook.com/tools/explorer):

1. Elegí tu app arriba a la derecha.
2. *Generar token de acceso de usuario* y aceptá los permisos del Paso 2.
3. Con ese token, ejecutá estas consultas (botón **Enviar**):

   - **Tu Página y su token** (FB_PAGE_ID + FB_PAGE_TOKEN):
     ```
     GET /me/accounts
     ```
     En la respuesta, tu Página trae `id` (→ `FB_PAGE_ID`) y `access_token`
     (→ token de Página).

   - **El Instagram vinculado** (IG_USER_ID):
     ```
     GET /{FB_PAGE_ID}?fields=instagram_business_account
     ```
     Devuelve `instagram_business_account.id` (→ `IG_USER_ID`).

## Paso 4 — Token de larga duración (importante)

El token del explorador dura ~1 hora. Convertí el **token de usuario** a uno de
**60 días**:

```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={TOKEN_CORTO}
```

Con ese token largo, volvé a pedir `GET /me/accounts`: el `access_token` de la
Página ahora será de larga duración → usalo como **`FB_PAGE_TOKEN`** y también
como **`IG_ACCESS_TOKEN`** (Instagram publica con el token de la Página vinculada).

`APP_ID` y `APP_SECRET` están en *Configuración → Básica* de tu app.

## Paso 5 — Cargar los valores

**En producción (Cloudflare):**
```bash
npx wrangler secret put IG_USER_ID
npx wrangler secret put IG_ACCESS_TOKEN
npx wrangler secret put FB_PAGE_ID
npx wrangler secret put FB_PAGE_TOKEN
```
Y en `wrangler.toml`, poné tu dominio en `PUBLIC_BASE_URL`.

**En local:** copiá `.dev.vars.example` a `.dev.vars` y completá los valores.

## Paso 6 — Probar antes de confiar en el cron

1. Deploy: `npm run deploy` (o `npm run dev` en local).
2. Disparo manual:
   ```
   https://TU-DOMINIO/run-now?token=TU_RUN_TOKEN
   ```
   Debería publicar 1 pieza y devolver el resultado en JSON.
3. Revisá el historial en `https://TU-DOMINIO/queue`.
4. Si sale OK, el cron ya postea solo 3 veces al día.

---

## Notas

- **Renovación del token:** el token de Página de larga duración no expira si se
  usa seguido, pero conviene regenerarlo si algún día `/queue` muestra errores de
  autenticación.
- **Límite de Instagram:** máximo 25 publicaciones por API en 24 h — 3/día entra
  cómodo.
- **TikTok** se conecta aparte (Content Posting API con auditoría propia); queda
  para una segunda etapa.
