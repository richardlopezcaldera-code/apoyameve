# Cómo instalar / publicar el CRM Multiempresa

Guía simple. Lo técnico (base de datos, empresas, datos de prueba y tu usuario)
**ya está listo** en el proyecto Supabase de prueba. Instalar = **publicar la
página** para tener un link y entrar.

---

## Lo que YA está hecho (no tienes que hacer nada)
- Base de datos multiempresa creada (proyecto de prueba `crm-multiempresa`).
- 2 empresas: **KAMIANA** y **MobiliarioTech**.
- Datos de prueba: clientes + catálogo cargados.
- Tu usuario **super admin** listo:
  - Correo: `richardlopezcaldera@gmail.com`
  - Clave: `CrmHolding2026!`

---

## Paso único: publicar la página en Cloudflare Pages

1. **Descarga el archivo** ya configurado:
   en el PR abre `crm-multiempresa/app/deploy/index.html` →
   botón **Download raw file** → guárdalo en tu computador.
2. Entra a **https://dash.cloudflare.com** (tu cuenta de Cloudflare).
3. Menú izquierdo: **Workers & Pages**.
4. Botón **Create** → pestaña **Pages** → **Upload assets**.
5. Nombre del proyecto: `crm-multiempresa` → **Create project**.
6. **Arrastra el `index.html`** que descargaste (o "Select from computer").
7. Botón **Deploy site**. Espera a "Success".
8. Cloudflare te da el link: **`https://crm-multiempresa.pages.dev`**.

---

## Entrar
1. Abre tu link `*.pages.dev`.
2. Ingresa con `richardlopezcaldera@gmail.com` / `CrmHolding2026!`.
3. Verás el **Panel Holding** con las 2 empresas.
4. Botón **"Entrar →"** en una empresa: ves sus clientes, catálogo y puedes
   **crear una cotización** (elige productos → cliente → Guardar / PDF).

---

## (Opcional) Dar de alta a tu equipo
1. Supabase → proyecto de prueba → **Authentication → Users → Add user**
   (correo + clave para cada persona).
2. Asignar rol por empresa: ejecutar `db/06_usuarios_kamiana.sql` con sus correos.

## (Opcional, más adelante)
- **Dominio propio** (ej. `crm.kamianaspa.com`): en Cloudflare Pages →
  Custom domains.
- **Copia total de datos** (todo el histórico de cotizaciones): se hace por FDW
  reseteando la contraseña de la base (ver `docs/CARGA_REALIZADA.md`).
- **Pasar a producción**: cuando lo apruebes, se repite el mismo esquema/carga en
  tu proyecto real o se promueve este.

---

## Si algo falla
- **Link de GitHub da 404**: inicia sesión en github.com con tu cuenta (el repo
  es privado).
- **`pages.dev` da 404**: aún no completaste el paso de subir el `index.html`.
- **Login da error de "API key"**: en la consola del navegador (F12) pega la
  anon key (Supabase → Settings → API → `anon` `public`):
  `localStorage.setItem('SUPA_ANON','TU_ANON_KEY'); location.reload()`
