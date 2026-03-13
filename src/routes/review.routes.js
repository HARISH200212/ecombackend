const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');

// Mount on /api/reviews
router.post('/:productId', reviewController.createReview);
router.get('/:productId', reviewController.getProductReviews);

module.exports = router;
