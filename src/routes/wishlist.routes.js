const express = require("express");
const router = express.Router();

const wishlistController = require("../controllers/wishlist.controller");

router.get("/", wishlistController.getWishlist);
router.post("/", wishlistController.addToWishlist);
router.delete("/:id", wishlistController.removeFromWishlist);

module.exports = router;
