const axios = require('axios');

exports.auth = (req, res) => {
    const authEndpoint = 'https://accounts.spotify.com/authorize';
    const clientID = process.env.SPOTIFY_CLIENT_ID;
    const redirectURI = process.env.SPOTIFY_REDIRECT_URI;
    const scope = 'user-read-private user-read-email user-library-read playlist-read-private playlist-modify-private';

    res.redirect(`${authEndpoint}?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&scope=${scope}`);

}

exports.callback = async (req, res) => {
    const code = req.query.code || null
    const clientID = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectURI = process.env.SPOTIFY_REDIRECT_URI;

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', null, {
            params : {
                code : code,
                client_id : clientID,
                client_secret : clientSecret,
                redirect_uri : redirectURI,
                grant_type : 'authorization_code'
            },
            headers : {
                'Content-Type' : 'application/x-www-form-urlencoded'
            }

        });
        const { access_token, expires_in, refresh_token, token_type } = response.data;
        res.render ('player', { access_token, expires_in, refresh_token, token_type });
    } catch (error) {
        console.log(error);
    }
}