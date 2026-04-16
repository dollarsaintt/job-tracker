const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Get token from request header
    const token = req.headers.authorization?.split(' ')[1];

    // If no token, deny access
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request
    req.user = decoded;

    // Move on to the next function
    next();

  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};