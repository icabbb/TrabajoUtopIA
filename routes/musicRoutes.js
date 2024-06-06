const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/top-artists', authMiddleware, musicController.getTopArtists);
router.get('/top-songs', authMiddleware, musicController.getTopSongs);
router.post('/playTrack', authMiddleware,  musicController.playTrack); // Asegúrate de que esta línea esté presente
//router.post('/nextTrack', authMiddleware, musicController.nextTrack);
router.post('/previousTrack' , authMiddleware, musicController.previousTrack);

module.exports = router;
