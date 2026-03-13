const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    originalPrice: { type: Number, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    onSale: { type: Boolean, default: false },
    saleEndDate: { type: Date },
    deliveryDays: { type: Number, default: 3 },
    category: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String },
    specs: { type: Map, of: String },
    features: [{ type: String }],
    stock: { type: Number, required: true, default: 1 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    colors: [{ type: String }],
    brand: { type: String },
    upcomingSale: { type: Boolean, default: false },
    saleStartDate: { type: Date },
    bankOffers: [{ type: String }],
    threeDModelUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
