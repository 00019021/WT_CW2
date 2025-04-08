const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  goalName: {
    type: String,
    required: true,
    minlength: 4,
  },
  target: {
    type: Number,
    required: true,
  },
  currentStatus: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
  description: {
    type: String,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Calculate progress before saving
goalSchema.pre("save", function (next) {
  if (this.target) {
    const percentage = (this.currentStatus / this.target) * 100;
    this.progress = Math.min(Math.round(percentage), 100);
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model("Goal", goalSchema);
