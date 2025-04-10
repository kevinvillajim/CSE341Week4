const {generateToken} = require("../utils/tokenGenerator");
const database = require("../config/database");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

async function storeUserToken(userId, token) {
	try {
		const collection = database.getCollection("apiTokens");

		// Crear una fecha de expiración (30 días a partir de ahora)
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 30);

		// Almacenar el token
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
 * Genera y almacena un nuevo token de API para un usuario
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
			// Verificar si el encabezado Accept indica que se prefiere JSON
			if (req.accepts("html") === "html" && req.xhr === false) {
				// Leer el archivo de plantilla token.html
				const templatePath = path.join(__dirname, "../views/token.html");

				if (fs.existsSync(templatePath)) {
					const template = fs.readFileSync(templatePath, "utf8");

					// Obtener la URL base
					const protocol = req.get("x-forwarded-proto") || req.protocol;
					const host = req.get("host");
					const baseUrl = `${protocol}://${host}`;

					// Renderizar la plantilla con el token
					const html = ejs.render(template, {token, baseUrl});

					// Enviar el HTML renderizado
					return res.send(html);
				}
			}

			// Por defecto responder con JSON
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

/**
 * Valida un token de API
 * @param {string} token - Token a validar
 * @returns {string|boolean} ID del usuario si el token es válido, false en caso contrario
 */
exports.validateToken = async (token) => {
	try {
		const collection = database.getCollection("apiTokens");
		const tokenDoc = await collection.findOne({token});

		if (!tokenDoc) {
			return false;
		}

		// Verificar si el token ha expirado
		if (new Date() > new Date(tokenDoc.expiresAt)) {
			return false;
		}

		return tokenDoc.userId;
	} catch (error) {
		console.error("Error validating token:", error);
		return false;
	}
};

/**
 * Endpoint para verificar la validez de un token de API
 */
exports.checkApiToken = async (req, res) => {
	const token = req.header("X-API-Key");

	if (!token) {
		return res.status(400).json({
			valid: false,
			message: "No API token provided",
		});
	}

	const userId = await this.validateToken(token);

	if (userId) {
		return res.json({
			valid: true,
			userId,
		});
	}

	return res.status(401).json({
		valid: false,
		message: "Invalid or expired API token",
	});
};
