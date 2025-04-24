const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    role: { type: String, default: "Admin" },
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    district: { type: String, required: true },
    password: { type: String, required: true }
});

module.exports = mongoose.model("Admin", adminSchema);
