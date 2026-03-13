require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const connectDB = require("./config/database");

// Load passport config
require("./config/passport");

const paymentRoutes = require("./routes/payment.routes");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const cartRoutes = require("./routes/cart.routes");
const categoryRoutes = require("./routes/category.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const contactRoutes = require("./routes/contact.routes");
const reviewRoutes = require("./routes/review.routes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Middleware
app.use(express.json());
// Inject socket.io instance to the request object
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

// Sessions & Passport
app.use(session({
    secret: process.env.SESSION_SECRET || "kh_electronics_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce',
        collectionName: 'sessions'
    }),
    cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(passport.initialize());
app.use(passport.session());

if (process.env.MONGO_URI) {
    connectDB(process.env.MONGO_URI);
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/reviews", reviewRoutes);

const PORT = process.env.PORT || 5000;

// Serve Static Frontend in Production
if (process.env.NODE_ENV === "production") {
    const path = require("path");
    app.use(express.static(path.join(__dirname, "../../client/dist")));
    
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../../client", "dist", "index.html"));
    });
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
