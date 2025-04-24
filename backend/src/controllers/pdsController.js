const PDS = require("../models/pdsModel");
const Godown = require("../models/godownModel");

// ✅ Add Product to PDS from Godown
exports.addProductToPDS = async (req, res) => {
    try {
        console.log("✅ Request received:", req.body);
        console.log("✅ Checking req.user:", req.user);

        const { productName, weight, count, date } = req.body;

        // Enhanced input validation
        if (!productName || !weight || !count || !date) {
            return res.status(400).json({ error: "All fields are required!" });
        }
        if (typeof productName !== 'string' || isNaN(weight) || isNaN(count) || isNaN(Date.parse(date))) {
            return res.status(400).json({ error: "Invalid input types!" });
        }
        if (weight <= 0 || count <= 0) {
            return res.status(400).json({ error: "Weight and count must be positive!" });
        }

        const pds = await PDS.findOne({ id: req.user.id }).populate("godownname");
        if (!pds) {
            return res.status(404).json({ error: "PDS not found!" });
        }

        if (!pds.godownname) {
            return res.status(400).json({ error: "PDS is not linked to any Godown!" });
        }

        const godown = await Godown.findOne({ godownname: pds.godownname });
        if (!godown) {
            return res.status(404).json({ error: "Linked Godown not found!" });
        }

        // Find stock in Godown
        const godownProduct = godown.products.find(p =>
            p.productName === productName && p.date.toISOString().split('T')[0] === date
        );

        if (!godownProduct || godownProduct.pendingCount < count) {
            return res.status(400).json({ error: "Insufficient stock in Godown!" });
        }

        // Use a transaction for atomicity
       

        try {
            // Deduct stock from Godown (specific batch only)
            godownProduct.pendingCount -= count;
          // Only deduct from the matching batch
            await godown.save({ });

            // Find all batches of the product in PDS
            const allProductBatches = pds.products.filter(p => p.productName === productName);
            const existingPDSProduct = pds.products.find(p =>
                p.productName === productName && p.date.toISOString().split('T')[0] === date
            );

            if (existingPDSProduct) {
                // If batch exists, increase both count and totalCount
                existingPDSProduct.count += count;
                existingPDSProduct.totalCount += count;
            } else {
                // If new batch, add it and calculate totalCount as sum of all batches
                const newTotalCount = count + allProductBatches.reduce((sum, batch) => sum + batch.count, 0);
                pds.products.push({
                    productName,
                    weight,
                    count,
                    totalCount: newTotalCount,
                    date: new Date(date)
                });

                // Update totalCount for all batches
                pds.products.forEach(batch => {
                    if (batch.productName === productName) {
                        batch.totalCount = newTotalCount;
                    }
                });
            }

            await pds.save({ });
          
            res.status(201).json({ message: "Product added to PDS successfully!", pds });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        }
    } catch (error) {
        console.error("❌ Error adding product to PDS:", error.message);
        res.status(500).json({ error: "Server error while adding product to PDS!", details: error.message });
    }
};

// ✅ Remove Product from PDS
exports.removeProductFromPDS = async (req, res) => {
    try {
        const { productName, date, count = 1 } = req.body;

        if (!productName || !date) {
            return res.status(400).json({ error: "Product name and date are required!" });
        }

        if (typeof productName !== 'string' || isNaN(Date.parse(date))) {
            return res.status(400).json({ error: "Invalid input types!" });
        }

        if (count <= 0) {
            return res.status(400).json({ error: "Count must be positive!" });
        }

        const pds = await PDS.findOne({ id: req.user.id });
        if (!pds) {
            return res.status(404).json({ error: "PDS not found!" });
        }

        // Find batch with exact productName + date
        const targetBatch = pds.products.find(p =>
            p.productName === productName &&
            p.date.toISOString().split('T')[0] === date
        );

        if (!targetBatch) {
            return res.status(400).json({ error: "Batch not found for given product and date!" });
        }

        // ✅ Only block if older batches with stock exist
        const olderBatches = pds.products.filter(p =>
            p.productName === productName &&
            new Date(p.date) < new Date(date) &&
            p.totalCount > 0
        );

        if (olderBatches.length > 0) {
            return res.status(400).json({ error: "There are older batches pending removal!" });
        }

        if (targetBatch.totalCount < count) {
            return res.status(400).json({ error: "Not enough stock in this batch!" });
        }

        targetBatch.totalCount -= count;

        if (targetBatch.totalCount === 0) {
            pds.products = pds.products.filter(p =>
                !(p.productName === productName && p.date.toISOString().split('T')[0] === date)
            );
        }

        await pds.save();

        return res.status(200).json({ message: "Stock reduced successfully!", pds });

    } catch (error) {
        console.error("❌ Error removing product from PDS:", error.message);
        return res.status(500).json({
            error: "Server error while removing product from PDS!",
            details: error.message
        });
    }
};



// ✅ Fetch PDS Dashboard
exports.getPDSDashboard = async (req, res) => {
    try {
        const pds = await PDS.findOne({ id: req.user.id }).populate("godownname");

        if (!pds) {
            return res.status(404).json({ error: "PDS not found!" });
        }

        res.status(200).json({
            pdsId: pds.pdslocation,
            pdsName: pds.name,
            district: pds.district,
            linkedGodown: pds.godownname,
            products: pds.products
        });

    } catch (error) {
        console.error("❌ Error fetching PDS dashboard:", error.message);
        res.status(500).json({ error: "Server error while fetching dashboard!", details: error.message });
    }
};