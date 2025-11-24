export default async function handler(req, res) {
  try {
    const { event, properties, ttclid, test_event_code } = req.body;

    if (!event) {
      return res.status(400).json({ error: "Missing event name" });
    }

    const pixel_id = process.env.TIKTOK_PIXEL_ID;
    const access_token = process.env.TIKTOK_ACCESS_TOKEN;

    const payload = {
      pixel_code: pixel_id,
      event: event,
      event_time: Math.floor(Date.now() / 1000),
      context: {
        ad: {
          callback: ttclid || null,
        },
      },
      properties: properties || {},
      test_event_code: test_event_code || undefined
    };

    const tiktokRes = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: {
        "Access-Token": access_token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await tiktokRes.json();
    res.status(200).json({ success: true, tiktok: data });
  } catch (e) {
    console.error("Server error:", e);
    res.status(500).json({ error: "Server error" });
  }
}
