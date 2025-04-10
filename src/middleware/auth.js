exports.isAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}

	res.status(401).json({
		message: "Unauthorized: You must be logged in to access this resource",
	});
};

// Middleware to make authentication info available to all templates
exports.injectAuthInfo = (req, res, next) => {
	res.locals.isAuthenticated = req.isAuthenticated();
	res.locals.user = req.user || null;
	next();
};
