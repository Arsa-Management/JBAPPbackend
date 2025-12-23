const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY");

    console.log("✅ DECODED TOKEN:", decoded);

    req.user = decoded; // { userId, role, iat, exp }
    next();
  } catch (err) {
    console.error("❌ TOKEN ERROR:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};
