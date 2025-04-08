// Database-based storage
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Setup database
const DB_PATH = path.join(__dirname, "../../data/goals.db");
const db = new sqlite3.Database(DB_PATH);

// Flag to track if the database has a goalType column
let hasGoalTypeColumn = false;

// Initialize database
db.serialize(() => {
  // First check if the table exists and what columns it has
  db.all("PRAGMA table_info(goals)", (err, rows) => {
    if (err) {
      console.error("Error checking table schema:", err);
      return;
    }

    if (!rows || rows.length === 0) {
      // Table doesn't exist, create it with the new schema
      console.log("Creating new goals table with updated schema");
      db.run(`
        CREATE TABLE goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          goalName TEXT NOT NULL,
          target REAL NOT NULL,
          currentStatus REAL DEFAULT 0,
          progress INTEGER DEFAULT 0,
          createdAt TEXT,
          dueDate TEXT,
          description TEXT,
          priority TEXT DEFAULT 'medium',
          lastUpdated TEXT
        )
      `);
    } else {
      // Check if goalType column exists
      hasGoalTypeColumn = rows.some((row) => row.name === "goalType");

      if (hasGoalTypeColumn) {
        console.log(
          "Legacy schema detected - goalType field will be handled automatically"
        );

        // Check if goals_new table already exists
        db.get(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='goals_new'",
          (err, tableExists) => {
            if (err) {
              console.error("Error checking for goals_new table:", err);
              return;
            }

            // If goals_new already exists, drop it to avoid conflicts
            if (tableExists) {
              db.run("DROP TABLE IF EXISTS goals_new", (err) => {
                if (err) {
                  console.error(
                    "Error dropping existing goals_new table:",
                    err
                  );
                  return;
                }
                performMigration();
              });
            } else {
              performMigration();
            }
          }
        );

        function performMigration() {
          // Create new table with updated schema
          db.run(
            `
            CREATE TABLE goals_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              goalName TEXT NOT NULL,
              target REAL NOT NULL,
              currentStatus REAL DEFAULT 0,
              progress INTEGER DEFAULT 0,
              createdAt TEXT,
              dueDate TEXT,
              description TEXT,
              priority TEXT DEFAULT 'medium',
              lastUpdated TEXT
            )
          `,
            (err) => {
              if (err) {
                console.error("Error creating new table:", err);
                return;
              }

              // Copy data from old table to new table
              db.run(
                `
              INSERT INTO goals_new (
                id, goalName, target, currentStatus, progress,
                createdAt, dueDate, description, priority, lastUpdated
              )
              SELECT 
                id, goalName, target, currentStatus, progress,
                createdAt, dueDate, description, priority, lastUpdated
              FROM goals
            `,
                function (err) {
                  if (err) {
                    console.error("Error migrating data:", err);
                    return;
                  }

                  // Check if goals_old exists and drop it
                  db.run("DROP TABLE IF EXISTS goals_old", (err) => {
                    if (err) {
                      console.error("Error dropping goals_old:", err);
                      return;
                    }

                    // Rename the original table
                    db.run("ALTER TABLE goals RENAME TO goals_old", (err) => {
                      if (err) {
                        console.error("Error renaming original table:", err);
                        return;
                      }

                      // Rename the new table
                      db.run("ALTER TABLE goals_new RENAME TO goals", (err) => {
                        if (err) {
                          console.error("Error renaming new table:", err);
                          // If we can't rename, we need to restore the original
                          db.run(
                            "ALTER TABLE goals_old RENAME TO goals",
                            () => {}
                          );
                          return;
                        }

                        console.log(
                          "Database schema migration completed successfully"
                        );
                        hasGoalTypeColumn = false;
                      });
                    });
                  });
                }
              );
            }
          );
        }
      }
    }
  });
});

class Goal {
  constructor(goalName, target, currentStatus, dueDate, description = "") {
    // Validate goal name
    if (!goalName || goalName.length < 4) {
      throw new Error("Goal name must be at least 4 characters long");
    }

    this.goalName = goalName;
    this.target = parseFloat(target);
    this.currentStatus = parseFloat(currentStatus) || 0;
    this.progress = this.calculateProgress();
    this.createdAt = new Date().toISOString();
    this.dueDate = dueDate;
    this.description = description;
    this.priority = "medium"; // Default priority is always medium
    this.lastUpdated = new Date().toISOString();

    // Add a default goalType for backward compatibility
    if (hasGoalTypeColumn) {
      this.goalType = "general";
    }
  }

  calculateProgress() {
    if (!this.target) return 0;
    const percentage = (this.currentStatus / this.target) * 100;
    return Math.min(Math.round(percentage), 100); // Cap at 100%
  }
}

// Helper function to convert database row to goal object
function rowToGoal(row) {
  return {
    id: row.id,
    goalName: row.goalName,
    target: row.target,
    currentStatus: row.currentStatus,
    progress: row.progress,
    createdAt: row.createdAt,
    dueDate: row.dueDate,
    description: row.description,
    priority: row.priority,
    lastUpdated: row.lastUpdated,
    updatedAt: row.lastUpdated, // For backward compatibility
  };
}

