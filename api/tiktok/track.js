export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, properties = {}, ttclid, test_event_code } = req.body || {};

    if (!event) {
      return res.status(400).json({ error: 'Missing event name' });
    }

    const pixelCode = process.env.TIKTOK_PIXEL_ID;
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

    if (!pixelCode || !accessToken) {
      return res.status(500).json({ error: 'Missing TikTok env vars' });
    }

    // ====== normalize properties / content_id =========
    const rawContentId =
      typeof properties.content_id === 'string'
        ? properties.content_id.trim()
        : '';

    const contentId = rawContentId || 'landing-page';
    const contentType = properties.content_type || 'product';
    const value = 0.2;              // <--- always $0.20
    const currency = properties.currency || 'USD';

    // final props we send to TikTok
    const finalProps = {
      ...properties,
      content_id: contentId,
      content_type: contentType,
      value,                        // 0.50
      currency,
      contents: [
        {
          content_id: contentId,
          content_type: contentType,
          price: value,             // 0.50
          quantity: 1,
        },
      ],
    };

    // ==========================
    // TikTok Events API Payload
    // ==========================
    const payload = {
      event_source: 'web',
      event_source_id: pixelCode,
      test_event_code: test_event_code || undefined,
      data: [
        {
          event: event,
          event_time: Math.floor(Date.now() / 1000),
          context: {
            ad: {
              callback: ttclid || undefined,
            },
            page: {
              url: req.headers['referer'] || '',
              user_agent: req.headers['user-agent'] || '',
            },
          },
          properties: finalProps,
        },
      ],
    };

    const tiktokRes = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/event/track/',
      {
        method: 'POST',
        headers: {
          'Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await tiktokRes.json();

    return res
      .status(tiktokRes.ok ? 200 : 500)
      .json({ success: tiktokRes.ok, tiktok: data });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
