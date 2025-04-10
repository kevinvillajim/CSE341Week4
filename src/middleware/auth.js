const dotenv = require("dotenv");
dotenv.config();

const API_KEY = process.env.SESSION_SECRET;

exports.isAuthenticated = (req, res, next) => {
	// Check for session-based authentication first
	if (req.isAuthenticated()) {
		return next();
	}

	// If not authenticated via session, check for API key
	const apiKey = req.header("X-API-Key");

	if (apiKey && apiKey === API_KEY) {
		// Allow access if API key is valid
		return next();
	}

	// If neither authentication method is valid, return 401
	res.status(401).json({
		message:
			"Unauthorized: You must be logged in or provide a valid API key to access this resource",
	});
};

// Middleware to make authentication info available to all templates
exports.injectAuthInfo = (req, res, next) => {
	res.locals.isAuthenticated = req.isAuthenticated();
	res.locals.user = req.user || null;
	next();
};
