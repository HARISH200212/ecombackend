require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product.model');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

const importData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected to', MONGODB_URI);

    const productsPath = path.join(__dirname, 'data', 'products.json');
    let content = fs.readFileSync(productsPath, 'utf8');

    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    const productsData = JSON.parse(content);

    // Wipe existing products to avoid duplicates
    await Product.deleteMany();
    console.log('Existing products cleared');

    await Product.insertMany(productsData);
    console.log(`Successfully imported ${productsData.length} products to MongoDB!`);
    
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error.message}`);
    process.exit(1);
  }
};

importData();
