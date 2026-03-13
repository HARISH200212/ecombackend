let cart = [];

exports.getCart = (req, res) => {
    res.json(cart);
};

exports.addToCart = (req, res) => {
    cart.push(req.body);
    res.json({ message: "Added to cart", cart });
};

exports.removeFromCart = (req, res) => {
    cart = cart.filter(item => item.id !== req.params.id);
    res.json({ message: "Removed from cart", cart });
};
