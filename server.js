const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const dotenv = require("dotenv");
const routes = require("./src/routes/index");
const database = require("./src/config/database");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./src/config/auth");
const authMiddleware = require("./src/middleware/auth");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		credentials: true, // This is important for cookies/sessions
	})
);

// Session configuration
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: process.env.MONGODB_URI,
			collectionName: "sessions",
		}),
		cookie: {
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000,
		},
	})
);

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Add auth info to all requests
app.use(authMiddleware.injectAuthInfo);

const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
	swaggerDocument.host = "cse341week4.onrender.com";
	swaggerDocument.schemes = ["https"];
} else {
	swaggerDocument.host = `localhost:${PORT}`;
	swaggerDocument.schemes = ["http"];
}

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api", routes);

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
