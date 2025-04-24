const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const godownController = require("../controllers/godownController");

console.log("Godown Controller:", godownController);

// ✅ Apply `verifyToken` to ensure the logged-in user is authenticated
router.post("/add-product", verifyToken, godownController.addProductToGodown);
router.post("/clear-stock", verifyToken, godownController.clearStock);
router.post("/send-to-pds", verifyToken, godownController.sendStockToPDS);
router.get("/dashboard", verifyToken, godownController.getGodownDashboard);

module.exports = router;
