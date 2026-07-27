// Generador de video (Reel/TikTok/Historia) en el navegador del usuario.
// Toma la FOTO REAL del producto (servida same-origin por /img para no "ensuciar"
// el canvas), le aplica un zoom cinematográfico (Ken Burns) + la marca encima, y
// una música suave sintetizada (llamativa, no ruidosa). Graba con MediaRecorder y
// descarga el archivo listo para postear. Sin IA, sin servicios pagados.
import { BRAND } from "../lib/brand";
import { formatCLP, discountPercent } from "../lib/format";
import type { Product } from "../lib/jumpseller";

export function reelHTML(p: Product): string {
  const onSale = p.compareAtPrice != null && p.compareAtPrice > p.price;
  const data = {
    name: p.name,
    category: p.category || "",
    priceNow: p.quotable ? "Consultar precio" : formatCLP(p.price),
    priceOld: onSale ? formatCLP(p.compareAtPrice as number) : "",
    disc: discountPercent(p.price, p.compareAtPrice) ?? 0,
    onSale,
    img: `/img?id=${p.id}`,
    brand: BRAND.name,
    whatsapp: BRAND.whatsapp,
    cta: "Despacho a todo Chile",
  };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="es"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Reel · ${BRAND.name}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
  header{padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  header a{color:#93c5fd;font-size:14px;text-decoration:none}
  main{max-width:520px;margin:0 auto;padding:0 16px 40px;text-align:center}
  canvas,video{width:100%;max-width:320px;border-radius:16px;background:#000;display:block;margin:0 auto;box-shadow:0 20px 50px -20px rgba(0,0,0,.7)}
  video{display:none}
  .controls{margin-top:18px;display:flex;flex-direction:column;gap:12px;align-items:center}
  button{font-size:16px;font-weight:700;padding:14px 22px;border:0;border-radius:12px;cursor:pointer}
  .primary{background:#e11d48;color:#fff}
  .primary:disabled{opacity:.5;cursor:default}
  .toggle{background:transparent;color:#cbd5e1;border:1px solid #334155;font-size:14px;padding:8px 14px}
  .toggle[aria-pressed="false"]{opacity:.6}
  .hint{color:#94a3b8;font-size:13px;line-height:1.5;max-width:360px;margin:6px auto 0}
  .status{font-size:14px;color:#fbbf24;min-height:20px}
  .dl{display:none;background:#0ea5e9;color:#fff}
</style>
</head>
<body>
<header>
  <div style="font-weight:800">🎬 Reel · ${BRAND.name}</div>
  <a href="javascript:history.back()">← Volver</a>
</header>
<main>
  <canvas id="c" width="720" height="1280"></canvas>
  <video id="v" controls playsinline></video>
  <div class="controls">
    <button id="rec" class="primary">▶ Grabar video (10 s)</button>
    <a id="dl" class="dl" download>⬇ Descargar de nuevo</a>
    <button id="mute" class="toggle" aria-pressed="true">🔊 Música: activada</button>
    <div id="status" class="status"></div>
    <p class="hint">Al tocar <b>Grabar</b> se arma el video con la música y se descarga solo.
    Formato vertical 720×1280, ideal para Reels, TikTok e Historias.</p>
  </div>
</main>
<script>
const D = JSON.parse("${json}");
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const W = cv.width, H = cv.height, DUR = 10; // segundos
let musicOn = true;

// ---- Cargar la foto real (same-origin vía /img) ----
const img = new Image();
img.crossOrigin = 'anonymous';
let imgReady = false;
img.onload = () => { imgReady = true; drawFrame(0, 1); };
img.onerror = () => { imgReady = false; drawFrame(0, 1); };
img.src = D.img;

// ---- Utilidades de dibujo ----
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function wrap(text, maxW, font){
  ctx.font = font; const words = text.split(/\\s+/); const lines=[]; let cur='';
  for(const w of words){ const t = cur? cur+' '+w : w; if(ctx.measureText(t).width>maxW && cur){lines.push(cur);cur=w;} else cur=t; }
  if(cur) lines.push(cur); return lines.slice(0,3);
}

function drawFrame(t, alpha){
  // Fondo crema cálido (coherente con la tienda)
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#f7f1e8'); g.addColorStop(1,'#e9ddcb');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // Foto con zoom lento (Ken Burns). "contain" para no cortar el mueble.
  if(imgReady){
    const zone = {x:0,y:60,w:W,h:H*0.72};
    const scale = 0.9 + t*0.12;           // 0.90 -> 1.02
    const panY = t*40;                     // leve descenso
    const iw=img.naturalWidth, ih=img.naturalHeight;
    const base = Math.min(zone.w/iw, zone.h/ih);
    const s = base*scale, dw=iw*s, dh=ih*s;
    const dx = zone.x+(zone.w-dw)/2, dy = zone.y+(zone.h-dh)/2 + panY;
    ctx.save(); ctx.shadowColor='rgba(0,0,0,.18)'; ctx.shadowBlur=40; ctx.shadowOffsetY=20;
    ctx.drawImage(img, dx, dy, dw, dh); ctx.restore();
  }

  // Logo (texto) arriba a la izquierda
  ctx.textBaseline='alphabetic';
  ctx.font='800 40px system-ui,sans-serif'; ctx.fillStyle='#0f172a'; ctx.textAlign='left';
  ctx.fillText('Mobiliario', 40, 66);
  const mw = ctx.measureText('Mobiliario').width;
  ctx.fillStyle='#c2410c'; ctx.fillText('Tech', 40+mw, 66);

  // Chip de categoría
  if(D.category){
    ctx.font='700 24px system-ui,sans-serif';
    const cw = ctx.measureText(D.category).width + 32;
    ctx.fillStyle='rgba(15,23,42,.9)'; roundRect(W-40-cw, 34, cw, 44, 22); ctx.fill();
    ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.fillText(D.category, W-40-cw/2, 64);
  }

  // Sello de descuento
  if(D.onSale && D.disc>0){
    const r=76, cx=W-40-r, cy=170+r;
    ctx.fillStyle='#e11d48'; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.font='900 46px system-ui,sans-serif'; ctx.fillText('-'+D.disc+'%', cx, cy+2);
    ctx.font='700 20px system-ui,sans-serif'; ctx.fillText('OFERTA', cx, cy+34);
  }

  // Bloque de texto inferior
  const by = H*0.80;
  ctx.textAlign='left';
  const nameLines = wrap(D.name, W-80, '800 46px system-ui,sans-serif');
  ctx.font='800 46px system-ui,sans-serif'; ctx.fillStyle='#0f172a';
  let y = by; for(const l of nameLines){ ctx.fillText(l, 40, y); y+=54; }

  // Precio
  y += 6;
  ctx.font='900 62px system-ui,sans-serif'; ctx.fillStyle='#0f172a';
  ctx.fillText(D.priceNow, 40, y);
  if(D.priceOld){
    const pw = ctx.measureText(D.priceNow).width;
    ctx.font='600 34px system-ui,sans-serif'; ctx.fillStyle='#94a3b8';
    ctx.fillText(D.priceOld, 40+pw+18, y-6);
    const ow = ctx.measureText(D.priceOld).width;
    ctx.strokeStyle='#94a3b8'; ctx.lineWidth=3; ctx.beginPath();
    ctx.moveTo(40+pw+18, y-18); ctx.lineTo(40+pw+18+ow, y-18); ctx.stroke();
  }

  // CTA + WhatsApp
  y += 46;
  ctx.font='700 30px system-ui,sans-serif'; ctx.fillStyle='#c2410c';
  ctx.fillText(D.cta + '  ·  ' + D.whatsapp, 40, y);

  // Fade in/out
  if(alpha<1){ ctx.fillStyle='rgba(15,23,42,'+(1-alpha)+')'; ctx.fillRect(0,0,W,H); }
}

// ---- Música suave sintetizada (Web Audio) ----
function startMusic(actx){
  const master = actx.createGain(); master.gain.value = 0.0;
  const lp = actx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2600;
  master.connect(lp);
  const dest = actx.createMediaStreamDestination();
  lp.connect(actx.destination); lp.connect(dest);
  // envolvente general (fade in/out)
  const now = actx.currentTime;
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(musicOn?0.16:0.0, now+1.2);
  master.gain.setValueAtTime(musicOn?0.16:0.0, now+DUR-1.5);
  master.gain.linearRampToValueAtTime(0, now+DUR);

  // Progresión cálida y pegajosa (Cmaj7 - Am7 - Fmaj7 - G)
  const chords = [[523.25,659.25,783.99,987.77],[440,523.25,659.25,830.61],[349.23,440,523.25,659.25],[392,493.88,587.33,783.99]];
  const step = DUR/8; // 8 compases cortos
  for(let i=0;i<8;i++){
    const chord = chords[i%chords.length];
    const t0 = now + i*step;
    chord.forEach((f,idx)=>{
      const o = actx.createOscillator(); o.type = idx===0?'triangle':'sine'; o.frequency.value=f;
      const g = actx.createGain(); g.gain.value=0;
      o.connect(g); g.connect(master);
      const at = t0 + idx*0.06;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(0.22/chord.length, at+0.08);
      g.gain.exponentialRampToValueAtTime(0.001, at+step*0.95);
      o.start(at); o.stop(at+step);
    });
  }
  return dest;
}

// ---- Grabar ----
const recBtn=document.getElementById('rec'), statusEl=document.getElementById('status');
const muteBtn=document.getElementById('mute'), videoEl=document.getElementById('v'), dlLink=document.getElementById('dl');
let lastUrl=null;

muteBtn.onclick=()=>{ musicOn=!musicOn; muteBtn.setAttribute('aria-pressed',String(musicOn));
  muteBtn.textContent = musicOn?'🔊 Música: activada':'🔇 Música: apagada'; };

function pickMime(){
  const c=['video/mp4;codecs=avc1,mp4a','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];
  for(const m of c){ if(window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m; }
  return '';
}

recBtn.onclick=async ()=>{
  recBtn.disabled=true; dlLink.style.display='none'; videoEl.style.display='none'; cv.style.display='block';
  statusEl.textContent='Preparando…';
  const actx = new (window.AudioContext||window.webkitAudioContext)();
  try{ await actx.resume(); }catch(e){}
  const audioDest = startMusic(actx);

  const vStream = cv.captureStream(30);
  const tracks = [...vStream.getVideoTracks(), ...audioDest.stream.getAudioTracks()];
  const stream = new MediaStream(tracks);
  const mime = pickMime();
  let rec; try{ rec = new MediaRecorder(stream, mime?{mimeType:mime,videoBitsPerSecond:6000000}:undefined); }
  catch(e){ statusEl.textContent='Tu navegador no permite grabar video aquí. Probá con Chrome.'; recBtn.disabled=false; return; }
  const chunks=[]; rec.ondataavailable=e=>{ if(e.data.size) chunks.push(e.data); };
  rec.onstop=()=>{
    const type = (mime||'video/webm').split(';')[0];
    const ext = type.includes('mp4')?'mp4':'webm';
    const blob = new Blob(chunks,{type});
    if(lastUrl) URL.revokeObjectURL(lastUrl);
    lastUrl = URL.createObjectURL(blob);
    const fname = 'reel-'+(D.name||'mobiliariotech').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,40)+'.'+ext;
    videoEl.src=lastUrl; videoEl.style.display='block'; cv.style.display='none';
    dlLink.href=lastUrl; dlLink.download=fname; dlLink.style.display='inline-block';
    // descarga automática
    const a=document.createElement('a'); a.href=lastUrl; a.download=fname; document.body.appendChild(a); a.click(); a.remove();
    statusEl.textContent='¡Listo! Video descargado ('+ext.toUpperCase()+'). Ya podés subirlo.';
    recBtn.disabled=false; recBtn.textContent='▶ Grabar de nuevo';
    try{ actx.close(); }catch(e){}
  };

  // animación + grabación
  const t0 = performance.now();
  rec.start();
  function loop(now){
    const el = (now - t0)/1000; const t = Math.min(el/DUR, 1);
    const fadeIn = Math.min(el/0.8, 1), fadeOut = Math.min((DUR-el)/0.8, 1);
    drawFrame(t, Math.max(0, Math.min(fadeIn, fadeOut)));
    const left = Math.max(0, DUR-el);
    statusEl.textContent='Grabando… '+left.toFixed(1)+' s';
    if(el < DUR){ requestAnimationFrame(loop); } else { rec.stop(); }
  }
  requestAnimationFrame(loop);
};
</script>
</body></html>`;
}
