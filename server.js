const express = require('express');
const cors = require('cors');
const spotifyRoutes = require('./routes/musicRoute');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use('/', spotifyRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
