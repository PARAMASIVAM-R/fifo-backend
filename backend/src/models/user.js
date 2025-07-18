const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    role: { 
        type: String, 
        enum: ["Admin", "Godown Incharge", "PDS Incharge"], 
        required: true 
    },
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    district: { type: String, required: true },
    password: { type: String, required: true },
    godownId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Godown",
        required: function () { return this.role === "PDS Incharge"; } 
    },
    pdsLocation: {  // ✅ Renamed from "pdsname" to "pdsLocation" 
        type: String, 
        required: function () { return this.role === "PDS Incharge"; } 
    }
}, { timestamps: true });

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

module.exports = mongoose.model("User", userSchema);
