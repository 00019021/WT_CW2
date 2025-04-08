document.addEventListener("DOMContentLoaded", () => {
  const deleteForms = document.querySelectorAll(".delete-form");

  deleteForms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!confirm("Are you sure you want to delete this goal?")) {
        e.preventDefault();
      }
    });
  });

  const completeForms = document.querySelectorAll(".complete-form");

  completeForms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!confirm("Are you sure you want to mark this goal as complete?")) {
        e.preventDefault();
      }
    });
  });

  const undoForms = document.querySelectorAll(".undo-form");

  undoForms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!confirm("Are you sure you want to mark this goal as incomplete?")) {
        e.preventDefault();
      }
    });
  });

  const dueDateInputs = document.querySelectorAll('input[type="date"]');
  const today = new Date().toISOString().split("T")[0];

  dueDateInputs.forEach((input) => {
    input.min = today;
  });

  initGoalCardExpansion();
});

function initGoalCardExpansion() {
  const goalCards = document.querySelectorAll(".goal-card");

  goalCards.forEach((card) => {
    const expandButton = card.querySelector(".expand-button");
    const expandableContent = card.querySelector(".goal-expandable");

    if (expandButton && expandableContent) {
      expandButton.addEventListener("click", () => {
        expandableContent.classList.toggle("active");
        expandButton.textContent = expandableContent.classList.contains(
          "active"
        )
          ? "Show Less"
          : "Show More";
      });
    }
  });
}
