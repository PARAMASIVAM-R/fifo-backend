const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("❌ Token missing!");
        return res.status(401).json({ error: "Unauthorized! Token missing." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // ✅ Set user data
        console.log("✅ User authenticated:", req.user);  // Debugging line
        next();
    } catch (error) {
        console.log("❌ Token verification failed:", error);
        return res.status(403).json({ error: "Unauthorized! Invalid token." });
    }
};
