const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const musicRoutes = require('./routes/musicRoutes');
const app = express();

require('dotenv').config();

app.use(bodyParser.json());
app.use(cors());

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Debe ser true si usas HTTPS
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// Middleware para loguear la sesión
app.use((req, res, next) => {
  console.log('Session:', req.session);
  next();
});

// Ruta para inspeccionar la sesión
app.get('/session-info', (req, res) => {
  res.json(req.session);
});

app.use('/', authRoutes);
app.use('/music', require('./middlewares/authMiddleware'), musicRoutes);

app.get('/', (req, res) => {
  if (req.session.accessToken) {
    res.render('player'); // Renderiza tu vista principal si está autenticado
  } else {
    res.redirect('/login'); // Redirige a la página de login si no está autenticado
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
