const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

console.log("Admin Controller Loaded:", adminController); // ✅ Debugging

// ✅ Check if functions exist before using them
if (!adminController.getAdminDashboard) {
    console.error("❌ ERROR: getAdminDashboard function is missing in adminController!");
}

if (!adminController.getPDSDashboard) {
    console.error("❌ ERROR: getPDSDashboard function is missing in adminController!");
}

if (!adminController.getGodownDashboard) {
    console.error("❌ ERROR: getGodownDashboard function is missing in adminController!");
}


// ✅ Get Admin Dashboard (View All PDS & Godown Under Admin)
router.get("/dashboard", verifyToken, adminController.getAdminDashboard);

// ✅ Get Specific PDS Dashboard (Admin selects a PDS to view)
router.get("/pds-dashboard/:pdsId", verifyToken, adminController.getPDSDashboard);

// ✅ Get Specific Godown Dashboard (Admin selects a Godown to view)
router.get("/godown-dashboard/:godownId", verifyToken, adminController.getGodownDashboard);

module.exports = router;
