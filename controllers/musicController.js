const axios = require('axios');
const querystring = require('querystring');

exports.auth = (req, res) => {
  const authEndpoint = 'https://accounts.spotify.com/authorize';
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const scopes = 'user-read-private user-read-email user-read-playback-state user-modify-playback-state';

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
