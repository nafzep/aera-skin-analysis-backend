import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // ✅ CORS FIX
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ✅ NEW CORRECT FORMIDABLE SYNTAX (v3)
    const form = formidable();

    const [fields, files] = await form.parse(req);

    if (!files.image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const imageFile = files.image[0]; // ✅ v3 uses array
    const imageBuffer = fs.readFileSync(imageFile.filepath);
    const imageBase64 = imageBuffer.toString("base64");

    const response = await fetch(
      process.env.PERFECTCORP_BASE + "/v1/ai/skin-analysis/task",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Api-Key ${process.env.PERFECTCORP_API_KEY}`,
        },
        body: JSON.stringify({ imageBase64 }),
      }
    );

    const result = await response.json();
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
}
