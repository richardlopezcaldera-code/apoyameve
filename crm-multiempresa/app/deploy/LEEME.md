# App lista para publicar (proyecto de prueba)

`index.html` de esta carpeta ya viene **configurado** apuntando al proyecto de
prueba `crm-multiempresa` (URL + publishable key incluidas). Solo hay que subirlo.

## Publicar en Cloudflare Pages (link `*.pages.dev`)
1. Descarga este `index.html` (botón *Download raw file* en GitHub).
2. dash.cloudflare.com → **Workers & Pages → Create → Pages → Upload assets**.
3. Sube el `index.html`, nómbralo (ej. `crm-multiempresa`) y **Deploy**.
4. Abre el link `https://<algo>.pages.dev`.

## Entrar
- Usuario: `richardlopezcaldera@gmail.com`
- Clave: `CrmHolding2026!`
- Verás el **Panel Holding** con KAMIANA y MobiliarioTech.

## Si el login diera error de "API key"
Algunos proyectos usan la anon key clásica (JWT). Cópiala desde
**Supabase → Project Settings → API → Project API keys → `anon` `public`**,
abre la consola (F12) y ejecuta una vez, luego recarga:
```js
localStorage.setItem('SUPA_ANON','PEGA_AQUI_TU_ANON_KEY'); location.reload()
```

> Nota: esta carpeta `deploy/` contiene la key pública del proyecto para tu
> comodidad. No pongas aquí la clave de la base de datos ni claves privadas.
