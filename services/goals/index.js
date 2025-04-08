const fs = require("fs").promises;
const path = require("path");

// Path to the JSON file
const GOALS_FILE = path.join(__dirname, "../../data/goals.json");

// Helper function to read goals from JSON file
async function readGoals() {
  try {
    const data = await fs.readFile(GOALS_FILE, "utf8");
    const goals = JSON.parse(data);
    return Array.isArray(goals) ? goals : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      // If file doesn't exist, create it with empty array
      await fs.writeFile(GOALS_FILE, "[]", "utf8");
      return [];
    }
    // If JSON parsing fails, return empty array
    if (error instanceof SyntaxError) {
      await fs.writeFile(GOALS_FILE, "[]", "utf8");
      return [];
    }
    throw error;
  }
}

// Helper function to write goals to JSON file
async function writeGoals(goals) {
  await fs.writeFile(GOALS_FILE, JSON.stringify(goals, null, 2), "utf8");
}

class Goal {
  constructor(goalName, target, currentStatus, dueDate, description = "") {
    if (!goalName || goalName.length < 4) {
      throw new Error("Goal name must be at least 4 characters long");
    }

    this.id = Date.now().toString(); // Use timestamp as ID
    this.goalName = goalName;
    this.target = parseFloat(target);
    this.currentStatus = parseFloat(currentStatus) || 0;
    this.progress = this.calculateProgress();
    this.createdAt = new Date().toISOString();
    this.dueDate = dueDate;
    this.description = description;
    this.priority = "medium";
    this.lastUpdated = new Date().toISOString();
  }

  calculateProgress() {
    if (!this.target) return 0;
    const percentage = (this.currentStatus / this.target) * 100;
    return Math.min(Math.round(percentage), 100);
  }
}

// Get all goals
exports.getAllGoals = async () => {
  try {
    const goals = await readGoals();
    return goals;
  } catch (error) {
    throw error;
  }
};

// Get a specific goal by ID
exports.getGoalById = async (id) => {
  try {
    const goals = await readGoals();
    const goal = goals.find((g) => g.id === id);
    return goal || null;
  } catch (error) {
    throw error;
  }
};

// Create a new goal
exports.createGoal = async (goalData) => {
  try {
    const goals = (await readGoals()) || [];
    const goal = new Goal(
      goalData.goalName,
      goalData.target,
      goalData.currentStatus,
      goalData.dueDate,
      goalData.description
    );

    goals.push(goal);
    await writeGoals(goals);
    return goal;
  } catch (error) {
    throw error;
  }
};

// Update a goal
exports.updateGoal = async (id, goalData) => {
  try {
    const goals = await readGoals();
    const index = goals.findIndex((g) => g.id === id);

    if (index === -1) {
      throw new Error("Goal not found");
    }

    const updatedGoal = {
      ...goals[index],
      ...goalData,
      lastUpdated: new Date().toISOString(),
    };

    // Recalculate progress
    if (updatedGoal.target && updatedGoal.currentStatus !== undefined) {
      const percentage = (updatedGoal.currentStatus / updatedGoal.target) * 100;
      updatedGoal.progress = Math.min(Math.round(percentage), 100);
    }

    goals[index] = updatedGoal;
    await writeGoals(goals);
    return updatedGoal;
  } catch (error) {
    throw error;
  }
};

// Delete a goal
exports.deleteGoal = async (id) => {
  try {
    const goals = await readGoals();
    const filteredGoals = goals.filter((g) => g.id !== id);

    if (filteredGoals.length === goals.length) {
      throw new Error("Goal not found");
    }

    await writeGoals(filteredGoals);
    return true;
  } catch (error) {
    throw error;
  }
};
