const Product = require('../models/product.model');

// GET all products
exports.getAllProducts = async (req, res) => {
    try {
        const filter = {};
        if (req.query.brand) {
            filter.brand = req.query.brand;
        }

        const products = await Product.find(filter).sort({ id: 1 });
        res.json(products);
    } catch (err) {
        console.error("Fetch products error:", err);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

// GET product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ id: parseInt(req.params.id) });
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (err) {
        console.error("Fetch product by ID error:", err);
        res.status(500).json({ message: "Failed to fetch product" });
    }
};

// POST create new product
exports.createProduct = async (req, res) => {
    try {
        // Auto-increment ID if not provided
        let newId = req.body.id;
        if (!newId) {
            const highestProduct = await Product.findOne().sort('-id');
            newId = highestProduct ? highestProduct.id + 1 : 1;
        }

        const newProduct = await Product.create({ ...req.body, id: newId });

        if (req.io) {
            req.io.emit('realtime_update', { message: 'New product added' });
            req.io.emit('new_product_push', {
                title: 'New Arrival!',
                message: `Check out our new ${newProduct.name}`,
                productId: newProduct.id,
                image: newProduct.image
            });
        }

        res.status(201).json(newProduct);
    } catch (err) {
        console.error("Create product error:", err);
        res.status(500).json({ message: "Failed to create product" });
    }
};

// PUT update product
exports.updateProduct = async (req, res) => {
    try {
        const updatedProduct = await Product.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            req.body,
            { new: true }
        );
        if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

        if (req.io) {
            req.io.emit('realtime_update', { message: 'Product updated' });
            
            // If the admin just put this product on a massive sale, notify everyone
            if (req.body.onSale && req.body.discount >= 50) {
                req.io.emit('promo_push', {
                    title: 'Huge Sale!',
                    message: `${updatedProduct.name} is now ${req.body.discount}% OFF!`,
                    productId: updatedProduct.id,
                    image: updatedProduct.image
                });
            }
        }

        res.json(updatedProduct);
    } catch (err) {
        console.error("Update product error:", err);
        res.status(500).json({ message: "Failed to update product" });
    }
};

// DELETE product
exports.deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findOneAndDelete({ id: parseInt(req.params.id) });
        if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        console.error("Delete product error:", err);
        res.status(500).json({ message: "Failed to delete product" });
    }
};
