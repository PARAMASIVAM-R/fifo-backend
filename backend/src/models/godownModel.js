const mongoose = require("mongoose");

const godownSchema = new mongoose.Schema({
    role: { type: String, default: "Godown Incharge" },
    id: { type: String, required: true, unique: true }, 
    name: { type: String, required: true },
    district: { type: String, required: true },
    godownname: { type: String, required: true },
    password: { type: String, required: true },
    products: [
        {
            productName: { type: String, required: true },
            weight: { type: Number, required: true },
            goodsInCount: { type: Number, default: 0 },
            goodsOutCount: { type: Number, default: 0 },
            totalCount: { type: Number, default: 0 },  
            pendingCount: { type: Number, default: 0 },  // ✅ Tracks pending stock
            pdsId: { type: String, default: null },
            date: { type: Date, required: true }
        }
    ]
});

module.exports = mongoose.model("Godown", godownSchema);
