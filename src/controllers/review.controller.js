const Review = require('../models/review.model');
const Product = require('../models/product.model');

// POST write a review
exports.createReview = async (req, res) => {
    try {
        const { rating, comment, user } = req.body;
        const productId = parseInt(req.params.productId);

        const newReview = await Review.create({
            product: productId,
            user: user || 'Guest',
            rating: Number(rating),
            comment
        });

        // Update product rating and numReviews
        const reviews = await Review.find({ product: productId });
        const numReviews = reviews.length;
        const averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / numReviews;

        await Product.findOneAndUpdate(
            { id: productId },
            {
                rating: averageRating.toFixed(1),
                numReviews
            }
        );

        res.status(201).json(newReview);
    } catch (err) {
        console.error("Create review error:", err);
        res.status(500).json({ message: "Failed to create review" });
    }
};

// GET all reviews for a product
exports.getProductReviews = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error("Fetch reviews error:", err);
        res.status(500).json({ message: "Failed to fetch reviews" });
    }
};
