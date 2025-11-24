export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, properties, ttclid, test_event_code } = req.body;

    const pixelId = process.env.TIKTOK_PIXEL_ID;
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      console.error('Missing TikTok creds:', { pixelId, accessToken });
      return res.status(500).json({ error: 'Missing TikTok API credentials' });
    }

    const payload = {
      pixel_code: pixelId,
      event: event,
      event_id: `${event}-${Date.now()}`, // required unique ID
      timestamp: new Date().toISOString(),
      context: {
        user: {
          ttclid: ttclid || null,
        },
        page: {
          url: req.headers.referer || "",
        },
      },
      properties: properties || {},
    };

    // 👉 VERY IMPORTANT FOR TEST MODE
    if (test_event_code) {
      payload.test_event_code = test_event_code;
    }

    const tiktokResponse = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/event/track/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': accessToken,
        },
        body: JSON.stringify({
          event_source: 'web',
          data: [payload],
        }),
      }
    );

    const data = await tiktokResponse.json();
    console.log('TikTok API response:', data);

    return res.status(200).json({
      ok: true,
      sent: payload,
      returned: data,
    });
  } catch (err) {
    console.error('TikTok server event error:', err);
    return res.status(500).json({ ok: false, error: 'server error' });
  }
}
