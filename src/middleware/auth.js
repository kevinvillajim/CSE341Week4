/**
 * Checks if user is authenticated
 */
exports.isAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	res.status(401).json({message: "Unauthorized: Please log in"});
};

/**
 * Returns authentication status
 */
exports.getAuthStatus = (req, res) => {
	console.log("Session ID:", req.sessionID);
	console.log("Session data:", req.session);
	console.log("Is authenticated:", req.isAuthenticated());
	console.log("User:", req.user);

	res.json({
		isAuthenticated: req.isAuthenticated(),
		sessionExists: !!req.session,
		user: req.isAuthenticated()
			? {
					id: req.user.id,
					username: req.user.username,
					displayName: req.user.displayName,
					photos: req.user.photos,
			  }
			: null,
	});
};

/**
 * Logs out the user
 */
exports.logout = (req, res) => {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		res.redirect("/");
	});
};
