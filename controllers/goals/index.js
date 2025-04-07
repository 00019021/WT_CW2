const goalsService = require("../../services/goals");
const { validationResult } = require("express-validator");

// List all goals
exports.index = async (req, res) => {
  try {
    const goals = await goalsService.getAllGoals();
    res.render("goals/index", { goals });
  } catch (error) {
    res.status(500).render("error", { error });
  }
};

// Show create goal form
exports.create = (req, res) => {
  res.render("goals/create");
};

// Create new goal
exports.store = async (req, res) => {
  try {
    const errors = validationResult(req);

    // Validate goal name length
    if (req.body.goalName && req.body.goalName.length < 4) {
      const nameError = { msg: "Goal name must be at least 4 characters long" };
      errors.errors = errors.errors || [];
      errors.errors.push(nameError);
    }

    if (!errors.isEmpty()) {
      return res.render("goals/create", {
        errors: errors.errors,
        goal: req.body,
      });
    }

    await goalsService.createGoal(req.body);
    res.redirect("/goals");
  } catch (error) {
    return res.render("goals/create", {
      errors: [{ msg: error.message }],
      goal: req.body,
    });
  }
};

// Show edit goal form
exports.edit = async (req, res) => {
  try {
    const goal = await goalsService.getGoalById(req.params.id);
    if (!goal) {
      return res.status(404).render("error", { error: "Goal not found" });
    }
    res.render("goals/edit", { goal });
  } catch (error) {
    res.status(500).render("error", { error });
  }
};

// Display completed goals
exports.completed = async (req, res) => {
  try {
    const allGoals = await goalsService.getAllGoals();
    // Make sure to only show goals that are exactly at 100% progress
    const completedGoals = allGoals.filter((goal) => goal.progress === 100);
    res.render("goals/completed", { goals: completedGoals });
  } catch (error) {
    res.status(500).render("error", { error });
  }
};

// Update goal
exports.update = async (req, res) => {
  try {
    const errors = validationResult(req);

    // Validate goal name length
    if (req.body.goalName && req.body.goalName.length < 4) {
      const nameError = { msg: "Goal name must be at least 4 characters long" };
      errors.errors = errors.errors || [];
      errors.errors.push(nameError);
    }

    if (!errors.isEmpty()) {
      const goal = await goalsService.getGoalById(req.params.id);
      return res.render("goals/edit", {
        errors: errors.errors,
        goal: { ...goal, ...req.body },
      });
    }

    await goalsService.updateGoal(req.params.id, req.body);
    res.redirect("/goals");
  } catch (error) {
    const goal = await goalsService.getGoalById(req.params.id);
    return res.render("goals/edit", {
      errors: [{ msg: error.message }],
      goal: { ...goal, ...req.body },
    });
  }
};

// Mark goal as complete
exports.complete = async (req, res) => {
  try {
    const goal = await goalsService.getGoalById(req.params.id);
    if (!goal) {
      return res.status(404).render("error", { error: "Goal not found" });
    }

    // Set progress to 100% and current status to target to mark as complete
    await goalsService.updateGoal(req.params.id, {
      progress: 100, // Set progress to 100%
      currentStatus: goal.target, // Set current status to match the target
    });

    // Redirect back to the page where the action was initiated
    const referer = req.get("Referer");
    res.redirect(referer || "/goals");
  } catch (error) {
    res.status(500).render("error", { error });
  }
};

// Undo completed goal
exports.undo = async (req, res) => {
  try {
    const goal = await goalsService.getGoalById(req.params.id);
    if (!goal) {
      return res.status(404).render("error", { error: "Goal not found" });
    }

    // Calculate a new current status based on 75% of target
    // This ensures the goal won't show up in completed list and progress won't be recalculated to 100%
    const newCurrentStatus = goal.target * 0.75;

    await goalsService.updateGoal(req.params.id, {
      progress: 75, // Explicitly set progress to 75%
      currentStatus: newCurrentStatus, // Set current status to match the 75% progress
    });

    // Redirect back to the page where the action was initiated
    const referer = req.get("Referer");
    if (referer && referer.includes("/completed")) {
      // When undoing from the completed page, refresh that page so user sees the goal removed
      res.redirect("/goals/completed");
    } else {
      // When undoing from the main goals page, stay there
      res.redirect("/goals");
    }
  } catch (error) {
    res.status(500).render("error", { error });
  }
};

// Delete goal
exports.destroy = async (req, res) => {
  try {
    await goalsService.deleteGoal(req.params.id);
    res.redirect("/goals");
  } catch (error) {
    res.status(500).render("error", { error });
  }
};
