# Guía: conectar TikTok para publicar automático

Objetivo: obtener `TIKTOK_ACCESS_TOKEN` para que el sistema publique fotos con la
Content Posting API de TikTok.

> Igual que Meta: el token sale de **tu** cuenta y la app necesita **auditoría**
> de TikTok para publicar. Es un trámite aparte del de Meta.

---

## Paso 1 — Cuenta y app de developer

1. Tené una **cuenta TikTok Business** (o Creator).
2. Entrá a **developers.tiktok.com** → *Manage apps* → **Connect an app**.
3. Creá la app (nombre: `MobiliarioTech Avisos`).

## Paso 2 — Productos y scopes

1. En la app, agregá el producto **Content Posting API**.
2. Activá el modo **Direct Post**.
3. Pedí los scopes:
   - `user.info.basic`
   - `video.publish` (cubre también el posteo de fotos por la Content Posting API)
4. Enviá la app a **auditoría** (App review). Hasta aprobarla, solo publica en
   cuentas de prueba asociadas a la app.

## Paso 3 — Verificar el dominio (obligatorio para PULL_FROM_URL)

TikTok descarga la imagen desde `PUBLIC_BASE_URL`, así que hay que **verificar la
propiedad del dominio**:

1. En el portal → *URL properties* / *Domain verification*.
2. Agregá tu dominio (el de `PUBLIC_BASE_URL`) y seguí el método que indique
   (meta-tag o archivo). El Worker puede servir ese archivo si hace falta —
   avisame y lo agrego.

## Paso 4 — Obtener el access token (OAuth)

1. Configurá el **redirect URI** de OAuth en la app.
2. Flujo Login Kit: el usuario autoriza → recibís un `code` → lo intercambiás por
   un `access_token` en:
   ```
   POST https://open.tiktokapis.com/v2/oauth/token/
   client_key, client_secret, code, grant_type=authorization_code, redirect_uri
   ```
3. Guardá el `access_token`. (Dura ~24 h; el `refresh_token` sirve para renovarlo;
   más adelante podemos automatizar el refresh en el Worker.)

## Paso 5 — Cargar el token

**Producción:**
```bash
npx wrangler secret put TIKTOK_ACCESS_TOKEN
```
**Local:** completá `TIKTOK_ACCESS_TOKEN` en `.dev.vars`.

## Paso 6 — Probar

```
https://TU-DOMINIO/run-now?token=TU_RUN_TOKEN
```
Revisá el resultado en `/queue`. Si `tiktok` aparece con un `publish_id`, quedó
enviado a publicar.

---

## Notas

- **Fotos vs video:** la Content Posting API acepta fotos (modo `PHOTO`). Si más
  adelante querés video (reels/tiktoks reales), es otro flujo y probablemente
  necesites un servicio de video.
- **Renovación del token:** al ser corto (~24 h), conviene implementar el refresh
  automático antes de confiar 100% en el cron para TikTok. Puedo agregarlo cuando
  tengas el `refresh_token`.
- **Estado actual del código:** si `TIKTOK_ACCESS_TOKEN` no está seteado, el motor
  simplemente saltea TikTok y sigue con las demás redes.
