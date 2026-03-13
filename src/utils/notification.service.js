const { sendOrderConfirmation, sendStatusUpdateEmail } = require('./email.service');
const { sendOrderSms } = require('./sms.service');

/**
 * Consolidates all user notifications (Email, SMS simulation, etc.)
 */
const notifyOrderPlacement = async (user, order) => {
    console.log(`[Notification System] Processing notifications for Order #${order._id}...`);

    // 1. Send Email
    await sendOrderConfirmation(user, order);

    // 2. Send SMS
    await sendOrderSms(user, order);

    // 3. System Log
    console.log(`[Audit Log] Order confirmation sent to ${user.email} at ${new Date().toISOString()}`);
};

const notifyOrderStatusUpdate = async (user, order) => {
    console.log(`[Notification System] Processing status update notification for Order #${order.id || order._id}...`);
    
    // 1. Send Email
    await sendStatusUpdateEmail(user, order);
    
    // 2. System Log
    console.log(`[Audit Log] Status update sent to ${user.email} at ${new Date().toISOString()}`);
};

const notifyDailySummary = async (stats) => {
    console.log(`[Notification System] Processing daily summary notification...`);
    
    // 1. Send Email
    await sendDailySummaryEmail(stats);
    
    // 2. System Log
    console.log(`[Audit Log] Daily summary sent to administrator at ${new Date().toISOString()}`);
};

module.exports = { notifyOrderPlacement, notifyOrderStatusUpdate, notifyDailySummary };
