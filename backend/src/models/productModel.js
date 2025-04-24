const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    weight: { type: Number, required: true },
    goodsInCount: { type: Number, default: 0 },
    goodsOutCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    date: { type: Date, required: true },
    pdsId: { type: mongoose.Schema.Types.ObjectId, ref: "PDS", default: null }
});

module.exports = mongoose.model("Product", productSchema);
