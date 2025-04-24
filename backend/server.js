const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config(); // load .env variables

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("✅ MongoDB Connected!"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));

app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/godown", require("./src/routes/godownRoutes"));
app.use("/api/pds", require("./src/routes/pdsRoutes"));
app.use("/api/admin", require("./src/routes/adminRoutes"));

app.listen(5000, () => console.log("✅ Server running on port 5000"));
