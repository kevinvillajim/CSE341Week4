const express = require("express");
const router = express.Router();
const itemsRouter = require("./itemsRouter");
const usersRouter = require("./usersRouter");
const authRouter = require("./authRouter");

// Forward all requests to the appropriate router
router.use("/", itemsRouter);
router.use("/", usersRouter);
router.use("/", authRouter);

module.exports = router;
