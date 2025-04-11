const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const dotenv = require("dotenv");

dotenv.config();

// Configure GitHub strategy for Passport
module.exports.configurePassport = () => {
	// Verify required env variables
	if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
		console.error("GitHub OAuth credentials are missing!");
		console.error(
			"Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file"
		);
		process.exit(1);
	}

	// Set up GitHub strategy
	passport.use(
		new GitHubStrategy(
			{
				clientID: process.env.GITHUB_CLIENT_ID,
				clientSecret: process.env.GITHUB_CLIENT_SECRET,
				callbackURL:
					process.env.NODE_ENV !== "development"
						? "https://cse341week4.onrender.com/api/auth/github/callback"
						: `http://localhost:${
								process.env.PORT || 3000
						  }/api/auth/github/callback`,
			},
			function (accessToken, refreshToken, profile, done) {
				console.log("GitHub profile:", profile);

				return done(null, {
					id: profile.id,
					username: profile.username,
					displayName: profile.displayName,
					photos: profile.photos,
				});
			}
		)
	);

	// User serialization for session storage
	passport.serializeUser((user, done) => {
		done(null, user);
	});

	// User deserialization from session
	passport.deserializeUser((obj, done) => {
		done(null, obj);
	});

	return passport;
};
