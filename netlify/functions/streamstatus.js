
const https = require('https');

function httpsPost(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'POST' }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write('');
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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

  try {
    const tokenData = await httpsPost(
      `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`
    );

    const headers = {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${tokenData.access_token}`
    };

    // Beide Kanäle prüfen
    const streams = await httpsGet(
      'https://api.twitch.tv/helix/streams?user_login=einfach_mety&user_login=dj_fluffypaw_nya',
      headers
    );

    const result = {
      gaming: streams.data.find(s => s.user_login.toLowerCase() === 'einfach_mety') || null,
      musik: streams.data.find(s => s.user_login.toLowerCase() === 'dj_fluffypaw_nya') || null
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify(result)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
