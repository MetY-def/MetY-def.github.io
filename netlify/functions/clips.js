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

exports.handler = async () => {
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

  try {
    // Token holen
    const tokenData = await httpsPost(
      `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`,
      ''
    );

    // Clips abrufen
    const clips = await httpsGet(
      'https://api.twitch.tv/helix/clips?broadcaster_id=663021487&first=50',
      {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    );

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(clips)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
