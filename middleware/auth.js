const jwt = require("jsonwebtoken");

const auth = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "SECRET_KEY"
      );

      // 🔁 normalize user id
      const userId = decoded.id || decoded.userId || decoded._id;

      req.user = {
        id: userId,
        role: decoded.role,
      };

      // 🔒 role check
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (err) {
      console.error("❌ TOKEN ERROR:", err.message);
      res.status(401).json({ message: "Invalid token" });
    }
  };
};

module.exports = auth;
