const mongoose = require("mongoose");

const PassphraseSchema = new mongoose.Schema({
    passphrase: { type: String, required: true },
    status: { type: Number, default: 0 }, // Default status as 0
    timestamp: { type: Date, default: Date.now },
});


module.exports = mongoose.model("Passphrase", PassphraseSchema);
