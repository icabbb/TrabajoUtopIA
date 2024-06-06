const axios = require('axios');

exports.getProfile = async (req, res) => {
  const accessToken = req.session.accessToken;

  if (!accessToken) {
    return res.status(401).send('Not authenticated');
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    res.render('profile', { user: response.data });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).send('Error getting profile');
  }
};
