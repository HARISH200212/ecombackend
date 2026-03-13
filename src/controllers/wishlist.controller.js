let wishlist = [];

exports.getWishlist = (req, res) => {
    res.json(wishlist);
};

exports.addToWishlist = (req, res) => {
    wishlist.push(req.body);
    res.json({ message: "Added to wishlist", wishlist });
};

exports.removeFromWishlist = (req, res) => {
    wishlist = wishlist.filter(item => item.id !== req.params.id);
    res.json({ message: "Removed from wishlist", wishlist });
};
