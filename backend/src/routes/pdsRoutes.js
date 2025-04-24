const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const pdsController = require("../controllers/pdsController");

console.log("PDS Controller Loaded:", pdsController);

// ✅ Define Routes
router.post("/add-product", verifyToken, pdsController.addProductToPDS);
router.post("/remove-product", verifyToken, pdsController.removeProductFromPDS); // ✅ New Route
router.get("/dashboard", verifyToken, pdsController.getPDSDashboard);

module.exports = router;
