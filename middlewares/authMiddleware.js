module.exports = (req, res, next) => {
    if (req.session.accessToken) {
      return next();
    } else {
      res.status(401).send('Unauthorized');
    }
  };
  