const axios = require('axios');
const querystring = require('querystring');

exports.auth = (req, res) => {
  const authEndpoint = 'https://accounts.spotify.com/authorize';
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const scopes = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state user-top-read streaming';

  res.redirect(`${authEndpoint}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}`);
};

exports.callback = async (req, res) => {
  const code = req.query.code || null;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;
    req.session.accessToken = access_token;
    req.session.refreshToken = refresh_token;
    req.session.expiresIn = expires_in;

    console.log('Tokens stored in session:', req.session);

    // Redirigir al cliente sin el token en la URL
    res.redirect('/');
  } catch (error) {
    console.error('Error getting tokens:', error.response ? error.response.data : error.message);
    res.sendStatus(500);
  }
};


exports.search = async (req, res) => {
  const { query } = req.query;
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        q: query,
        type: 'track'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error searching tracks:', error);
    res.status(500).send('Error searching tracks');
  }
};

exports.playTrack = async (req, res) => {
  const { uri } = req.body;
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.status(401).send('Not authenticated');
  }

  try {
    await axios.put('https://api.spotify.com/v1/me/player/play', {
      uris: [uri]
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    res.sendStatus(204);
  } catch (error) {
    console.error('Error playing track:', error);
    res.status(500).send('Error playing track');
  }
};

exports.getTopArtists = async (req, res) => {
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        limit: 5
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error getting top artists:', error);
    res.status(500).send('Error getting top artists');
  }
};

exports.getTopSongs = async (req, res) => {
  const { artistId } = req.query;
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        country: 'US'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error getting top songs:', error);
    res.status(500).send('Error getting top songs');
  }
};

// Añadir las funciones nextTrack y previousTrack al controlador

async function makeRequestWithRetry(url, method, headers, data, retries = 5, delay = 1000) {
  try {
    const response = await axios({ url, method, headers, data });
    return response;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      console.warn(`Rate limit exceeded. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
      return makeRequestWithRetry(url, method, headers, data, retries - 1, delay * 2);
    } else {
      throw error;
    }
  }
}

exports.nextTrack = async (req, res) => {
  const accessToken = req.session.accessToken;
  const deviceId = req.query.deviceId;

  if (!accessToken) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const response = await makeRequestWithRetry(`https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`, 'POST', {
      'Authorization': `Bearer ${accessToken}`
    }, {});
    res.sendStatus(204);
  } catch (error) {
    console.error('Error skipping to next track:', error);
    res.status(500).send('Error skipping to next track');
  }
};

exports.previousTrack = async (req, res) => {
  const accessToken = req.session.accessToken;
  const deviceId = req.query.deviceId;

  if (!accessToken) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const response = await makeRequestWithRetry(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, 'POST', {
      'Authorization': `Bearer ${accessToken}`
    }, {});
    res.sendStatus(204);
  } catch (error) {
    console.error('Error skipping to previous track:', error);
    res.status(500).send('Error skipping to previous track');
  }
};
