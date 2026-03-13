const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, currency, customerEmail } = req.body;

        if (!amount) {
            return res.status(400).json({
                success: false,
                message: "Amount is required"
            });
        }

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amount in subunits (cents/paise)
            currency: currency || "inr",
            receipt_email: customerEmail || undefined,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Broadcast real-time payment initialization event.
        if (req.io) {
            req.io.emit("payment_status", {
                paymentIntentId: paymentIntent.id,
                status: "created",
                amount,
                currency: currency || "inr",
                customerEmail: customerEmail || null,
                timestamp: new Date().toISOString(),
            });
        }

        res.status(200).json({
            success: true,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency
        });
    } catch (err) {
        console.error("Stripe Error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to create Stripe payment intent",
            error: err.message
        });
    }
};

exports.broadcastPaymentStatus = async (req, res) => {
    try {
        const { paymentIntentId, status, amount, currency, customerEmail, metadata } = req.body;

        if (!paymentIntentId || !status) {
            return res.status(400).json({
                success: false,
                message: "paymentIntentId and status are required",
            });
        }

        const payload = {
            paymentIntentId,
            status,
            amount: amount || null,
            currency: currency || "inr",
            customerEmail: customerEmail || null,
            metadata: metadata || {},
            timestamp: new Date().toISOString(),
        };

        if (req.io) {
            req.io.emit("payment_status", payload);
        }

        return res.status(200).json({ success: true, payload });
    } catch (err) {
        console.error("Payment status broadcast error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to broadcast payment status",
            error: err.message,
        });
    }
};
