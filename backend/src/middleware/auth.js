const jwt = require("jsonwebtoken");

function readToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.split(" ")[1];
}

// Must be logged in.
function protect(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ message: "Please log in first" });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Login is optional: guests pass through with req.user undefined.
function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      req.user = undefined;
    }
  }
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only the owner can do this" });
  }
  next();
}

module.exports = { protect, optionalAuth, adminOnly };
