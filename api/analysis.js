export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No imageBase64 received" });
    }

    const response = await fetch(
      process.env.PERFECTCORP_BASE + "/v1/ai/skin-analysis/task",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Api-Key ${process.env.PERFECTCORP_API_KEY}`
        },
        body: JSON.stringify({ imageBase64 })
      }
    );

    const result = await response.json();
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
