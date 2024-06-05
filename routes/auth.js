const express = require('express');
const router = express.Router();
const musicController = require('../controllers/musicController');

router.get('/login', (req, res) => {
  res.render('login'); // Renderiza la vista del login
});
router.get('/auth/login', musicController.auth);
router.get('/auth/callback', musicController.callback);

module.exports = router;
