export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const authSecret = env.AUTH_SECRET || "change-this-in-cloudflare-secrets";

    // 1. Random Image (GET /random?folder=xxx or ?folder=* for all folders)
    if (request.method === "GET" && url.pathname === "/random") {
      const folder = url.searchParams.get("folder") || "default";
      const objects = folder === "*"
        ? await listAllObjects(env.MY_BUCKET, "")
        : await listAllObjects(env.MY_BUCKET, `${folder}/`);

      if (objects.length === 0) {
        return new Response("No images found in folder: " + folder, { status: 404 });
      }

      const item = objects[Math.floor(Math.random() * objects.length)];
      const object = await env.MY_BUCKET.get(item.key);

      return new Response(object.body, {
        headers: {
          "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
          "Cache-Control": "no-cache"
        }
      });
    }

    // 2. Upload Image (POST /upload?folder=xxx)
    if (request.method === "POST" && url.pathname === "/upload") {
      const authHeader = request.headers.get("Authorization");
      if (authHeader !== `Bearer ${authSecret}`) {
        return new Response("Unauthorized", { status: 401 });
      }

      const folder = url.searchParams.get("folder") || "default";
      const contentType = request.headers.get("Content-Type") || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : "jpg";
      const fileName = `${folder}/${Date.now()}.${ext}`;
      const body = await request.arrayBuffer();

      if (body.byteLength === 0) {
        return new Response("Empty body", { status: 400 });
      }

      await env.MY_BUCKET.put(fileName, body, {
        httpMetadata: { contentType }
      });

      return new Response(JSON.stringify({
        success: true,
        message: `Uploaded to ${fileName}`,
        key: fileName
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 3. List Folders (GET /folders)
    if (request.method === "GET" && url.pathname === "/folders") {
      const list = await env.MY_BUCKET.list({ delimiter: "/" });
      const folders = list.delimitedPrefixes.map(p => p.replace(/\/$/, ""));
      return new Response(JSON.stringify(folders), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Wallpaper API: Use /random or /upload", { status: 200 });
  }
};

// 處理 R2 list() 分頁，並過濾掉資料夾節點（key 以 / 結尾）
async function listAllObjects(bucket, prefix) {
  const objects = [];
  let cursor;

  do {
    const result = await bucket.list({ prefix, cursor });
    for (const obj of result.objects) {
      if (!obj.key.endsWith("/")) objects.push(obj);
    }
    cursor = result.truncated ? result.cursor : undefined;
  } while (cursor);

  return objects;
}
