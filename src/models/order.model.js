const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    date: { type: Date },
    customer: {
        name: { type: String, required: true },
        email: { type: String },
        address: { type: String }
    },
    items: [{
        id: { type: Number },
        productId: { type: mongoose.Schema.Types.Mixed },
        name: { type: String },
        price: { type: Number },
        quantity: { type: Number, default: 1 },
        image: { type: String }
    }],
    total: { type: Number, required: true },
    totalAmount: { type: Number },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, default: 'Pending' },
    status: { type: String, default: 'Pending' },
    transactionId: { type: String },
    invoiceNumber: { type: String },
    invoiceGeneratedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
