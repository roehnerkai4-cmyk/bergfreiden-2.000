export async function onRequestPost({ request, env }) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return Response.json({ error: "Keine Datei gefunden" }, { status: 400 });
    }

    const originalFileName = file.name || "upload.bin";
    const safeName = originalFileName.replace(/[^\w.-]/g, "_");
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const fileBuffer = await file.arrayBuffer();

    await env.MANUSCRIPTS_BUCKET.put(uniqueName, fileBuffer, {
      httpMetadata: {
        contentType: file.type || "application/octet-stream",
      },
      customMetadata: {
        originalName: originalFileName,
      },
    });

    const publicUrl = `${env.PUBLIC_R2_URL.replace(/\/$/, "")}/${uniqueName}`;

    return Response.json(
      {
        ok: true,
        fileName: originalFileName,
        url: publicUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
}
