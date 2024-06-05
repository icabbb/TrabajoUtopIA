const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/search', authMiddleware, musicController.search);
router.post('/play', authMiddleware, musicController.playTrack);

module.exports = router;
