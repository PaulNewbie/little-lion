import React from "react";
import Modal from "../../components/common/Modal";
import AssessmentHistory from "./AssessmentHistory";
import "./AssessmentHistoryModal.css";

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
      size="large"
      showCloseButton={false}
      noBodyWrapper
      className="assessment-history-modal"
    >
      <button
        className="assessment-modal-close-btn"
        onClick={onClose}
        aria-label="Close"
      >
        &times;
      </button>
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
