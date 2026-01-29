import React from "react";
import Modal from "../../components/common/Modal";
import AssessmentHistory from "./AssessmentHistory";

/**
 * Modal wrapper for AssessmentHistory component
 */
const AssessmentHistoryModal = ({
  isOpen,
  onClose,
  childData,
  assessmentData,
  isLoading
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assessment History"
      size="large"
    >
      {isLoading ? (
        <div className="assessment-loading">
          <p>Loading assessment data...</p>
        </div>
      ) : (
        <AssessmentHistory
          childData={childData}
          assessmentData={assessmentData}
        />
      )}
    </Modal>
  );
};

export default AssessmentHistoryModal;
