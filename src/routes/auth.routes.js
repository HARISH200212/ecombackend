const express = require("express");
const passport = require("passport");
const authController = require("../controllers/auth.controller");
const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log(`[Auth Route] ${req.method} ${req.url}`);
  next();
});

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);
router.post("/google", authController.googleLogin);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", authController.googleCallback);

router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get("/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login/failure" }),
  authController.facebookCallback
);

router.get("/x", passport.authenticate("twitter"));
router.get("/x/callback",
  passport.authenticate("twitter", { failureRedirect: "/login/failure" }),
  authController.xCallback
);

router.get("/login/success", authController.loginSuccess);
router.get("/login/failure", authController.loginFailure);
router.get("/logout", authController.logout);
router.put("/profile", authController.updateProfile);

module.exports = router;
