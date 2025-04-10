const {ObjectId} = require("mongodb");
const database = require("../config/database");

const validateUserData = (data) => {
	const errors = [];

	if (!data.username) errors.push("Username is required");
	if (!data.email) errors.push("Email is required");

	// Basic email validation
	if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
		errors.push("Email format is invalid");
	}

	return errors;
};

exports.getAllUsers = async (req, res) => {
	try {
		const collection = database.getCollection("users");
		const users = await collection.find().toArray();
		res.json(users);
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};

exports.getUserById = async (req, res) => {
	try {
		if (!ObjectId.isValid(req.params.id)) {
			return res.status(400).json({message: "Invalid user ID format"});
		}

		const collection = database.getCollection("users");
		const user = await collection.findOne({_id: new ObjectId(req.params.id)});

		if (!user) {
			return res.status(404).json({message: "User not found"});
		}

		res.json(user);
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};

exports.createUser = async (req, res) => {
	try {
		const validationErrors = validateUserData(req.body);
		if (validationErrors.length > 0) {
			return res.status(400).json({
				message: "Validation failed",
				errors: validationErrors,
			});
		}

		const collection = database.getCollection("users");

		// Check if username or email already exists
		const existingUser = await collection.findOne({
			$or: [{username: req.body.username}, {email: req.body.email}],
		});

		if (existingUser) {
			return res.status(400).json({
				message: "Username or email already exists",
			});
		}

		const result = await collection.insertOne({
			...req.body,
			createdAt: new Date(),
		});

		res.status(201).json(result);
	} catch (err) {
		res.status(400).json({message: err.message});
	}
};

exports.updateUser = async (req, res) => {
	try {
		const validationErrors = validateUserData(req.body);
		if (validationErrors.length > 0) {
			return res.status(400).json({
				message: "Validation failed",
				errors: validationErrors,
			});
		}

		if (!ObjectId.isValid(req.params.id)) {
			return res.status(400).json({message: "Invalid user ID format"});
		}

		const collection = database.getCollection("users");

		// Check if updating to an existing email or username (excluding current user)
		if (req.body.email || req.body.username) {
			const query = {_id: {$ne: new ObjectId(req.params.id)}};

			if (req.body.email && req.body.username) {
				query.$or = [{email: req.body.email}, {username: req.body.username}];
			} else if (req.body.email) {
				query.email = req.body.email;
			} else {
				query.username = req.body.username;
			}

			const existingUser = await collection.findOne(query);

			if (existingUser) {
				return res.status(400).json({
					message: "Username or email already exists",
				});
			}
		}

		const result = await collection.updateOne(
			{_id: new ObjectId(req.params.id)},
			{
				$set: {
					...req.body,
					updatedAt: new Date(),
				},
			}
		);

		if (result.matchedCount === 0) {
			return res.status(404).json({message: "User not found"});
		}

		res.json(result);
	} catch (err) {
		res.status(400).json({message: err.message});
	}
};

exports.deleteUser = async (req, res) => {
	try {
		if (!ObjectId.isValid(req.params.id)) {
			return res.status(400).json({message: "Invalid user ID format"});
		}

		const collection = database.getCollection("users");
		const result = await collection.deleteOne({
			_id: new ObjectId(req.params.id),
		});

		if (result.deletedCount === 0) {
			return res.status(404).json({message: "User not found"});
		}

		res.json({message: "User deleted"});
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};

exports.getUserItems = async (req, res) => {
	try {
		if (!ObjectId.isValid(req.params.id)) {
			return res.status(400).json({message: "Invalid user ID format"});
		}

		const usersCollection = database.getCollection("users");
		const user = await usersCollection.findOne({
			_id: new ObjectId(req.params.id),
		});

		if (!user) {
			return res.status(404).json({message: "User not found"});
		}

		const itemsCollection = database.getCollection("items");
		const items = await itemsCollection.find({userId: req.params.id}).toArray();

		res.json(items);
	} catch (err) {
		res.status(500).json({message: err.message});
	}
};
