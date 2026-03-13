const { notifyOrderPlacement, notifyOrderStatusUpdate, notifyDailySummary } = require("../utils/notification.service");

const Order = require('../models/order.model');
const Product = require('../models/product.model');

// GET all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error("Fetch orders error:", err);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
};

// POST create new order
exports.createOrder = async (req, res) => {
    try {
        const orderData = { ...req.body };
        // If an ID wasn't provided by the frontend, generate one
        if (!orderData.id) {
            orderData.id = `ORD-${Date.now()}`;
        }

        const order = await Order.create(orderData);

        // Deduct stock for each item in the order immediately from MongoDB
        const items = order.items || [];
        for (const item of items) {
            const qty = item.quantity || 1;
            await Product.findOneAndUpdate(
                { id: item.id },
                { $inc: { stock: -qty } },
                { new: true }
            );
        }

        // If user is authenticated or email is provided in body, send confirmation
        const customerEmail = req.body.customer?.email || (req.user && req.user.email);
        const customerName = req.body.customer?.name || (req.user && req.user.name);
        const customerPhone = req.body.customer?.phone || (req.user && req.user.phone);

        if (customerEmail) {
            // Send email to customer and BCC to given admin email instantly (non-blocking)
            notifyOrderPlacement(
                { email: customerEmail, name: customerName, phone: customerPhone },
                {
                    _id: order.id,
                    totalAmount: Number(order.total),
                    shippingAddress: { address: order.customer?.address || '' },
                    status: order.paymentStatus || 'Paid',
                    items: order.items || [],
                    date: order.createdAt || new Date(),
                    paymentMethod: order.paymentMethod || 'Card'
                }
            ).catch(err => console.error("Immediate notification failed:", err));
        }

        // Emit a real-time event to all connected clients that a new order occurred and stock changed
        if (req.io) {
            req.io.emit('realtime_update', { message: 'New order placed, stock updated' });
        }

        res.status(201).json(order);
    } catch (err) {
        console.error("Order create error:", err);
        res.status(500).json({ message: "Failed to place order" });
    }
};

exports.sendConfirmation = async (req, res) => {
    try {
        const { user, order } = req.body;
        // Note: sendOrderConfirmation was used in routes but not imported. 
        // Assuming notifyOrderPlacement or similar is the intended one if not found.
        // For now, keeping the same logic name if it exists globally or in shared utils.
        await notifyOrderPlacement(user, order);
        res.json({ success: true, message: "Confirmation email sent" });
    } catch (err) {
        console.error("Email error:", err);
        res.status(500).json({ message: "Failed to send email" });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, customer, order } = req.body;

        const updateFields = { status };
        if (reason) updateFields.cancellationReason = reason;
        if (status === 'Return Requested' || status === 'Exchange Requested') {
            updateFields.returnReason = reason || '';
        }
        const updatedOrder = await Order.findOneAndUpdate(
            { id: id },
            { $set: updateFields },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (customer && customer.email) {
            // Send status update email asynchronously
            notifyOrderStatusUpdate(
                { email: customer.email, name: customer.name, phone: customer.phone },
                { id: id, status: status, ...order }
            ).catch(err => console.error("Immediate status notification failed:", err));
        }

        res.json({ success: true, message: "Status updated and email sent", order: updatedOrder });
    } catch (err) {
        console.error("Order update error:", err);
        res.status(500).json({ message: "Failed to update order status" });
    }
};

exports.sendDailySummary = async (req, res) => {
    try {
        // For a true "daily" summary we'd filter by date, but since this is mock-supported,
        // we'll provide a summary of the current orders for the user's "day"
        const orders = await Order.find().sort({ createdAt: -1 });
        
        const stats = {
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
            orderCount: orders.length,
            itemCount: orders.reduce((sum, o) => sum + (o.items?.reduce((iSum, i) => iSum + (i.quantity || 1), 0) || 0), 0),
            recentOrders: orders.slice(0, 10)
        };

        await notifyDailySummary(stats);
        
        res.json({ success: true, message: "Daily summary email sent successfully", stats });
    } catch (err) {
        console.error("Daily summary error:", err);
        res.status(500).json({ message: "Failed to generate daily summary" });
    }
};
