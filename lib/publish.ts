// Publicación en redes vía Meta Graph API. Se activa cuando existen los tokens;
// sin ellos, el motor deja la pieza en cola (ver src/index.ts).

export type PublishResult = { platform: string; ok: boolean; detail: string };

const GRAPH = "https://graph.facebook.com/v21.0";

// Instagram: crear contenedor de media y luego publicarlo.
// Requiere un IG Business/Creator vinculado a una Página de Facebook.
export async function publishInstagram(
  igUserId: string,
  token: string,
  imageUrl: string,
  cap: string,
): Promise<PublishResult> {
  try {
    const create = await fetch(`${GRAPH}/${igUserId}/media`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image_url: imageUrl, caption: cap, access_token: token }),
    });
    const cj = (await create.json()) as { id?: string; error?: { message?: string } };
    if (!create.ok || !cj.id) {
      return { platform: "instagram", ok: false, detail: cj.error?.message ?? "sin container id" };
    }
    const pub = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ creation_id: cj.id, access_token: token }),
    });
    const pj = (await pub.json()) as { id?: string; error?: { message?: string } };
    return {
      platform: "instagram",
      ok: pub.ok && !!pj.id,
      detail: pj.id ?? pj.error?.message ?? "falló publish",
    };
  } catch (e) {
    return { platform: "instagram", ok: false, detail: (e as Error).message };
  }
}

// TikTok: publicar una foto vía Content Posting API (PULL_FROM_URL, Direct Post).
// Requiere access token con scope de publicación y el dominio verificado en el
// portal de TikTok para que acepte descargar la imagen desde PUBLIC_BASE_URL.
export async function publishTikTok(
  token: string,
  imageUrl: string,
  title: string,
): Promise<PublishResult> {
  try {
    const res = await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({
        post_info: {
          title: title.slice(0, 90),
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_comment: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 0,
          photo_images: [imageUrl],
        },
        post_mode: "DIRECT_POST",
        media_type: "PHOTO",
      }),
    });
    const j = (await res.json()) as {
      data?: { publish_id?: string };
      error?: { code?: string; message?: string };
    };
    const ok = res.ok && j.error?.code === "ok" && !!j.data?.publish_id;
    return {
      platform: "tiktok",
      ok,
      detail: j.data?.publish_id ?? j.error?.message ?? "falló init",
    };
  } catch (e) {
    return { platform: "tiktok", ok: false, detail: (e as Error).message };
  }
}

// Facebook: publicar una foto en una Página.
export async function publishFacebook(
  pageId: string,
  token: string,
  imageUrl: string,
  cap: string,
): Promise<PublishResult> {
  try {
    const res = await fetch(`${GRAPH}/${pageId}/photos`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: imageUrl, caption: cap, access_token: token }),
    });
    const j = (await res.json()) as { id?: string; post_id?: string; error?: { message?: string } };
    return {
      platform: "facebook",
      ok: res.ok && (!!j.id || !!j.post_id),
      detail: j.post_id ?? j.id ?? j.error?.message ?? "falló",
    };
  } catch (e) {
    return { platform: "facebook", ok: false, detail: (e as Error).message };
  }
}