// Get all goals
exports.getAllGoals = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM goals", (err, rows) => {
      if (err) {
        return reject(err);
      }
      const goals = rows.map((row) => rowToGoal(row));
      resolve(goals);
    });
  });
};

// Get a specific goal by ID
exports.getGoalById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM goals WHERE id = ?", [id], (err, row) => {
      if (err) {
        return reject(err);
      }
      if (!row) {
        return resolve(null);
      }
      resolve(rowToGoal(row));
    });
  });
};

// Create a new goal
exports.createGoal = (goalData) => {
  return new Promise((resolve, reject) => {
    try {
      const goal = new Goal(
        goalData.goalName,
        goalData.target,
        goalData.currentStatus,
        goalData.dueDate,
        goalData.description
      );

      let insertSql, insertParams;

      if (hasGoalTypeColumn) {
        insertSql = `
          INSERT INTO goals (
            goalName, goalType, target, currentStatus, progress,
            createdAt, dueDate, description, priority, lastUpdated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        insertParams = [
          goal.goalName,
          goal.goalType,
          goal.target,
          goal.currentStatus,
          goal.progress,
          goal.createdAt,
          goal.dueDate,
          goal.description,
          goal.priority,
          goal.lastUpdated,
        ];
      } else {
        insertSql = `
          INSERT INTO goals (
            goalName, target, currentStatus, progress,
            createdAt, dueDate, description, priority, lastUpdated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        insertParams = [
          goal.goalName,
          goal.target,
          goal.currentStatus,
          goal.progress,
          goal.createdAt,
          goal.dueDate,
          goal.description,
          goal.priority,
          goal.lastUpdated,
        ];
      }

      db.run(insertSql, insertParams, function (err) {
        if (err) {
          return reject(err);
        }

        // Get the inserted goal with its ID
        db.get(
          "SELECT * FROM goals WHERE id = ?",
          [this.lastID],
          (err, row) => {
            if (err) {
              return reject(err);
            }
            resolve(rowToGoal(row));
          }
        );
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Update an existing goal
exports.updateGoal = (id, goalData) => {
  return new Promise((resolve, reject) => {
    // First get the current goal to preserve values not being updated
    db.get("SELECT * FROM goals WHERE id = ?", [id], (err, row) => {
      if (err) {
        return reject(err);
      }
      if (!row) {
        return reject(new Error("Goal not found"));
      }

      try {
        // Validate goal name if it's being updated
        if (goalData.goalName && goalData.goalName.length < 4) {
          return reject(
            new Error("Goal name must be at least 4 characters long")
          );
        }

        // Merge the existing goal with the updates
        const updatedGoal = {
          ...rowToGoal(row),
          ...goalData,
          lastUpdated: new Date().toISOString(),
        };

        // Convert data types
        updatedGoal.target = parseFloat(updatedGoal.target);
        updatedGoal.currentStatus = parseFloat(updatedGoal.currentStatus) || 0;

        // Recalculate progress if not explicitly provided
        if (!goalData.progress) {
          updatedGoal.progress = updatedGoal.target
            ? Math.min(
                Math.round(
                  (updatedGoal.currentStatus / updatedGoal.target) * 100
                ),
                100
              )
            : 0;
        }

        // Prepare update statement based on schema
        let updateSql, updateParams;

        if (hasGoalTypeColumn) {
          updateSql = `
            UPDATE goals SET
              goalName = ?,
              goalType = ?,
              target = ?,
              currentStatus = ?,
              progress = ?,
              dueDate = ?,
              description = ?,
              priority = ?,
              lastUpdated = ?
            WHERE id = ?
          `;
          updateParams = [
            updatedGoal.goalName,
            row.goalType || "general", // Preserve existing goalType or set default
            updatedGoal.target,
            updatedGoal.currentStatus,
            updatedGoal.progress,
            updatedGoal.dueDate,
            updatedGoal.description,
            updatedGoal.priority,
            updatedGoal.lastUpdated,
            id,
          ];
        } else {
          updateSql = `
            UPDATE goals SET
              goalName = ?,
              target = ?,
              currentStatus = ?,
              progress = ?,
              dueDate = ?,
              description = ?,
              priority = ?,
              lastUpdated = ?
            WHERE id = ?
          `;
          updateParams = [
            updatedGoal.goalName,
            updatedGoal.target,
            updatedGoal.currentStatus,
            updatedGoal.progress,
            updatedGoal.dueDate,
            updatedGoal.description,
            updatedGoal.priority,
            updatedGoal.lastUpdated,
            id,
          ];
        }

        db.run(updateSql, updateParams, function (err) {
          if (err) {
            return reject(err);
          }

          // Get the updated goal
          db.get("SELECT * FROM goals WHERE id = ?", [id], (err, row) => {
            if (err) {
              return reject(err);
            }
            resolve(rowToGoal(row));
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Delete a goal
exports.deleteGoal = (id) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM goals WHERE id = ?", [id], function (err) {
      if (err) {
        return reject(err);
      }

      if (this.changes === 0) {
        return reject(new Error("Goal not found"));
      }

      resolve();
    });
  });
};
