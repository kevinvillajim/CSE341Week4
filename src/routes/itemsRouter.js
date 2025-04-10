const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");
const authMiddleware = require("../middleware/auth");

router.get("/items", itemController.getAllItems);
router.get("/items/:id", itemController.getItemById);

//Protected routes
router.post("/items", authMiddleware.isAuthenticated, itemController.createItem);
router.put("/items/:id", authMiddleware.isAuthenticated, itemController.updateItem);
router.delete("/items/:id", authMiddleware.isAuthenticated, itemController.deleteItem);

module.exports = router;