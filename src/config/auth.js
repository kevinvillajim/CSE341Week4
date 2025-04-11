const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
const {ObjectId} = require("mongodb");
const database = require("./database");

// Configure Passport
passport.serializeUser((user, done) => {
	done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
	try {
		if (!ObjectId.isValid(id)) {
			return done(null, false);
		}

		const collection = database.getCollection("users");
		const user = await collection.findOne({_id: new ObjectId(id)});
		done(null, user);
	} catch (err) {
		done(err, null);
	}
});

// GitHub Strategy
passport.use(
	new GitHubStrategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			callbackURL:
				process.env.NODE_ENV !== "development"
					? "https://cse341week4.onrender.com/api/auth/github/callback"
					: "http://localhost:3000/api/auth/github/callback",
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				const collection = database.getCollection("users");

				// Check if user already exists
				let user = await collection.findOne({githubId: profile.id});

				if (user) {
					// Update user information if needed
					await collection.updateOne(
						{_id: user._id},
						{
							$set: {
								lastLogin: new Date(),
								username: profile.username || profile.displayName,
								email:
									profile.emails && profile.emails[0]
										? profile.emails[0].value
										: user.email,
								avatarUrl:
									profile.photos && profile.photos[0]
										? profile.photos[0].value
										: user.avatarUrl,
							},
						}
					);

					// Get updated user
					user = await collection.findOne({_id: user._id});
					return done(null, user);
				}

				// Create new user
				const newUser = {
					githubId: profile.id,
					username: profile.username || profile.displayName,
					email:
						profile.emails && profile.emails[0] ? profile.emails[0].value : "",
					firstName: profile.displayName
						? profile.displayName.split(" ")[0]
						: "",
					lastName:
						profile.displayName && profile.displayName.split(" ").length > 1
							? profile.displayName.split(" ").slice(1).join(" ")
							: "",
					avatarUrl:
						profile.photos && profile.photos[0] ? profile.photos[0].value : "",
					createdAt: new Date(),
					lastLogin: new Date(),
				};

				const result = await collection.insertOne(newUser);
				const createdUser = await collection.findOne({_id: result.insertedId});
				return done(null, createdUser);
			} catch (err) {
				return done(err, null);
			}
		}
	)
);

module.exports = passport;
