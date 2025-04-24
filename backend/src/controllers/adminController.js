const mongoose = require("mongoose");
const Admin = require("../models/admin");
const PDSIncharge = require("../models/pdsModel");
const GodownIncharge = require("../models/godownModel");

console.log("Admin Controller Loaded");

// ✅ Get Admin Dashboard
exports.getAdminDashboard = async (req, res) => {
    try {
        const admin = await Admin.findOne({ id: req.user.id });
        if (!admin) return res.status(404).json({ message: "Admin not found" });

        const pdsLocations = await PDSIncharge.find({ district: admin.district }).select("id pdslocation name");
        const godowns = await GodownIncharge.find({ district: admin.district }).select("id godownname name");

        res.json({ admin, pdsLocations, godowns });
    } catch (err) {
        console.error("❌ ERROR fetching Admin dashboard:", err);
        res.status(500).json({ error: err.message });
    }
};

// ✅ Get Specific PDS Dashboard
exports.getPDSDashboard = async (req, res) => {
    try {
        const { pdsId } = req.params;  // 📌 Get PDS ID from request params
        console.log("📌 Requested PDS ID:", pdsId);

        let pds;
        if (mongoose.Types.ObjectId.isValid(pdsId)) {
            pds = await PDSIncharge.findById(pdsId);
        } else {
            pds = await PDSIncharge.findOne({ id: pdsId });
        }

        if (!pds) {
            console.error(`❌ ERROR: PDS with ID '${pdsId}' not found!`);
            return res.status(404).json({ error: "PDS not found!" });
        }

        console.log("✅ PDS Data Found:", pds);
        res.status(200).json({ pds });

    } catch (err) {
        console.error("❌ ERROR fetching PDS dashboard:", err);
        res.status(500).json({ error: "Error fetching PDS dashboard!", details: err.message });
    }
};

// ✅ Get Specific Godown Dashboard
exports.getGodownDashboard = async (req, res) => {
    try {
        const { godownId } = req.params;  // 📌 Get Godown ID from request params
        console.log("📌 Requested Godown ID:", godownId);

        let godown;
        if (mongoose.Types.ObjectId.isValid(godownId)) {
            godown = await GodownIncharge.findById(godownId);
        } else {
            godown = await GodownIncharge.findOne({ id: godownId });
        }
        if (!godown) {
            console.error(`❌ ERROR: Godown with ID '${godownId}' not found!`);
            return res.status(404).json({ error: "Godown not found!" });
        }

        console.log("✅ Godown Data Found:", godown);
        res.status(200).json({ godown });
    } catch (err) {
        console.error("❌ ERROR fetching Godown dashboard:", err);
        res.status(500).json({ error: "Error fetching Godown dashboard!", details: err.message });
    }
};
