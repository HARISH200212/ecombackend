const twilio = require('twilio');

const sendOrderSms = async (user, order) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Skip if credentials are not configured or are placeholders
    if (!accountSid || !accountSid.startsWith('AC') || !authToken) {
        console.warn('[Twilio Service] SMS skipped: Missing or invalid credentials (SID must start with AC)');
        return;
    }

    try {
        const client = twilio(accountSid, authToken);
        const message = `Hi ${user.name}, your order #${order._id.toString().slice(-6)} is confirmed! Total: $${order.totalAmount}. Delivery in 3-5 days. View details: ${process.env.CLIENT_URL}/orders`;

        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: user.phone || '+1234567890' // Fallback for testing if user phone is missing
        });

        console.log(`Order confirmation SMS sent to ${user.phone}`);
    } catch (error) {
        console.error('Error sending order confirmation SMS:', error);
    }
};

module.exports = { sendOrderSms };
