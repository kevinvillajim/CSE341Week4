const express = require("express");
const MongoStore = require("connect-mongo");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const dotenv = require("dotenv");
const routes = require("./src/routes/index");
const database = require("./src/config/database");
const cors = require("cors");
const session = require("express-session");
const authConfig = require("./src/config/auth");


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

// Configure CORS with credentials support
app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true, // Important for authentication cookies
	})
);

// Configure session middleware
app.use(
	session({
		secret: process.env.SESSION_SECRET || "your-secret-key",
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: process.env.MONGODB_URI,
			collectionName: "sessions",
		}),
		cookie: {
			secure: process.env.NODE_ENV === "production", 
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
			sameSite: "lax",
		},
	})
);

// Configure and initialize Passport for authentication
const passport = authConfig.configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// Parse JSON request bodies
app.use(express.json());

// Configure Swagger based on environment
const isProduction = process.env.NODE_ENV !== "development";
if (isProduction) {
	swaggerDocument.host = "cse341week4.onrender.com";
	swaggerDocument.schemes = ["https"];
} else {
	swaggerDocument.host = `localhost:${PORT}`;
	swaggerDocument.schemes = ["http"];
}

// Add auth to swagger if not already there
if (!swaggerDocument.securityDefinitions) {
	swaggerDocument.securityDefinitions = {
		github_auth: {
			type: "oauth2",
			authorizationUrl: "/api/auth/github",
			flow: "implicit",
		},
	};
}

// Routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api", routes);

// Root route redirect to docs
app.get("/", (req, res) => {
	res.redirect("/api-docs");
});

// Start server
async function startServer() {
	try {
		await database.connect();

		app.listen(PORT, () => {
			console.log(`Servidor corriendo en el puerto ${PORT}`);
			console.log(
				`Documentación de Swagger disponible en http://localhost:${PORT}/api-docs`
			);
		});
	} catch (error) {
		console.error("Error al iniciar el servidor", error);
	}
}

process.on("SIGINT", async () => {
	await database.close();
	process.exit(0);
});

startServer();
