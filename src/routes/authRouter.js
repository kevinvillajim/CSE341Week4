const express = require("express");
const passport = require("passport");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

// GitHub authentication route
router.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

// GitHub callback route
router.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/",
    successRedirect: "/api-docs"
  })
);

// Status route - check if authenticated
router.get("/auth/status", authMiddleware.getAuthStatus);

// Logout route
router.get("/auth/logout", authMiddleware.logout);

// Protected route example
router.get("/auth/protected", authMiddleware.isAuthenticated, (req, res) => {
  res.json({ 
    message: "This is a protected route", 
    user: req.user 
  });
});

module.exports = router;
