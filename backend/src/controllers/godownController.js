const Godown = require("../models/godownModel");
const Product = require("../models/productModel");



exports.addProductToGodown = async (req, res) => {
    try {
        console.log("✅ Request received:", req.body);
        console.log("✅ Checking req.user:", req.user);

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized! User data missing." });
        }

        const { productName, weight, goodsInCount, date } = req.body;

        if (!productName || !weight || !goodsInCount || !date) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        // ✅ Find the logged-in Godown Incharge
        let godown = await Godown.findOne({ id: req.user.id });

        if (!godown) {
            return res.status(404).json({ error: "Godown not found!" });
        }

        // ✅ Find all batches of the same product
        let allProductBatches = godown.products.filter(p => p.productName === productName);

        // ✅ Calculate new totalCount for this product
        let totalCount = goodsInCount;
     
        // ✅ Add new batch OR update existing batch (if received on same date)
        let existingBatch = allProductBatches.find(p => p.date.toISOString().split('T')[0] === date);

        if (existingBatch) {
            existingBatch.goodsInCount += goodsInCount;
            existingBatch.totalCount+= goodsInCount;
        } else {
            godown.products.push({
                productName,
                weight,
                goodsInCount,
                goodsOutCount: 0,
                totalCount,
                pendingCount: 0,
                date: new Date(date) // Ensure correct date format
            });
        }

        // ✅ Update `totalCount` for all batches of this product
    
        

        await godown.save();
        res.status(201).json({ message: "Product added successfully!", godown });

    } catch (error) {
        console.error("❌ Error adding product:", error);
        res.status(500).json({ error: "Server error while adding product!" });
    }
};
// ✅ Send Stock to PDS
exports.sendStockToPDS = async (req, res) => {
    try {
        console.log("✅ SendStockToPDS Request:", req.body);
        console.log("✅ Checking req.user:", req.user);

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized! User data missing." });
        }

        const { productName, weight, goodsOutCount, date, pdsId } = req.body;

        if (!productName || !weight || !date || !pdsId) {
            return res.status(400).json({ error: "Product name, weight, date, and PDS ID are required!" });
        }

        // ✅ Find the Godown
        let godown = await Godown.findOne({ id: req.user.id });
        if (!godown) {
            return res.status(404).json({ error: "Godown not found!" });
        }
        let allProductBatches = godown.products.filter(p => p.productName === productName);
        // ✅ Find all batches of the same product
        let productBatches = godown.products.filter(p => p.productName === productName);
        if (productBatches.length === 0) {
            return res.status(400).json({ error: `No stock available for product: ${productName}` });
        }

        // ✅ Get the highest totalCount from all batches
        let existingBatch = productBatches.find(p =>
            p.productName === productName &&
            p.date.toISOString().split('T')[0] === date &&
            p.pdsId === pdsId // this is always true — it's your current PDS
          );
          

        if (existingBatch) {
            existingBatch.goodsOutCount += goodsOutCount;
            existingBatch.totalCount+= goodsOutCount;
        } else {

        // ✅ Always push a new entry for sent stock
        godown.products.push({
            productName,
            weight,
            goodsOutCount,
            date,
            totalCount :goodsOutCount,
            goodsInCount: 0,
            pdsId
          });}

        // ✅ Update totalCount for all batches of this product to the max total count
      
        // ✅ Save the updated Godown
        await godown.save();

        res.status(201).json({ message: "Stock clearance recorded successfully!", godown });

    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: "Server error while clearing stock!" });
    }
};

// ✅ Clear Stock (Moves Stock to Pending)
exports.clearStock = async (req, res) => {
    try {
        console.log("✅ ClearStock Request:", req.body);
        console.log("✅ Checking req.user:", req.user);

        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized! User data missing." });
        }

        const { productName, date } = req.body;

        if (!productName || !date) {
            return res.status(400).json({ error: "Product name and date are required!" });
        }

        // ✅ Find the godown for the logged-in user
        let godown = await Godown.findOne({ id: req.user.id });
        if (!godown) {
            return res.status(404).json({ error: "Godown not found!" });
        }

        // ✅ Find the **oldest batch** of the product
        let productBatches = godown.products
            .filter(p => p.productName === productName)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // ✅ Find the first non-empty batch
        let usableBatch = productBatches.find(batch => batch.goodsInCount > 0);

        if (!usableBatch) {
            return res.status(400).json({ error: "No available stock to clear!" });
        }

        // ✅ Check if the usable batch is the one user selected
        const usableBatchDate = usableBatch.date.toISOString().split('T')[0];
        if (usableBatchDate !== date) {
            return res.status(400).json({ error: "Older batches exist! Clear them first." });
        }

        // ✅ Reduce goodsInCount and increase pendingCount
        usableBatch.goodsInCount -= 1;
        usableBatch.pendingCount = (usableBatch.pendingCount || 0) + 1;


        // ✅ Save updated godown data
        await godown.save();
        res.status(200).json({ message: "Stock moved to pending successfully!", godown });

    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: "Server error while clearing stock!" });
    }
};
// ✅ Get Godown Dashboard
exports.getGodownDashboard = async (req, res) => {
    try {
        console.log("✅ Checking req.user:", req.user); // Debugging

        // ✅ Find godown by logged-in user ID
        let godown = await Godown.findOne({ id: req.user.id });

        if (!godown) {
            return res.status(404).json({ error: "Godown not found!" });
        }

        // ✅ Debugging: Log the fetched godown and products
        console.log("✅ Found Godown:", godown);
        console.log("✅ Products in Godown:", godown.products);

        res.status(200).json({
            id: godown.id,
            godownName: godown.godownname,
            InchargeName:godown.name,
            district: godown.district,
            products: godown.products.length > 0 ? godown.products : "No products available"
        });

    } catch (error) {
        console.error("❌ Server Error:", error);
        res.status(500).json({ error: "Server error while fetching dashboard!" });
    }
};
