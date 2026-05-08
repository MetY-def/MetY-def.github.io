const https = require('https');

function httpsPost(url, params) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST' }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(params);
    req.end();
  });
}

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

  // Parameter auslesen
  const params = event.queryStringParameters || {};
  const type = params.type || '';

  try {
    const tokenData = await httpsPost(
      `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
      ''
    );

    const headers = {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${tokenData.access_token}`
    };

    if (type === 'status') {
      // Stream-Status prüfen
      const streams = await httpsGet(
        'https://api.twitch.tv/helix/streams?user_login=einfach_mety&user_login=dj_fluffypaw_nya',
        headers
      );
      const result = {
        gaming: streams.data.find(s => s.user_login.toLowerCase() === 'einfach_mety') || null,
        musik: streams.data.find(s => s.user_login.toLowerCase() === 'dj_fluffypaw_nya') || null
      };
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result) };
    } else {
      // Clips abrufen – nach Datum sortiert
      const clips = await httpsGet(
        'https://api.twitch.tv/helix/clips?broadcaster_id=663021487&first=50',
        headers
      );
      // Neueste zuerst sortieren
      if (clips.data) {
        clips.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(clips) };
    }
  } catch (err) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
