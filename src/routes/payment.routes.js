const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripe.controller");

router.post("/stripe/create-payment-intent", stripeController.createPaymentIntent);
router.post("/stripe/status-update", stripeController.broadcastPaymentStatus);

module.exports = router;
