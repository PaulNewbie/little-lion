// src/components/staffCredentials/CurrentTeamSection.jsx
// Section for parents to view their child's current staff team

import React, { useState, useEffect } from 'react';
import StaffCredentialsModal from './StaffCredentialsModal';
import userService from '../../services/userService';
import './CurrentTeamSection.css';

/**
 * CurrentTeamSection - Displays current staff team for a student
 * Parents can click on staff cards to view credentials
 *
 * @param {Object} student - Student object with serviceEnrollments array
 *
 * Usage:
 * <CurrentTeamSection student={studentData} />
 */
const CurrentTeamSection = ({ student }) => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStaffData = async () => {
      if (!student?.serviceEnrollments || student.serviceEnrollments.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Extract unique staff IDs from active enrollments
        const activeEnrollments = student.serviceEnrollments.filter(
          enrollment => enrollment.status === 'active' && enrollment.currentStaff
        );

        const uniqueStaffIds = [
          ...new Set(
            activeEnrollments.map(enrollment => enrollment.currentStaff.staffId)
          )
        ].filter(Boolean);

        if (uniqueStaffIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch all staff members
        const staffData = await userService.getStaffByIds(uniqueStaffIds);

        // Enrich staff data with service info from enrollments
        const enrichedStaff = staffData.map(staff => {
          const assignedServices = activeEnrollments
            .filter(e => e.currentStaff.staffId === staff.uid)
            .map(e => ({
              serviceName: e.serviceName,
              serviceType: e.serviceType
            }));

          return {
            ...staff,
            assignedServices
          };
        });

        setStaffMembers(enrichedStaff);
      } catch (error) {
        console.error('Error fetching staff data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, [student]);

  const handleStaffClick = (staff) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStaff(null);
  };

  // Get primary license type for display
  const getPrimaryLicenseType = (staff) => {
    if (!staff) return null;

    // Therapists have licenses[] array
    if (staff.licenses && staff.licenses.length > 0) {
      return staff.licenses[0].licenseType;
    }

    // Teachers have single license fields
    if (staff.licenseType) {
      return staff.licenseType;
    }

    return null;
  };

  if (loading) {
    return (
      <div className="cts-loading">
        <div className="cts-spinner"></div>
        <p>Loading staff team...</p>
      </div>
    );
  }

  if (staffMembers.length === 0) {
    return null; // Don't show section if no staff
  }

  return (
    <div className="cts-container">
      <div className="cts-header">
        <h3 className="cts-title">Your Child's Care Team</h3>
        <p className="cts-subtitle">
          Click on any staff member to view their credentials and qualifications
        </p>
      </div>

      <div className="cts-grid">
        {staffMembers.map((staff) => {
          const primaryLicense = getPrimaryLicenseType(staff);
          const roleDisplay = staff.role === 'therapist' ? 'Therapist' : 'Teacher';
          const initials = `${staff.firstName?.[0] || ''}${staff.lastName?.[0] || ''}`.toUpperCase();

          return (
            <button
              key={staff.uid}
              className="cts-card"
              onClick={() => handleStaffClick(staff)}
              aria-label={`View credentials for ${staff.firstName} ${staff.lastName}`}
            >
              {/* Colored banner */}
              <div className={`cts-card-banner ${staff.role === 'therapist' ? 'cts-card-banner--therapist' : 'cts-card-banner--teacher'}`} />

              <div className="cts-card-avatar-area">
                {/* Avatar overlapping the banner */}
                <div className={`cts-card-avatar ${staff.role === 'therapist' ? 'cts-card-avatar--therapist' : 'cts-card-avatar--teacher'}`}>
                  {staff.profilePhoto ? (
                    <img
                      src={staff.profilePhoto}
                      alt={`${staff.firstName} ${staff.lastName}`}
                      className="cts-card-avatar-img"
                    />
                  ) : (
                    <span className="cts-card-avatar-initials">{initials}</span>
                  )}
                </div>
              </div>

              <div className="cts-card-content">
                <h4 className="cts-card-name">
                  {staff.firstName} {staff.lastName}
                </h4>
                <p className="cts-card-role">{roleDisplay}</p>

                {primaryLicense && (
                  <p className="cts-card-license">{primaryLicense}</p>
                )}

                {staff.assignedServices && staff.assignedServices.length > 0 && (
                  <div className="cts-card-services">
                    {staff.assignedServices.map((service, idx) => (
                      <span key={idx} className="cts-service-tag">
                        {service.serviceName}
                      </span>
                    ))}
                  </div>
                )}

                <div className="cts-card-action">
                  <span>View Credentials</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Credentials Modal */}
      <StaffCredentialsModal
        staff={selectedStaff}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default CurrentTeamSection;
