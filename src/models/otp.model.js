const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    // TTL Index: This document will automatically be deleted from MongoDB 5 minutes after creation
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // 5 minutes in seconds
    }
});

module.exports = mongoose.model("Otp", otpSchema);
