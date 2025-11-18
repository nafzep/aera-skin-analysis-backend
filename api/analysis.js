import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: "Image upload failed", details: err });
      }

      if (!files.image) {
        return res.status(400).json({ error: "No image provided" });
      }

      const imageBuffer = fs.readFileSync(files.image.filepath);
      const imageBase64 = imageBuffer.toString("base64");

      const response = await fetch(
        process.env.PERFECTCORP_BASE + "/v1/ai/skin-analysis/task",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Api-Key ${process.env.PERFECTCORP_API_KEY}`
          },
          body: JSON.stringify({
            imageBase64: imageBase64
          })
        }
      );

      const result = await response.json();
      return res.status(200).json(result);
    });

  } catch (error) {
    return res.status(500).json({ error: error.toString() });
  }
}
