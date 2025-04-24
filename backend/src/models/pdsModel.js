const mongoose = require("mongoose");

const pdsSchema = new mongoose.Schema({
    role: { type: String, default: "PDS Incharge" },
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    district: { type: String, required: true },
    password: { type: String, required: true },
    pdslocation: { type: String, required: true },
    godownname: { type: String, required: true },
    products: [{
        productName: String,
        weight: Number,
        Count: Number,
        totalCount: Number, // ✅ Add totalCount to track total stock across batches
        date: Date
    }]
}, { timestamps: true });

module.exports = mongoose.model("PDS", pdsSchema);
