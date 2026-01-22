import React from "react";
import "./StepIndicator.css";

// Step groups configuration
const STEP_GROUPS = [
  {
    id: "info",
    label: "Student Info",
    steps: [1],
    estimatedTime: "3 min",
  },
  {
    id: "referral",
    label: "Referral",
    steps: [2, 3],
    estimatedTime: "5 min",
  },
  {
    id: "background",
    label: "Background",
    steps: [4, 5, 6, 7, 8],
    estimatedTime: "15 min",
  },
  {
    id: "assessment",
    label: "Assessment",
    steps: [9, 10, 11, 12],
    estimatedTime: "10 min",
  },
  {
    id: "enrollment",
    label: "Enrollment",
    steps: [13],
    estimatedTime: "2 min",
  },
];

// Step titles for tooltips
const STEP_TITLES = {
  1: "Identifying Data",
  2: "Reason for Referral",
  3: "Purpose of Assessment",
  4: "Family Information",
  5: "Daily Life & Medical",
  6: "Development & Education",
  7: "Diagnosis & Interventions",
  8: "Personal Profile",
  9: "Behavior During Assessment",
  10: "Assessment Tools",
  11: "Assessment Results",
  12: "Summary & Recommendations",
  13: "Service Enrollment",
};

export default function StepIndicator({
  currentStep,
  totalSteps,
  onStepClick,
  completedSteps = []
}) {
  // Determine group status
  const getGroupStatus = (group) => {
    const allComplete = group.steps.every(s => completedSteps.includes(s) || s < currentStep);
    const isCurrentGroup = group.steps.includes(currentStep);
    const hasAnyComplete = group.steps.some(s => completedSteps.includes(s) || s < currentStep);

    if (allComplete && !isCurrentGroup) return "completed";
    if (isCurrentGroup) return "current";
    if (hasAnyComplete) return "partial";
    return "upcoming";
  };

  // Check if a step is clickable (completed or current)
  const isStepClickable = (step) => {
    return step <= currentStep || completedSteps.includes(step);
  };

  // Handle step click
  const handleStepClick = (step) => {
    if (isStepClickable(step) && onStepClick) {
      onStepClick(step);
    }
  };

  return (
    <div className="step-indicator-container">
      {/* Grouped stepper */}
      <div className="step-groups">
        {STEP_GROUPS.map((group, index) => {
          const status = getGroupStatus(group);
          const currentStepInGroup = group.steps.includes(currentStep);
          const stepIndexInGroup = currentStepInGroup
            ? group.steps.indexOf(currentStep) + 1
            : 0;

          return (
            <React.Fragment key={group.id}>
              {/* Group */}
              <div className={`step-group ${status}`}>
                <div className="step-group-header">
                  <span className="step-group-label">{group.label}</span>
                  {group.steps.length > 1 && currentStepInGroup && (
                    <span className="step-group-progress">
                      {stepIndexInGroup}/{group.steps.length}
                    </span>
                  )}
                </div>

                {/* Mini dots for steps within group */}
                <div className="step-group-dots">
                  {group.steps.map((step) => (
                    <div
                      key={step}
                      className={`step-mini-dot ${
                        step === currentStep ? "current" : ""
                      } ${step < currentStep || completedSteps.includes(step) ? "completed" : ""} ${
                        isStepClickable(step) ? "clickable" : ""
                      }`}
                      onClick={() => handleStepClick(step)}
                      title={`${STEP_TITLES[step]}${isStepClickable(step) ? " (click to edit)" : ""}`}
                    />
                  ))}
                </div>

                <div className="step-group-time">{group.estimatedTime}</div>
              </div>

              {/* Connector line between groups */}
              {index < STEP_GROUPS.length - 1 && (
                <div className={`step-connector ${status === "completed" ? "completed" : ""}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
