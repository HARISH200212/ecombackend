require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const passport = require("passport");
const helmet = require("helmet"); // Added helmet
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
const normalizeOrigin = (value) => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const withProtocol = (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
        ? trimmed
        : `https://${trimmed}`;

    try {
        const parsed = new URL(withProtocol);
        return `${parsed.protocol}//${parsed.host}`.toLowerCase();
    } catch (_err) {
        return null;
    }
};

const configuredClientOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

const allowedOrigins = [
    'http://localhost:5173',
    'https://khm-electronics-5st7.vercel.app',
    ...configuredClientOrigins
];

const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    const normalized = normalizeOrigin(origin);
    if (!normalized) return false;

    if (allowedOrigins.includes(normalized)) {
        return true;
    }

    // Allow Vercel preview deploy URLs for this project.
    return /^https:\/\/([a-z0-9-]+\.)?khm-electronics-5st7\.vercel\.app$/i.test(normalized);
};

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (isAllowedOrigin(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
            connectSrc: ["'self'", "https://api.qrserver.com", "https://raw.githubusercontent.com", "ws:", "wss:"],
            frameSrc: ["'self'", "https://js.stripe.com"],
            imgSrc: ["'self'", "data:", "https://api.qrserver.com", "https://images.unsplash.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            upgradeInsecureRequests: [],
        },
    },
}));
app.use(express.json());
// Inject socket.io instance to the request object
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.use(cors({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
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
app.get("/", (_req, res) => {
    res.status(200).send("API IS WORKING");
});

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
    const fs = require("fs");
    const path = require("path");
    const clientDistDir = path.join(__dirname, "../../client/dist");
    const clientIndexFile = path.join(clientDistDir, "index.html");

    if (fs.existsSync(clientIndexFile)) {
        app.use(express.static(clientDistDir));
        app.get("*", (req, res) => {
            res.sendFile(clientIndexFile);
        });
    } else {
        console.warn("[Server] client/dist not found. Skipping static file serving.");
    }
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
