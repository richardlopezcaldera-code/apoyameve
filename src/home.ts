// Home pública de MobiliarioTech (estilo aprobado). Documento HTML autocontenido.
export function homeHTML(): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>MobiliarioTech — Muebles de oficina y hogar</title>
<meta name="description" content="Muebles de oficina y hogar a precio mayorista en Santiago. Despacho a todo Chile." />
</head>
<body>
<style>
  /* ── MobiliarioTech · home (estilo aprobado "FORM") ──
     Mundo cálido comprometido: un solo tema por identidad de marca. */
  :root {
    color-scheme: light;
    --cream: #f3ece1;
    --cream-2: #efe5d6;
    --card: #fbf7f0;
    --beige: #d9c5aa;
    --ink: #1c1815;
    --ink-soft: #4a4038;
    --muted: #8a7c6a;
    --line: #e2d6c3;
    --rust: #b24a2c;
    --rust-ink: #8f3a20;
    --mustard: #e4be5c;
    --blue: #7fa9ce;
    --green: #5e8c4e;
    --sans: "Poppins", "Quicksand", ui-rounded, "Segoe UI", system-ui, sans-serif;
    --script: "Caveat", "Segoe Script", "Bradley Hand", "Brush Script MT", cursive;
    --wrap: 1240px;
    --radius: 14px;
  }

  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0;
    background: var(--cream);
    color: var(--ink);
    font-family: var(--sans);
    line-height: 1.5;
  }
  img { max-width: 100%; display: block; }
  a { color: inherit; text-decoration: none; }
  button { font: inherit; cursor: pointer; }
  h1, h2, h3 { text-wrap: balance; margin: 0; }
  :focus-visible { outline: 3px solid var(--rust); outline-offset: 2px; border-radius: 6px; }

  .wrap { max-width: var(--wrap); margin-inline: auto; padding-inline: clamp(16px, 4vw, 40px); }

  /* ── Barra superior ── */
  .topbar {
    background: var(--ink);
    color: #f4ece0;
    font-size: 13px;
    letter-spacing: .02em;
  }
  .topbar .row {
    display: flex; align-items: center; justify-content: center; gap: 18px;
    min-height: 40px; text-align: center;
  }
  .topbar .arrow {
    background: transparent; border: 0; color: #cdbfad;
    width: 28px; height: 28px; border-radius: 999px; line-height: 1;
    display: grid; place-items: center; opacity: .7;
  }
  .topbar .arrow:hover { opacity: 1; }
  .topbar .msg { font-weight: 500; }

  /* ── Header ── */
  header.site {
    position: sticky; top: 0; z-index: 40;
    background: color-mix(in srgb, var(--cream) 88%, transparent);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--line);
  }
  .nav {
    display: flex; align-items: center; gap: clamp(14px, 2vw, 30px);
    min-height: 76px;
  }
  .brand {
    font-weight: 800; font-size: 30px; letter-spacing: -.02em; line-height: 1;
    display: inline-flex; align-items: baseline; gap: 1px;
  }
  .brand .b1 { position: relative; }
  .brand .b1::after {
    content: ""; position: absolute; left: 0; right: 22%; bottom: -6px;
    height: 4px; background: var(--rust); border-radius: 3px;
  }
  .brand .b2 { color: var(--rust); }

  .menu { display: flex; align-items: center; gap: clamp(10px, 1.6vw, 26px); }
  .menu a {
    display: inline-flex; align-items: center; gap: 8px;
    font-weight: 600; font-size: 15px; color: var(--ink-soft);
    padding: 8px 4px; border-radius: 8px;
  }
  .menu a:hover { color: var(--rust); }
  .menu .ic { width: 18px; height: 18px; display: inline-block; color: var(--rust); }

  .tools { margin-left: auto; display: flex; align-items: center; gap: 14px; }
  .search {
    display: flex; align-items: center; gap: 10px;
    background: var(--card); border: 1px solid var(--line);
    border-radius: 999px; padding: 9px 16px; min-width: min(320px, 34vw);
    color: var(--muted);
  }
  .search input {
    border: 0; background: transparent; outline: none; width: 100%;
    font: inherit; color: var(--ink);
  }
  .iconbtn {
    display: inline-flex; align-items: center; gap: 7px;
    background: transparent; border: 0; color: var(--ink); font-weight: 600; font-size: 14px;
  }
  .iconbtn:hover { color: var(--rust); }
  .pro {
    font-weight: 800; font-size: 13px; letter-spacing: .08em; color: var(--rust-ink);
    border-bottom: 2px solid var(--rust); padding-bottom: 2px;
  }
  .burger { display: none; }

  /* ── Hero ── */
  .hero { position: relative; overflow: hidden; background: var(--cream-2); }
  .hero-grid {
    position: relative; z-index: 2;
    display: grid; grid-template-columns: 1fr 1.15fr 1fr;
    align-items: stretch; min-height: min(76vh, 640px);
  }
  .hero-photo {
    position: relative;
    background-size: cover; background-position: center;
    min-height: 320px;
  }
  .hero-photo.left {
    background:
      radial-gradient(120% 90% at 30% 20%, #e7d3b6 0%, #cdb08a 55%, #b9986f 100%);
  }
  .hero-photo.right {
    background:
      radial-gradient(120% 90% at 70% 30%, #e4ccaa 0%, #cbaa82 60%, #b7946b 100%);
  }
  .hero-photo .tag {
    position: absolute; left: 14px; bottom: 14px;
    background: rgba(28,24,21,.55); color: #f4ece0;
    font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
    padding: 5px 10px; border-radius: 999px;
  }
  .hero-center {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; gap: 22px; padding: 48px 28px; background: var(--cream);
  }
  .hero-center h1 {
    font-family: var(--script);
    font-size: clamp(52px, 8vw, 104px);
    line-height: .9; color: var(--ink); font-weight: 700;
  }
  .hero-center .sub {
    font-size: clamp(14px, 1.5vw, 18px); color: var(--ink-soft);
    font-weight: 600; max-width: 30ch;
  }
  .cta {
    background: var(--ink); color: #f6efe4;
    padding: 15px 30px; border-radius: 6px; font-weight: 700; letter-spacing: .02em;
    border: 0; transition: transform .12s ease, background .12s ease;
  }
  .cta:hover { background: var(--rust); transform: translateY(-1px); }

  /* Puntitos de colores */
  .dot { position: absolute; border-radius: 999px; z-index: 3; pointer-events: none; }
  @media (prefers-reduced-motion: no-preference) {
    .dot { animation: float 7s ease-in-out infinite; }
    .dot:nth-child(even) { animation-duration: 9s; }
  }
  @keyframes float { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-10px);} }

  /* ── Secciones ── */
  section { padding-block: clamp(44px, 6vw, 80px); }
  .eyebrow {
    font-size: 12px; letter-spacing: .16em; text-transform: uppercase;
    color: var(--rust-ink); font-weight: 700; margin-bottom: 8px;
  }
  .h2 { font-size: clamp(26px, 3.4vw, 40px); font-weight: 800; letter-spacing: -.02em; }
  .lead { color: var(--muted); max-width: 52ch; margin-top: 10px; }

  .cats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-top: 30px; }
  .cat {
    border: 1px solid var(--line); background: var(--card); border-radius: var(--radius);
    padding: 22px 18px; display: flex; flex-direction: column; gap: 10px;
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .cat:hover { transform: translateY(-3px); box-shadow: 0 12px 28px -18px rgba(28,24,21,.4); }
  .cat .swatch { width: 42px; height: 42px; border-radius: 12px; }
  .cat b { font-size: 16px; }
  .cat span { font-size: 13px; color: var(--muted); }

  .prod-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
  .link-more { font-weight: 700; color: var(--rust-ink); border-bottom: 2px solid var(--rust); padding-bottom: 2px; }
  .grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 20px; margin-top: 30px;
  }
  .card {
    background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
    overflow: hidden; display: flex; flex-direction: column;
    transition: transform .12s ease, box-shadow .12s ease;
  }
  .card:hover { transform: translateY(-4px); box-shadow: 0 16px 34px -20px rgba(28,24,21,.45); }
  .card .ph {
    aspect-ratio: 4/3; position: relative;
    display: grid; place-items: center; color: #8a7458; font-size: 12px; letter-spacing: .08em;
  }
  .card .body { padding: 16px 16px 18px; display: flex; flex-direction: column; gap: 6px; }
  .card .catname { font-size: 12px; color: var(--rust-ink); font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
  .card .name { font-weight: 700; font-size: 15.5px; line-height: 1.25; }
  .price { display: flex; align-items: baseline; gap: 10px; margin-top: 4px; font-variant-numeric: tabular-nums; }
  .price .now { font-size: 22px; font-weight: 800; }
  .price .was { font-size: 14px; color: var(--muted); text-decoration: line-through; }
  .badge {
    position: absolute; top: 10px; left: 10px;
    background: var(--rust); color: #fff; font-weight: 800; font-size: 12px;
    padding: 5px 9px; border-radius: 999px;
  }
  .addbtn {
    margin-top: 10px; align-self: flex-start;
    background: var(--ink); color: #f6efe4; padding: 9px 16px; border-radius: 6px; font-weight: 700; font-size: 13px;
    border: 0;
  }
  .addbtn:hover { background: var(--rust); }

  /* Banda promocional */
  .promo {
    background: var(--rust); color: #fdf1e7; border-radius: 20px;
    display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; align-items: center;
    padding: clamp(26px, 4vw, 46px);
  }
  .promo h2 { font-size: clamp(24px, 3vw, 38px); font-weight: 800; }
  .promo p { margin: 12px 0 0; opacity: .92; max-width: 46ch; }
  .promo .ctalight { background: #fdf1e7; color: var(--rust-ink); margin-top: 22px; }
  .promo .ctalight:hover { background: var(--mustard); color: var(--ink); }
  .promo .art { height: 160px; border-radius: 16px; background:
    radial-gradient(60% 80% at 30% 30%, var(--mustard) 0 30%, transparent 31%),
    radial-gradient(50% 70% at 75% 60%, var(--blue) 0 30%, transparent 31%),
    radial-gradient(40% 60% at 55% 80%, var(--green) 0 30%, transparent 31%),
    #a53f22; }

  /* Footer */
  footer.site { background: var(--ink); color: #d8cdbc; margin-top: 20px; }
  footer.site .cols {
    display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 30px;
    padding-block: clamp(36px, 5vw, 60px);
  }
  footer .brand { color: #f4ece0; }
  footer .brand .b1::after { right: 22%; }
  footer h4 { color: #f4ece0; font-size: 13px; letter-spacing: .1em; text-transform: uppercase; margin: 0 0 14px; }
  footer a { display: block; padding: 5px 0; color: #cbbfae; font-size: 14px; }
  footer a:hover { color: var(--mustard); }
  footer .wa { color: var(--mustard); font-weight: 700; }
  footer .legal { border-top: 1px solid #342d26; padding-block: 18px; font-size: 12.5px; color: #9c9081; text-align: center; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .menu, .search .txt { display: none; }
    .burger { display: inline-flex; }
    .hero-grid { grid-template-columns: 1fr; }
    .hero-center { order: -1; padding: 44px 22px; }
    .hero-photo { min-height: 200px; }
    .hero-photo.left, .hero-photo.right { display: block; }
    .promo { grid-template-columns: 1fr; }
    .promo .art { order: -1; }
    footer.site .cols { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 560px) {
    .search { min-width: 0; padding: 9px 12px; }
    .search .txt { display: none; }
    footer.site .cols { grid-template-columns: 1fr; }
  }
</style>

<!-- Barra superior -->
<div class="topbar">
  <div class="wrap row">
    <button class="arrow" aria-label="Anterior">‹</button>
    <span class="msg">Tienda: Lunes a Viernes 10:00–19:00 hrs · Sábado 10:00–18:00 hrs · Despacho a todo Chile</span>
    <button class="arrow" aria-label="Siguiente">›</button>
  </div>
</div>

<!-- Header -->
<header class="site">
  <div class="wrap nav">
    <a class="brand" href="#" aria-label="MobiliarioTech inicio">
      <span class="b1">Mobiliario</span><span class="b2">Tech</span>
    </a>

    <nav class="menu" aria-label="Principal">
      <a href="#categorias"><span class="ic">▦</span>Categorías</a>
      <a href="#espacios"><span class="ic">▤</span>Espacios</a>
      <a href="#inspiracion"><span class="ic">⌂</span>Inspiración</a>
      <a href="#ofertas"><span class="ic">%</span>Ofertas</a>
    </nav>

    <div class="tools">
      <label class="search">
        <span aria-hidden="true">⌕</span>
        <input class="txt" type="search" placeholder="¿Qué estás buscando?" aria-label="Buscar productos" />
      </label>
      <button class="iconbtn" aria-label="Ingresar"><span aria-hidden="true">◐</span><span class="txt">Ingresar</span></button>
      <button class="iconbtn" aria-label="Carrito">🛒</button>
      <button class="burger iconbtn" aria-label="Menú">☰</button>
    </div>
  </div>
</header>

<!-- Hero -->
<div class="hero">
  <span class="dot" style="width:26px;height:26px;background:var(--rust);top:14%;left:4%"></span>
  <span class="dot" style="width:20px;height:20px;background:var(--blue);top:30%;left:1.5%"></span>
  <span class="dot" style="width:30px;height:30px;background:var(--blue);top:20%;left:53%"></span>
  <span class="dot" style="width:22px;height:22px;background:var(--mustard);top:56%;left:35%"></span>
  <span class="dot" style="width:30px;height:30px;background:var(--rust);top:56%;left:47%"></span>
  <span class="dot" style="width:22px;height:22px;background:var(--green);top:70%;left:28%"></span>
  <span class="dot" style="width:24px;height:24px;background:var(--green);top:74%;left:56%"></span>
  <span class="dot" style="width:22px;height:22px;background:var(--blue);top:22%;left:70%"></span>
  <span class="dot" style="width:26px;height:26px;background:var(--mustard);top:44%;left:96%"></span>
  <span class="dot" style="width:18px;height:18px;background:var(--rust);top:82%;left:84%"></span>

  <div class="wrap" style="padding:0">
    <div class="hero-grid">
      <div class="hero-photo left"><span class="tag">foto lifestyle</span></div>
      <div class="hero-center">
        <h1>Tu espacio,<br>tu estilo</h1>
        <p class="sub">/ muebles que hacen tu casa y tu oficina más tuyas /</p>
        <button class="cta">ver ofertas</button>
      </div>
      <div class="hero-photo right"><span class="tag">foto lifestyle</span></div>
    </div>
  </div>
</div>

<!-- Categorías -->
<section id="categorias">
  <div class="wrap">
    <p class="eyebrow">Comprá por categoría</p>
    <h2 class="h2">Todo para tu espacio</h2>
    <div class="cats">
      <a class="cat" href="#"><span class="swatch" style="background:var(--rust)"></span><b>Sillas de oficina</b><span>Ergonómicas y ejecutivas</span></a>
      <a class="cat" href="#"><span class="swatch" style="background:var(--blue)"></span><b>Escritorios</b><span>Home office y gerencia</span></a>
      <a class="cat" href="#"><span class="swatch" style="background:var(--mustard)"></span><b>Sillas gamer</b><span>Comodidad para largas horas</span></a>
      <a class="cat" href="#"><span class="swatch" style="background:var(--green)"></span><b>Almacenaje</b><span>Estantes y cajoneras</span></a>
      <a class="cat" href="#"><span class="swatch" style="background:var(--ink)"></span><b>Ofertas del día</b><span>Precios por tiempo limitado</span></a>
    </div>
  </div>
</section>

<!-- Productos destacados -->
<section id="ofertas" style="background:var(--cream-2)">
  <div class="wrap">
    <div class="prod-head">
      <div>
        <p class="eyebrow">En oferta esta semana</p>
        <h2 class="h2">Destacados</h2>
      </div>
      <a class="link-more" href="#">Ver todos →</a>
    </div>

    <div class="grid">
      <article class="card">
        <div class="ph" style="background:radial-gradient(120% 100% at 40% 30%, #e9d7bb, #cdb489)"><span class="badge">-29%</span>foto producto</div>
        <div class="body">
          <span class="catname">Sillas</span>
          <span class="name">Sillón de Oficina KM 5050</span>
          <div class="price"><span class="now">$56.990</span><span class="was">$79.990</span></div>
          <button class="addbtn">Consultar</button>
        </div>
      </article>

      <article class="card">
        <div class="ph" style="background:radial-gradient(120% 100% at 60% 30%, #dfe7ee, #a9c2d8)">foto producto</div>
        <div class="body">
          <span class="catname">Ergonómicas</span>
          <span class="name">Silla Ergonómica KM 3035</span>
          <div class="price"><span class="now">$42.990</span></div>
          <button class="addbtn">Consultar</button>
        </div>
      </article>

      <article class="card">
        <div class="ph" style="background:radial-gradient(120% 100% at 50% 30%, #efe1c2, #d8c08a)">foto producto</div>
        <div class="body">
          <span class="catname">Escritorios</span>
          <span class="name">Escritorio Home Office</span>
          <div class="price"><span class="now">$89.990</span></div>
          <button class="addbtn">Consultar</button>
        </div>
      </article>

      <article class="card">
        <div class="ph" style="background:radial-gradient(120% 100% at 55% 35%, #dce8d6, #a8c79a)"><span class="badge">Nuevo</span>foto producto</div>
        <div class="body">
          <span class="catname">Gamer</span>
          <span class="name">Silla Gamer Pro Recline</span>
          <div class="price"><span class="now">$74.990</span></div>
          <button class="addbtn">Consultar</button>
        </div>
      </article>
    </div>
  </div>
</section>

<!-- Banda promocional -->
<section id="espacios">
  <div class="wrap">
    <div class="promo">
      <div>
        <p class="eyebrow" style="color:#fde6d6">Espacios que inspiran</p>
        <h2>Armá tu home office ideal</h2>
        <p>Silla ergonómica + escritorio + almacenaje, pensados para que trabajes cómodo todo el día. Asesoría y despacho a todo Chile.</p>
        <button class="cta ctalight">Ver combos</button>
      </div>
      <div class="art" role="img" aria-label="Ilustración decorativa"></div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="site" id="inspiracion">
  <div class="wrap cols">
    <div>
      <a class="brand" href="#"><span class="b1">Mobiliario</span><span class="b2">Tech</span></a>
      <p style="max-width:34ch;margin-top:14px;color:#cbbfae;font-size:14px">Muebles de oficina y hogar a precio mayorista. Carmen 1865, Santiago, Chile.</p>
      <p class="wa" style="margin-top:10px">WhatsApp +56 9 6154 4423</p>
    </div>
    <div>
      <h4>Tienda</h4>
      <a href="#">Sillas de oficina</a>
      <a href="#">Escritorios</a>
      <a href="#">Sillas gamer</a>
      <a href="#">Ofertas del día</a>
    </div>
    <div>
      <h4>Ayuda</h4>
      <a href="#">Despacho y cobertura</a>
      <a href="#">Cambios y garantía</a>
      <a href="#">Cotización mayorista</a>
      <a href="#">Contacto</a>
      <a href="/generador">Generador de avisos</a>
    </div>
    <div>
      <h4>Horario</h4>
      <a href="#" tabindex="-1" style="cursor:default">Lun a Vie 10–19 hrs</a>
      <a href="#" tabindex="-1" style="cursor:default">Sábado 10–18 hrs</a>
    </div>
  </div>
  <div class="legal">© 2026 MobiliarioTech · Santiago de Chile</div>
</footer>

<script>
  // Toggle simple del menú en móvil (muestra/oculta la navegación).
  const burger = document.querySelector(".burger");
  const menu = document.querySelector(".menu");
  burger?.addEventListener("click", () => {
    const open = menu.style.display === "flex";
    menu.style.display = open ? "" : "flex";
    menu.style.position = "absolute";
    menu.style.flexDirection = "column";
    menu.style.top = "76px";
    menu.style.left = "0";
    menu.style.right = "0";
    menu.style.background = "var(--cream)";
    menu.style.padding = open ? "" : "16px clamp(16px,4vw,40px)";
    menu.style.borderBottom = open ? "" : "1px solid var(--line)";
  });
</script>
</body>
</html>`;
}
