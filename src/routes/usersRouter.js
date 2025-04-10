const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/auth");

router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.get("/users/:id/items", userController.getUserItems);

//Protected routes
router.post("/users", authMiddleware.isAuthenticated, userController.createUser);
router.put("/users/:id", authMiddleware.isAuthenticated, userController.updateUser);
router.delete("/users/:id", authMiddleware.isAuthenticated, userController.deleteUser);


module.exports = router;