// Example modification for src/pages/parent/ParentChildProfile.jsx
import React from "react";
import { useParams } from "react-router-dom";
import StudentProfile from "../admin/studentProfile/StudentProfile";
import Sidebar from "../../components/sidebar/Sidebar";
import { getParentConfig } from "../../components/sidebar/sidebarConfigs";
import ParentProfileUploader from "./components/ParentProfileUploader"; // Import the new component

const ParentChildProfile = () => {
  const { childId } = useParams();

  return (
    <div className="sp-container">
      <Sidebar 
        {...getParentConfig()} 
        renderExtraProfile={() => <ParentProfileUploader />} // Pass the uploader here
      />
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