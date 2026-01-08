import React from "react";
import { useParams } from "react-router-dom";
import StudentProfile from "../admin/studentProfile/StudentProfile";

/**
 * ParentChildProfile - Wrapper component for parents viewing their child's profile
 * 
 * This component simply calls the StudentProfile component with parent-specific props.
 * All the profile logic is handled by StudentProfile itself.
 */
const ParentChildProfile = () => {
  const { childId } = useParams();

  return (
    <StudentProfile 
      isParentView={true}
      childIdFromRoute={childId}
    />
  );
};

export default ParentChildProfile;