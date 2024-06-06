// _tests_/authController.test.js
const authController = require('../controllers/musicController');
const httpMocks = require('node-mocks-http');
const axios = require('axios');

jest.mock('axios');
require('dotenv').config();

test('should redirect to Spotify authorization URL', () => {
  const req = httpMocks.createRequest();
  const res = httpMocks.createResponse();
  authController.auth(req, res);

  const redirectUrl = res._getRedirectUrl();
  expect(redirectUrl).toContain('https://accounts.spotify.com/authorize');
  expect(redirectUrl).toContain(`client_id=${process.env.SPOTIFY_CLIENT_ID}`);
  expect(redirectUrl).toContain(`redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}`);
});

test('should play a track', async () => {
  const req = httpMocks.createRequest({
    method: 'POST',
    url: '/playTrack',
    body: {
      uri: 'spotify:track:track_id'
    },
    session: {
      accessToken: 'access_token_value'
    }
  });
  const res = httpMocks.createResponse();

  axios.put.mockResolvedValue({});

  await authController.playTrack(req, res);

  expect(res.statusCode).toBe(204);
});

test('obtener los artistas', async () => {
  const req = httpMocks.createRequest({
    method: 'GET',
    url: '/getTopSongs',
    query: {
      artistId: 'artist_id'
    },
    session: {
      accessToken: 'access_token_value'
    }
  });
  const res = httpMocks.createResponse();

  axios.get.mockResolvedValue({
    data: {
      tracks: [
        { name: 'song_name' }
      ]
    }
  });

  await authController.getTopSongs(req, res);

  expect(res.statusCode).toBe(200);
  const data = res._getJSONData();
  expect(data.tracks.length).toBe(1);
  expect(data.tracks[0].name).toBe('song_name');
});