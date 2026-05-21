export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const authSecret = env.AUTH_SECRET || "change-this-in-cloudflare-secrets";

    // 1. Random Image (GET /random?folder=xxx)
    if (request.method === "GET" && url.pathname === "/random") {
      const folder = url.searchParams.get("folder") || "default";
      const list = await env.MY_BUCKET.list({ prefix: `${folder}/` });
      
      if (!list.objects || list.objects.length === 0) {
        return new Response("No images found in folder: " + folder, { status: 404 });
      }
      
      const randomIndex = Math.floor(Math.random() * list.objects.length);
      const item = list.objects[randomIndex];
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
      const timestamp = Date.now();
      const fileName = `${folder}/${timestamp}.jpg`;
      const body = await request.arrayBuffer();

      if (body.byteLength === 0) {
        return new Response("Empty body", { status: 400 });
      }

      await env.MY_BUCKET.put(fileName, body, {
        httpMetadata: { contentType: "image/jpeg" }
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

    // 3. List Folders (GET /folders) - Optional for UI
    if (request.method === "GET" && url.pathname === "/folders") {
        const list = await env.MY_BUCKET.list({ delimiter: '/' });
        const folders = list.delimitedPrefixes.map(p => p.replace('/', ''));
        return new Response(JSON.stringify(folders), {
            headers: { "Content-Type": "application/json" }
        });
    }

    return new Response("Wallpaper API: Use /random or /upload", { status: 200 });
  }
};
