const PDS = require("../models/pdsModel");
const Godown = require("../models/godownModel");

// ✅ Add Product to PDS from Godown
exports.addProductToPDS = async (req, res) => {
    try {
        console.log("✅ Request received:", req.body);
        console.log("✅ Checking req.user:", req.user);

        const { productName, weight, count, date } = req.body;

        if (!productName || !weight || !count || !date) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        let pds = await PDS.findOne({ id: req.user.id }).populate("godownname");
        if (!pds) {
            return res.status(404).json({ error: "PDS not found!" });
        }

        if (!pds.godownname) {
            return res.status(400).json({ error: "PDS is not linked to any Godown!" });
        }

        let godown = await Godown.findById(pds.godownname);
        if (!godown) {
            return res.status(404).json({ error: "Linked Godown not found!" });
        }

        // ✅ Find stock in Godown
        let godownProduct = godown.products.find(p =>
            p.productName === productName && p.date.toISOString().split('T')[0] === date
        );

        if (!godownProduct || godownProduct.pendingCount < count) {
            return res.status(400).json({ error: "Insufficient stock in Godown!" });
        }

        // ✅ Deduct stock from Godown
        godownProduct.pendingCount-= count;
        godown.products.forEach(batch => {
            if (batch.productName === productName) {
                batch.totalCount -= count;
            }
        });
        await godown.save();
       
        // ✅ Find all batches of the product in PDS
        let allProductBatches = pds.products.filter(p => p.productName === productName);

        // ✅ Find existing batch
        let existingPDSProduct = pds.products.find(p =>
            p.productName === productName && p.date.toISOString().split('T')[0] === date
        );

        if (existingPDSProduct) {
            // ✅ If batch exists, increase both Count & totalCount
            existingPDSProduct.Count += count;
            existingPDSProduct.totalCount += count;
        } else {
            // ✅ If new batch, add it & increase totalCount across all batches
            let newTotalCount = count + allProductBatches.reduce((sum, batch) => sum + batch.Count, 0);
            pds.products.push({
                productName,
                weight,
                Count: count,
                totalCount: newTotalCount, // ✅ New totalCount
                date
            });

            // ✅ Update totalCount for all batches
            pds.products.forEach(batch => {
                if (batch.productName === productName) {
                    batch.totalCount = newTotalCount;
                }
            });
        }

        await pds.save();
        res.status(201).json({ message: "Product added to PDS successfully!", pds });

    } catch (error) {
        console.error("❌ Error adding product to PDS:", error);
        res.status(500).json({ error: "Server error while adding product to PDS!" });
    }
};

// ✅ Remove Product from PDS
exports.removeProductFromPDS = async (req, res) => {
    try {
        const { productName, date } = req.body;

        if (!productName || !date) {
            return res.status(400).json({ error: "Product name and date are required!" });
        }

        let pds = await PDS.findOne({ id: req.user.id });

        if (!pds) {
            return res.status(404).json({ error: "PDS not found!" });
        }

        // ✅ Find all batches of the product
        let productBatches = pds.products.filter(p => p.productName === productName);
        if (productBatches.length === 0) {
            return res.status(400).json({ error: `No stock available for product: ${productName}` });
        }

        // ✅ Sort to find the oldest batch
        let oldestBatch = productBatches.sort((a, b) => new Date(a.date) - new Date(b.date))[0];

        if (oldestBatch.date.toISOString().split('T')[0] !== date) {
            return res.status(400).json({ error: "There are older batches pending removal!" });
        }

        // ✅ Reduce count of the oldest batch
        if (oldestBatch.Count > 0) {
            oldestBatch.Count -= 1;
        } else {
            return res.status(400).json({ error: "No available stock to remove!" });
        }

        // ✅ Sync totalCount across batches
        let maxTotalCount = Math.max(...productBatches.map(batch => batch.Count), 0);
        pds.products.forEach(batch => {
            if (batch.productName === productName) {
                batch.totalCount = maxTotalCount;
            }
        });

        // ✅ Remove batch if Count is 0
        if (oldestBatch.Count === 0) {
            pds.products = pds.products.filter(p => !(p.productName === productName && p.date.toISOString().split('T')[0] === date));
        }

        await pds.save();
        res.status(200).json({ message: "Product removed successfully!", pds });

    } catch (error) {
        console.error("❌ Error removing product from PDS:", error);
        res.status(500).json({ error: "Server error while removing product from PDS!" });
    }
};

// ✅ Fetch PDS Dashboard
exports.getPDSDashboard = async (req, res) => {
    try {
        let pds = await PDS.findOne({ id: req.user.id }).populate("godownId");

        if (!pds) {
            return res.status(404).json({ error: "PDS not found!" });
        }

        res.status(200).json({
            pdsId: pds._id,
            pdsName: pds.name,
            district: pds.district,
            linkedGodown: pds.godownId ? pds.godownId.godownname : "Not Linked",
            products: pds.products
        });

    } catch (error) {
        console.error("❌ Error fetching PDS dashboard:", error);
        res.status(500).json({ error: "Server error while fetching dashboard!" });
    }
};
