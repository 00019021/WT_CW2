const Goal = require("../../models/Goal");

class GoalService {
  constructor(goalName, target, currentStatus, dueDate, description = "") {
    if (!goalName || goalName.length < 4) {
      throw new Error("Goal name must be at least 4 characters long");
    }

    this.goalName = goalName;
    this.target = parseFloat(target);
    this.currentStatus = parseFloat(currentStatus) || 0;
    this.dueDate = dueDate;
    this.description = description;
    this.priority = "medium";
  }
}

// Get all goals
exports.getAllGoals = async () => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 });
    return goals;
  } catch (error) {
    throw error;
  }
};

// Get a specific goal by ID
exports.getGoalById = async (id) => {
  try {
    const goal = await Goal.findById(id);
    return goal;
  } catch (error) {
    throw error;
  }
};

// Create a new goal
exports.createGoal = async (goalData) => {
  try {
    const goal = new GoalService(
      goalData.goalName,
      goalData.target,
      goalData.currentStatus,
      goalData.dueDate,
      goalData.description
    );

    const newGoal = new Goal(goal);
    await newGoal.save();
    return newGoal;
  } catch (error) {
    throw error;
  }
};

// Update a goal
exports.updateGoal = async (id, goalData) => {
  try {
    const goal = await Goal.findById(id);
    if (!goal) {
      throw new Error("Goal not found");
    }

    // Update fields
    Object.keys(goalData).forEach((key) => {
      if (goalData[key] !== undefined) {
        goal[key] = goalData[key];
      }
    });

    await goal.save();
    return goal;
  } catch (error) {
    throw error;
  }
};

// Delete a goal
exports.deleteGoal = async (id) => {
  try {
    const goal = await Goal.findByIdAndDelete(id);
    if (!goal) {
      throw new Error("Goal not found");
    }
    return goal;
  } catch (error) {
    throw error;
  }
};
