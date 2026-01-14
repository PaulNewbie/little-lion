import React from "react";
import { useParams } from "react-router-dom";
import StudentProfile from "../admin/studentProfile/StudentProfile";
import Sidebar from "../../components/sidebar/Sidebar";
import { getParentConfig } from "../../components/sidebar/sidebarConfigs";

/**
 * ParentChildProfile - Wrapper component for parents viewing their child's profile
 *
 * This component simply calls the StudentProfile component with parent-specific props.
 * All the profile logic is handled by StudentProfile itself.
 */
const ParentChildProfile = () => {
  const { childId } = useParams();

  console.log("ParentChildProfile render", { childId });

  return (
    <div className="sp-container">
      <Sidebar {...getParentConfig()} />
      <StudentProfile
        isParentView={true}
        childIdFromRoute={childId}
        hideSidebar={true}
        noContainer={true}
      />
    </div>
  );
};

export default ParentChildProfile;