import fetch from "node-fetch";

const BASE = process.env.PERFECTCORP_BASE || "https://yce-api-01.perfectcorp.com";
const API_KEY = process.env.PERFECTCORP_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

function allowCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { imageBase64, dst_actions } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "Image is required" });

    const fileReq = await fetch(`${BASE}/s2s/v2.0/file/skin-analysis`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ files: [{}] })
    });

    const fileJson = await fileReq.json();
    const fileInfo = fileJson.data.files[0];
    const uploadUrl = fileInfo.upload_url;
    const file_id = fileInfo.file_id;

    const base64 = imageBase64.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg", "Content-Length": buffer.length },
      body: buffer
    });

    const taskRes = await fetch(`${BASE}/s2s/v2.0/task/skin-analysis`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        src_file_id: file_id,
        dst_actions: dst_actions || ["wrinkle", "pore", "texture", "acne"]
      })
    });

    const taskJson = await taskRes.json();
    const taskId = taskJson.data.task_id;

    const pollUrl = `${BASE}/s2s/v2.0/task/skin-analysis/${taskId}`;
    let result;

    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(pollUrl, {
        headers: { "Authorization": `Bearer ${API_KEY}` }
      });
      const pollJson = await pollRes.json();

      if (pollJson.data.task_status === "success") {
        result = pollJson.data;
        break;
      }
    }

    return res.status(200).json({ success: true, results: result });

  } catch (err) {
    return res.status(500).json({ error: err.toString() });
  }
}
