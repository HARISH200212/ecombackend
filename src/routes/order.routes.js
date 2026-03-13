const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");

router.get("/", orderController.getAllOrders);
router.post("/", orderController.createOrder);
router.post("/send-confirmation", orderController.sendConfirmation);
router.put("/:id/status", orderController.updateOrderStatus);
router.get("/daily-summary", orderController.sendDailySummary);

module.exports = router;

