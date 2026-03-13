const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: Number, // Since product uses Number for 'id'
        required: true,
        ref: 'Product'
    },
    user: {
        type: String, // Keeping it simple for now as guest reviews are allowed, or can link to User model
        required: true,
        default: 'Guest'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
