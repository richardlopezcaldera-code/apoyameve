---
name: mtc
description: >-
  Audita y optimiza el catálogo de productos de la tienda Jumpseller de Kamiana
  (mobiliario de oficina, mobiliario tech y equipamiento). Genera un INFORME de
  mejoras propuestas — descripciones, SEO, imágenes, categorías y datos
  (precio/SKU/stock) — para que el usuario lo revise y apruebe ANTES de aplicar
  cambios en la tienda. Actívala cuando el usuario hable de optimizar el
  catálogo, revisar o mejorar sus productos, mejorar las descripciones o el SEO
  de la tienda, "revisar mis productos", "mejorar el catálogo", "optimizar
  Jumpseller", detectar productos incompletos, o preparar fichas/textos de venta
  para mobiliario, sillas, escritorios y mesas. Un mismo catálogo alimenta las
  webs cotizador.kamianaspa.com, mobiliariostechchile.cl y geo.kamianaspa.com,
  así que optimizar el catálogo mejora las tres a la vez.
---

# MTC — Optimizador de Catálogo Jumpseller (Kamiana / MobiliarioTech)

## Qué hace

Recorre el catálogo de productos de la tienda Jumpseller y produce un **informe
de mejoras propuestas** por producto, en 5 dimensiones:

1. **Descripción** — párrafo vendedor (convencer al cliente) + ficha técnica.
2. **SEO** — título y meta descripción optimizados para posicionar en Chile
   los términos foco: **mobiliario, sillas, escritorios, mesas**.
3. **Imágenes** — detectar fichas sin foto o con imágenes de baja calidad; texto
   alternativo sugerido.
4. **Categorías** — clasificación correcta y fácil de encontrar.
5. **Datos** — precio, SKU y stock completos y coherentes.

La skill **nunca modifica la tienda por su cuenta**. Primero entrega el informe;
solo aplica los cambios que el usuario apruebe explícitamente.

## Contexto fijo del negocio

- **Una sola tienda Jumpseller** (Kamiana) que alimenta tres webs con los
  **mismos productos y los mismos precios**:
  `cotizador.kamianaspa.com`, `mobiliariostechchile.cl`, `geo.kamianaspa.com`.
  → Optimizar el catálogo mejora las tres a la vez.
- **Catálogo:** ~990 productos → SIEMPRE trabajar por **lotes o por categoría**,
  nunca los 990 de golpe.
- **Rubro:** mobiliario de oficina, mobiliario tech y equipamiento.
- **Público / idioma:** Chile, español.
- **Tono de descripciones:** párrafo vendedor + ficha técnica.
- **Foco SEO:** posicionar mobiliario, sillas, escritorios y mesas.

## Herramientas (MCP Jumpseller)

- `mcp__jumpseller__get_store_info` — datos de la tienda.
- `mcp__jumpseller__list_categories` — árbol de categorías (para trabajar por lote).
- `mcp__jumpseller__list_products` / `mcp__jumpseller__search_products` — listar/buscar.
- `mcp__jumpseller__get_product` — ficha completa de un producto.
- `mcp__jumpseller__update_product` — **solo tras aprobación** del usuario.
- `mcp__jumpseller__list_categories` / `create_category` — reorganización (solo tras aprobación).

## Flujo de trabajo

1. **Acotar el lote.** Pregunta o confirma qué revisar: una categoría, un rango,
   o "productos incompletos primero". Nunca proceses el catálogo entero de una vez.
   Usa `list_categories` para ofrecer las categorías disponibles si hace falta.
2. **Leer los productos del lote** con `list_products`/`search_products` y, para
   cada uno, `get_product` para tener descripción, imágenes, SEO, categorías y datos.
3. **Auditar cada ficha** en las 5 dimensiones. Marca como **INCOMPLETO
   (prioridad alta)** todo producto sin imagen, sin descripción o sin precio.
4. **Redactar propuestas** listas para copiar/pegar:
   - Descripción nueva = 1 párrafo vendedor + ficha técnica en viñetas.
   - Título SEO + meta descripción con los términos foco cuando apliquen.
   - Categoría(s) sugerida(s) y texto alternativo de imagen.
   - Lista de datos faltantes o incoherentes (SKU/stock/precio) — **sin** cambiar
     precios: solo señalarlos.
5. **Entregar el informe** (ver formato). Termina con un resumen del lote y la
   pregunta de aprobación.
6. **Aplicar solo lo aprobado.** Cuando el usuario confirme qué cambios quiere,
   usa `update_product` producto por producto y reporta qué se aplicó. Pide
   confirmación explícita adicional para cualquier cambio de precio o de categoría.

## Formato de salida (informe por lote)

Encabezado del lote:

```
# Informe de optimización — [Categoría / Lote]  ·  N productos revisados
Incompletos (prioridad): X   ·   Con mejoras propuestas: Y
```

Un bloque por producto:

```
## [Nombre del producto]  ·  ID: <id>  ·  SKU: <sku>  ·  [OK | INCOMPLETO]

Estado actual: descripción [ok/pobre/vacía] · imágenes [n] · SEO [ok/falta] · categoría [x]
Problemas detectados:
- ...

Propuesta:
- Título SEO: ...
- Meta descripción: ...
- Descripción nueva:
  <párrafo vendedor>
  Ficha técnica:
  - ...
- Categorías sugeridas: ...
- Alt de imagen: ...
- Datos a completar/revisar: ... (precios solo se señalan, no se cambian)
```

Cierre:

```
¿Aplico estos cambios en Jumpseller? Puedes decir "todos", "solo los incompletos",
o indicarme por ID cuáles sí. Los precios no los toco sin tu confirmación aparte.
```

## Reglas

- **Nunca** apliques cambios sin aprobación explícita del usuario.
- **Nunca** cambies precios sin una confirmación específica y aparte.
- **Nunca inventes especificaciones técnicas** (medidas, materiales, garantía) que
  no estén en la ficha real. Si faltan, márcalas como "dato a confirmar", no las
  rellenes.
- SEO real, orientado a intención de búsqueda; **nada** de relleno de keywords.
- Respeta la marca (Kamiana / MobiliarioTech) y el español de Chile.
- Trabaja por lotes; si el usuario pide "todo", propón ir categoría por categoría.

## Errores que debe evitar

- Procesar los 990 productos de una sola vez.
- Tocar la tienda automáticamente antes de la aprobación.
- Inventar datos técnicos o precios.
- Keyword stuffing en títulos/descripciones.
- Entregar un informe genérico no accionable (sin texto listo para pegar).

## Criterios de calidad

- El informe es accionable: cada propuesta se puede copiar/pegar tal cual.
- Los productos incompletos quedan claramente identificados y priorizados.
- Descripciones coherentes con la marca (vendedor + ficha técnica).
- SEO enfocado en mobiliario/sillas/escritorios/mesas, sin relleno.
- Ningún cambio se aplica sin que el usuario lo apruebe.

## Ejemplos de uso

**Ejemplo 1**
- Entrada: "Optimiza la categoría de sillas de oficina."
- Salida: informe con las sillas de esa categoría, cada una con estado actual,
  problemas, título/meta SEO, descripción nueva (vendedor + ficha técnica) y datos
  faltantes; al final, pregunta de aprobación. No se aplica nada todavía.

**Ejemplo 2**
- Entrada: "¿Qué productos están incompletos?"
- Salida: lista priorizada de fichas sin imagen, sin descripción o sin precio, con
  qué le falta a cada una y la propuesta de completado, para que el usuario decida
  cuáles arreglar.
