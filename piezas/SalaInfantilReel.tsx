import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Marca MobiliarioTech (igual que apoyameve/lib/brand.ts)
const C = {
  primary: "#b24a2c",
  dark: "#1c1815",
  light: "#fbf7f0",
  muted: "#8a7c6a",
};
const FONT = "'Inter', sans-serif";
const WHATSAPP = "+56 9 6154 4423";

const W = 1080;
const H = 1920;
const IMG_W = 1200;
const IMG_H = 1600;

// Cámara: zoom k (1 = foto llena el alto) y punto focal normalizado.
const CAM_FRAMES = [0, 95, 125, 195, 225, 290];
const CAM_K = [1.0, 1.1, 1.5, 1.6, 1.5, 1.42];
const CAM_FX = [0.5, 0.5, 0.2, 0.24, 0.74, 0.7];
const CAM_FY = [0.52, 0.56, 0.64, 0.62, 0.74, 0.72];

const ease = Easing.inOut(Easing.cubic);
const cam = (f: number, arr: number[]) =>
  interpolate(f, CAM_FRAMES, arr, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

const Photo: React.FC = () => {
  const f = useCurrentFrame();
  const k = cam(f, CAM_K);
  const fx = cam(f, CAM_FX);
  const fy = cam(f, CAM_FY);
  const h = H * k;
  const w = (IMG_W / IMG_H) * h;
  const left = Math.min(0, Math.max(W - w, W / 2 - fx * w));
  const top = Math.min(0, Math.max(H - h, H / 2 - fy * h));
  return (
    <AbsoluteFill style={{overflow: "hidden", background: C.dark}}>
      <Img
        src={staticFile("assets/sala-infantil.jpg")}
        style={{position: "absolute", left, top, width: w, height: h}}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(28,24,21,0.55) 0%, rgba(28,24,21,0) 18%, rgba(28,24,21,0) 50%, rgba(28,24,21,0.85) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// Bloque de texto que entra desde abajo y sale con fade.
const Caption: React.FC<{
  from: number;
  to: number;
  kicker: string;
  title: string;
  sub?: string;
}> = ({from, to, kicker, title, sub}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < from - 1 || f > to + 1) return null;
  const s = spring({frame: f - from, fps, config: {damping: 200}});
  const out = interpolate(f, [to - 12, to], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const s2 = spring({frame: f - from - 8, fps, config: {damping: 200}});
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        bottom: 300,
        opacity: out,
        fontFamily: FONT,
        color: C.light,
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: C.primary,
          padding: "12px 26px",
          borderRadius: 999,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: "uppercase",
          opacity: s,
          transform: `translateY(${(1 - s) * 30}px)`,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          marginTop: 26,
          fontSize: 92,
          lineHeight: 1.02,
          fontWeight: 900,
          letterSpacing: -2.5,
          opacity: s2,
          transform: `translateY(${(1 - s2) * 60}px)`,
          textShadow: "0 4px 30px rgba(0,0,0,0.35)",
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          style={{
            marginTop: 22,
            fontSize: 40,
            fontWeight: 500,
            opacity: s2 * 0.9,
            transform: `translateY(${(1 - s2) * 40}px)`,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
};

const EndCard: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < from) return null;
  const local = f - from;
  const bg = interpolate(local, [0, 14], [0, 1], {extrapolateRight: "clamp"});
  const a = spring({frame: local - 6, fps, config: {damping: 200}});
  const b = spring({frame: local - 14, fps, config: {damping: 200}});
  const c = spring({frame: local - 24, fps, config: {damping: 14, mass: 0.6}});
  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      <AbsoluteFill style={{background: C.light, opacity: bg}} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          padding: "0 80px",
          color: C.dark,
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: C.primary,
            opacity: a,
            transform: `translateY(${(1 - a) * 30}px)`,
          }}
        >
          MobiliarioTech
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 112,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: -3.5,
            opacity: b,
            transform: `translateY(${(1 - b) * 50}px)`,
          }}
        >
          Equipamos
          <br />
          tu espacio
        </div>
        <div
          style={{
            marginTop: 34,
            fontSize: 40,
            fontWeight: 500,
            color: C.muted,
            opacity: b,
          }}
        >
          Mobiliario infantil y educativo.
          <br />
          Despacho a todo Chile.
        </div>
        <div
          style={{
            marginTop: 80,
            alignSelf: "flex-start",
            background: C.primary,
            color: C.light,
            borderRadius: 28,
            padding: "34px 48px",
            transform: `scale(${0.85 + 0.15 * c})`,
            transformOrigin: "left center",
            opacity: Math.min(1, c * 1.5),
          }}
        >
          <div style={{fontSize: 32, fontWeight: 600, opacity: 0.85}}>
            Cotiza por WhatsApp
          </div>
          <div style={{fontSize: 64, fontWeight: 900, marginTop: 6}}>
            {WHATSAPP}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Brand: React.FC<{until: number}> = ({until}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 15, until - 10, until], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 140,
        left: 72,
        fontFamily: FONT,
        fontSize: 40,
        fontWeight: 800,
        color: C.light,
        opacity: o,
        letterSpacing: -0.5,
      }}
    >
      MobiliarioTech
    </div>
  );
};

const Progress: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        height: 8,
        width: `${(f / (durationInFrames - 1)) * 100}%`,
        background: C.primary,
      }}
    />
  );
};

export const SalaInfantilReel: React.FC = () => (
  <AbsoluteFill style={{background: C.dark}}>
    <Photo />
    <Brand until={290} />
    <Caption
      from={8}
      to={100}
      kicker="Proyecto entregado"
      title="Sala infantil equipada"
      sub="Un espacio para aprender y jugar"
    />
    <Caption
      from={118}
      to={200}
      kicker="Trabajo en grupo"
      title="Mesas y sillas a su medida"
    />
    <Caption
      from={218}
      to={290}
      kicker="Rincón de lectura"
      title="Puffs, mesa y guardado"
    />
    <EndCard from={285} />
    <Progress />
  </AbsoluteFill>
);
