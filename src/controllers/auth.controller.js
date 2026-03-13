const passport = require("passport");
const twilio = require("twilio");
const User = require("../models/user.model");
const Otp = require("../models/otp.model");

// Initialize Twilio client conditionally
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== "your_twilio_sid") 
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
    : null;

exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, projectName } = req.body || {};
        if (!email || !password || !name) return res.status(400).json({ message: "Missing required fields" });

        const exist = await User.findOne({ email });
        if (exist) return res.status(400).json({ message: "Email already used" });

        // In a real app, we should hash the password here
        const user = await User.create({ name, email, password, phone, projectName });

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ user: userResponse });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ message: "Missing credentials" });

        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        req.login(user, (err) => {
            if (err) return res.status(500).json({ message: "Login error" });

            const userObj = user.toObject();
            delete userObj.password;

            res.json({ user: userObj });
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { email, name, sub: googleId, picture: avatar } = req.body || {};
        if (!email) return res.status(400).json({ message: "Missing email" });

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ name, email, googleId, avatar, provider: 'google' });
        } else if (!user.googleId) {
            user.googleId = googleId;
            user.avatar = avatar || user.avatar;
            user.provider = 'google';
            await user.save();
        }

        req.login(user, (err) => {
            if (err) return res.status(500).json({ message: "Login error" });
            res.json({ user });
        });
    } catch (err) {
        console.error("Google login error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.googleCallback = (req, res, next) => {
    passport.authenticate("google", (err, user, info) => {
        if (err) {
            console.error("[Auth] Google Callback Error:", err);
            return res.status(500).json({ message: "Google auth failed", error: err.message });
        }
        if (!user) {
            return res.redirect((process.env.CLIENT_URL || "http://localhost:5173") + "/login?error=failed");
        }
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.redirect(process.env.CLIENT_URL || "http://localhost:5173");
        });
    })(req, res, next);
};

exports.facebookCallback = (req, res) => {
    res.redirect(process.env.CLIENT_URL || "http://localhost:5173");
};

exports.xCallback = (req, res) => {
    res.redirect(process.env.CLIENT_URL || "http://localhost:5173");
};

exports.loginSuccess = (req, res) => {
    if (req.user) {
        res.status(200).json({ success: true, user: req.user });
    } else {
        res.status(401).json({ success: false, message: "Not authenticated" });
    }
};

exports.loginFailure = (req, res) => {
    res.status(401).json({ success: false, message: "Login failed" });
};

exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect(process.env.CLIENT_URL || "http://localhost:5173");
    });
};

exports.updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const { name, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (name) {
            user.name = name;
        }

        if (currentPassword && newPassword) {
            if (user.password !== currentPassword) {
                return res.status(400).json({ message: "Invalid current password" });
            }
            user.password = newPassword;
        }

        await user.save();

        const userObj = user.toObject();
        delete userObj.password;

        res.json({ user: userObj });
    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({ message: "Server error" });
    }
};





// --- Mobile OTP Authentication ---

exports.sendOtp = async (req, res) => {
    try {
        let { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ message: "Phone number is required" });
        }

        // Normalize phone to E.164 format
        // Strip all non-digit characters except leading +
        phone = phone.trim();
        if (!phone.startsWith('+')) {
            // If it's a 10-digit number, assume India (+91)
            const digits = phone.replace(/\D/g, '');
            if (digits.length === 10) {
                phone = `+91${digits}`;
            } else {
                phone = `+${digits}`;
            }
        }

        // Generate a random 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB (TTL index will delete it after 5 minutes)
        await Otp.create({ phone, otp: otpCode });

        // Send OTP via SMS or fallback to console
        let devOtp = null;
        if (twilioClient) {
            await twilioClient.messages.create({
                body: `Your KHM Electronics login code is: ${otpCode}. It will expire in 5 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone
            });
            console.log(`[OTP] SMS sent to ${phone}`);
        } else {
            // Dev mode: return OTP in response so frontend can display it
            devOtp = otpCode;
            console.log("-----------------------------------------");
            console.log(`[DEV OTP] Login Code for ${phone}: ${otpCode}`);
            console.log("-----------------------------------------");
        }

        res.json({ success: true, message: "OTP sent successfully", devOtp });
    } catch (err) {
        console.error("Send OTP error:", err);
        res.status(500).json({ message: "Failed to send OTP", error: err.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        let { phone, otp } = req.body;
        if (!phone || !otp) {
            return res.status(400).json({ message: "Phone and OTP are required" });
        }

        // Normalize phone to E.164 (same logic as sendOtp)
        phone = phone.trim();
        if (!phone.startsWith('+')) {
            const digits = phone.replace(/\D/g, '');
            phone = digits.length === 10 ? `+91${digits}` : `+${digits}`;
        }

        // Check if a matching, non-expired OTP exists
        const record = await Otp.findOne({ phone, otp });
        if (!record) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // OTP is valid! Delete it so it can't be reused
        await Otp.deleteOne({ _id: record._id });

        // Check if user exists. If not, create an empty profile tied to this phone number
        let user = await User.findOne({ phone });
        if (!user) {
            // Check if phone was accidentally stored in the email field by old logic
            user = await User.findOne({ email: phone });
            if (!user) {
                user = await User.create({ 
                    name: "New User", 
                    phone: phone,
                    // If no email, we must generate a dummy one to satisfy schemas
                    email: `${phone.replace(/\D/g, '')}@phone.login` 
                });
            }
        }

        // Establish passport session
        req.login(user, (err) => {
            if (err) return res.status(500).json({ message: "Login parsing error" });

            const userObj = user.toObject();
            delete userObj.password;


            return res.json({ success: true, user: userObj });
        });

    } catch (err) {
        console.error("Verify OTP error:", err);
        res.status(500).json({ message: "Failed to verify OTP", error: err.message });
    }
};
