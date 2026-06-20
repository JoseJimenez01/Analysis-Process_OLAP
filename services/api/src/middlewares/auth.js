const jwt = require("jsonwebtoken");
const env = require("../config/env");

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Token is required" });
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = auth;
