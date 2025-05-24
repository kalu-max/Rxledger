const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Token missing');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // { id, role }
    next();
  } catch {
    res.status(401).send('Invalid token');
  }
}

module.exports = verifyToken;