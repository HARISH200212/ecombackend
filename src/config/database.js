const mongoose = require("mongoose");

const connectDB = async (uri) => {
    try {
        const conn = await mongoose.connect(uri || process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
