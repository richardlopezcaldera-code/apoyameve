// Publicación vía Metricool (un solo integrador para IG + FB + TikTok).
// El usuario ya conecta sus redes en Metricool; acá solo programamos/publicamos.
//
// NOTA: implementado contra la API documentada de Metricool (scheduler v2).
// La primera prueba con /run-now confirma el contrato; si algún campo difiere,
// se ajusta con el detalle que devuelva la respuesta (por eso devolvemos el body).

import type { PublishResult } from "./publish";

export type MetricoolConfig = {
  userToken: string;
  userId: string;
  blogId: string;
  networks: string[]; // p.ej. ["instagram","facebook","tiktok"]
};

// Fecha/hora local (Chile) en el formato que espera el scheduler.
function nowInSantiago(): string {
  // Worker runtime tiene Date; formateamos YYYY-MM-DDTHH:mm:ss en America/Santiago.
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}:${g("second")}`;
}

export async function publishViaMetricool(
  cfg: MetricoolConfig,
  imageUrl: string,
  text: string,
): Promise<PublishResult> {
  const url =
    `https://app.metricool.com/api/v2/scheduler/posts` +
    `?userId=${encodeURIComponent(cfg.userId)}&blogId=${encodeURIComponent(cfg.blogId)}`;

  const body = {
    autoPublish: true,
    providers: cfg.networks.map((network) => ({ network })),
    publicationDate: { dateTime: nowInSantiago(), timezone: "America/Santiago" },
    text,
    media: [imageUrl],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Mc-Auth": cfg.userToken,
      },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    return {
      platform: `metricool(${cfg.networks.join("+")})`,
      ok: res.ok,
      detail: res.ok ? "programado/publicado" : `HTTP ${res.status}: ${raw.slice(0, 200)}`,
    };
  } catch (e) {
    return { platform: "metricool", ok: false, detail: (e as Error).message };
  }
}
