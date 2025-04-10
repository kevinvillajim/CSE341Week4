const express = require("express");
const passport = require("passport");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

// GitHub OAuth routes
router.get(
	"/auth/github",
	passport.authenticate("github", {scope: ["user:email"]})
);

router.get(
	"/auth/github/callback",
	passport.authenticate("github", {
		failureRedirect: "/api-docs",
		session: true,
	}),
	(req, res) => {
		// Successful authentication, redirect to the API docs
		res.redirect("/api-docs");
	}
);

// Check authentication status
router.get("/auth/status", (req, res) => {
	if (req.isAuthenticated()) {
		res.json({
			isAuthenticated: true,
			user: {
				_id: req.user._id,
				username: req.user.username,
				email: req.user.email,
				avatarUrl: req.user.avatarUrl,
			},
		});
	} else {
		res.json({
			isAuthenticated: false,
			user: null,
		});
	}
});

// Logout route
router.get("/auth/logout", (req, res, next) => {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.json({message: "Successfully logged out"});
	});
});

router.get(
	"/auth/token",
	authMiddleware.isAuthenticated,
	authController.generateApiToken
);
router.get("/auth/check-token", authController.checkApiToken);

module.exports = router;
