import { generateText } from "ai";

// Auth handled automatically via Vercel AI Gateway (OIDC).
// Run `vercel env pull` locally to provision credentials.

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let messages;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const extraContext = formData.get("context") || "";

      if (!file) {
        return Response.json({ error: "No file provided" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mediaType = file.type || "image/png";

      messages = [
        {
          role: "user",
          content: [
            { type: "image", image: `data:${mediaType};base64,${base64}` },
            {
              type: "text",
              text: `Extract all tabular/financial data from this image and convert it to CSV.
${extraContext ? `Context: ${extraContext}` : ""}

Output ONLY raw CSV — no markdown, no explanation.
- First row must be column headers
- Detect columns automatically (date, description, amount, category, currency, etc.)
- Use comma delimiter; wrap values containing commas in double-quotes
- If multiple tables exist, separate with a blank line`,
            },
          ],
        },
      ];
    } else {
      const body = await request.json();
      const { text, context } = body;

      if (!text) {
        return Response.json({ error: "No text data provided" }, { status: 400 });
      }

      messages = [
        {
          role: "user",
          content: `Convert this financial data to CSV format.
${context ? `Context: ${context}` : ""}

Data:
${text}

Output ONLY raw CSV — no markdown, no explanation. First row must be headers.`,
        },
      ];
    }

    const { text: csv } = await generateText({
      model: "anthropic/claude-haiku-4.5",
      messages,
      maxTokens: 4096,
    });

    return new Response(csv.trim(), {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="converted.csv"',
      },
    });
  } catch (err) {
    console.error("CSV conversion error:", err);
    return Response.json(
      { error: err.message || "Conversion failed. Ensure Vercel AI Gateway is enabled and run `vercel env pull`." },
      { status: 500 }
    );
  }
}
