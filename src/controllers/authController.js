const {generateToken} = require("../utils/tokenGenerator");
const database = require("../config/database");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

async function storeUserToken(userId, token) {
	try {
		const collection = database.getCollection("apiTokens");

		// Create an expiration date (30 days from now)
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 30);

		// Store the token
		await collection.insertOne({
			userId,
			token,
			createdAt: new Date(),
			expiresAt,
		});

		return true;
	} catch (error) {
		console.error("Error storing token:", error);
		return false;
	}
}

/**
 * Generate and store a new API token for a user
 */
exports.generateApiToken = async (req, res) => {
	if (!req.isAuthenticated()) {
		return res
			.status(401)
			.json({message: "You must be logged in to generate an API token"});
	}

	try {
		const token = generateToken();
		const userId = req.user._id.toString();

		const stored = await storeUserToken(userId, token);

		if (stored) {
			// Check if Accept header indicates JSON is preferred
			if (req.accepts("html") === "html" && req.xhr === false) {
				// Read the token.html template file
				const templatePath = path.join(__dirname, "../views/token.html");

				if (fs.existsSync(templatePath)) {
					const template = fs.readFileSync(templatePath, "utf8");

					// Get the base URL
					const protocol = req.get("x-forwarded-proto") || req.protocol;
					const host = req.get("host");
					const baseUrl = `${protocol}://${host}`;

					// Render the template with the token
					const html = ejs.render(template, {token, baseUrl});

					// Send the rendered HTML
					return res.send(html);
				}
			}

			// Default to JSON response
			return res.json({
				message: "API token generated successfully",
				token,
				userId,
			});
		} else {
			return res.status(500).json({message: "Failed to store API token"});
		}
	} catch (error) {
		console.error("Error generating token:", error);
		return res.status(500).json({message: error.message});
	}
};


exports.validateToken = async (token) => {
	try {
		const collection = database.getCollection("apiTokens");
		const tokenDoc = await collection.findOne({token});

		if (!tokenDoc) {
			return false;
		}

		// Check if token is expired
		if (new Date() > new Date(tokenDoc.expiresAt)) {
			return false;
		}

		return tokenDoc.userId;
	} catch (error) {
		console.error("Error validating token:", error);
		return false;
	}
};
