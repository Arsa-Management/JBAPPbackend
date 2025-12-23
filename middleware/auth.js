const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    req.user = decoded;
    console.log(decoded)
    console.log(req.user)
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
