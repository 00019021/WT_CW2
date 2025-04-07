const express = require("express");
const router = express.Router();
const goalsController = require("../../controllers/goals/index.js");

router.get("/", goalsController.index);

router.get("/create", goalsController.create);

router.post("/", goalsController.store);

router.get("/completed", goalsController.completed);

router.get("/:id/edit", goalsController.edit);

router.put("/:id", goalsController.update);

router.put("/:id/complete", goalsController.complete);

router.put("/:id/undo", goalsController.undo);

router.delete("/:id", goalsController.destroy);

module.exports = router;
