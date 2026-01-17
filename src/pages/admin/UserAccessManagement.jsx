// src/pages/admin/UserAccessManagement.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/sidebar/Sidebar';
import { getAdminConfig } from '../../components/sidebar/sidebarConfigs';
import GeneralFooter from '../../components/footer/generalfooter';
import userService from '../../services/userService';
import './css/UserAccessManagement.css';

export default function UserAccessManagement() {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const sidebarConfig = getAdminConfig(isSuperAdmin);

  // State
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch staff on mount and when filter changes
  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await userService.getStaffWithPermissions(roleFilter || null);
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle single user permission
  const handleTogglePermission = async (userId, currentValue) => {
    setActionLoading(userId);
    try {
      await userService.updatePermission(
        userId,
        'canEnrollStudents',
        !currentValue,
        currentUser.uid
      );
      await fetchStaff();
    } catch (error) {
      console.error('Error updating permission:', error);
      alert('Failed to update permission');
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk update permissions
  const handleBulkUpdate = async (canEnroll) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    const action = canEnroll ? 'grant' : 'revoke';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} enrollment permission for ${selectedUsers.length} user(s)?`)) {
      return;
    }

    setActionLoading('bulk');
    try {
      await userService.bulkUpdateEnrollmentPermission(
        selectedUsers,
        canEnroll,
        currentUser.uid
      );
      setSelectedUsers([]);
      await fetchStaff();
    } catch (error) {
      console.error('Error bulk updating:', error);
      alert('Failed to update permissions');
    } finally {
      setActionLoading(null);
    }
  };

  // Selection handlers
  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredStaff.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredStaff.map(u => u.uid));
    }
  };

  // Filter staff by search term
  const filteredStaff = staff.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  // Get role display badge class
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'uam-role-badge uam-role-admin';
      case 'teacher': return 'uam-role-badge uam-role-teacher';
      case 'therapist': return 'uam-role-badge uam-role-therapist';
      default: return 'uam-role-badge';
    }
  };

  // Get account status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'uam-status-badge uam-status-active';
      case 'pending_setup': return 'uam-status-badge uam-status-pending';
      case 'inactive': return 'uam-status-badge uam-status-inactive';
      default: return 'uam-status-badge uam-status-active';
    }
  };

  return (
    <div className="uam-container">
      <Sidebar {...sidebarConfig} />

      <main className="uam-main">
        <div className="uam-page">
          {/* Page Header */}
          <div className="uam-header">
            <h1>🔐 User Access Management</h1>
            <p>Control staff permissions and feature access across the system</p>
          </div>

          {/* Permission Card */}
          <div className="uam-card">
            <div className="uam-card-header">
              <div className="uam-card-title">
                <span className="uam-card-icon">📝</span>
                <div>
                  <h2>Student Enrollment Permission</h2>
                  <p>Control which staff members can enroll new students into the system</p>
                </div>
              </div>
            </div>

            {/* Filters & Controls */}
            <div className="uam-controls">
              <div className="uam-filters">
                {/* Search Input */}
                <div className="uam-search-box">
                  <span className="uam-search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      className="uam-clear-search"
                      onClick={() => setSearchTerm('')}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="uam-role-filter"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="teacher">Teachers</option>
                  <option value="therapist">Therapists</option>
                </select>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.length > 0 && (
                <div className="uam-bulk-actions">
                  <span className="uam-selected-count">
                    {selectedUsers.length} selected
                  </span>
                  <button
                    className="uam-btn-grant"
                    onClick={() => handleBulkUpdate(true)}
                    disabled={actionLoading === 'bulk'}
                  >
                    {actionLoading === 'bulk' ? '...' : '✓ Grant All'}
                  </button>
                  <button
                    className="uam-btn-revoke"
                    onClick={() => handleBulkUpdate(false)}
                    disabled={actionLoading === 'bulk'}
                  >
                    {actionLoading === 'bulk' ? '...' : '✕ Revoke All'}
                  </button>
                </div>
              )}
            </div>

            {/* Staff Table */}
            {loading ? (
              <div className="uam-loading">
                <div className="uam-spinner"></div>
                <p>Loading staff members...</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="uam-empty">
                <span className="uam-empty-icon">👥</span>
                <p>No staff members found</p>
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')}>
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="uam-table-wrapper">
                <table className="uam-table">
                  <thead>
                    <tr>
                      <th className="uam-col-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredStaff.length && filteredStaff.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="uam-col-name">Staff Member</th>
                      <th className="uam-col-role">Role</th>
                      <th className="uam-col-status">Account Status</th>
                      <th className="uam-col-permission">Can Enroll</th>
                      <th className="uam-col-action">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map(user => (
                      <tr 
                        key={user.uid}
                        className={selectedUsers.includes(user.uid) ? 'selected' : ''}
                      >
                        <td className="uam-col-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.uid)}
                            onChange={() => toggleSelectUser(user.uid)}
                          />
                        </td>
                        <td className="uam-col-name">
                          <div className="uam-user-info">
                            <div className="uam-user-avatar">
                              {user.firstName?.charAt(0) || '?'}{user.lastName?.charAt(0) || ''}
                            </div>
                            <div className="uam-user-details">
                              <span className="uam-user-name">
                                {user.firstName} {user.lastName}
                              </span>
                              <span className="uam-user-email">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="uam-col-role">
                          <span className={getRoleBadgeClass(user.role)}>
                            {user.role}
                          </span>
                        </td>
                        <td className="uam-col-status">
                          <span className={getStatusBadgeClass(user.accountStatus)}>
                            {user.accountStatus === 'pending_setup' 
                              ? 'Pending' 
                              : user.accountStatus || 'Active'}
                          </span>
                        </td>
                        <td className="uam-col-permission">
                          <span className={`uam-permission-badge ${user.canEnrollStudents ? 'granted' : 'denied'}`}>
                            {user.canEnrollStudents ? '✓ Yes' : '✕ No'}
                          </span>
                        </td>
                        <td className="uam-col-action">
                          <button
                            className={`uam-action-btn ${user.canEnrollStudents ? 'revoke' : 'grant'}`}
                            onClick={() => handleTogglePermission(user.uid, user.canEnrollStudents)}
                            disabled={actionLoading === user.uid || user.accountStatus === 'inactive'}
                            title={user.accountStatus === 'inactive' ? 'Cannot modify inactive accounts' : ''}
                          >
                            {actionLoading === user.uid
                              ? 'Updating...'
                              : user.canEnrollStudents ? 'Revoke' : 'Grant'
                            }
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary Footer */}
            {!loading && filteredStaff.length > 0 && (
              <div className="uam-table-footer">
                <span>
                  Showing {filteredStaff.length} of {staff.length} staff members
                </span>
                <span className="uam-divider">|</span>
                <span className="uam-granted-count">
                  {filteredStaff.filter(u => u.canEnrollStudents).length} with enrollment access
                </span>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="uam-info-box">
            <div className="uam-info-icon">💡</div>
            <div className="uam-info-content">
              <strong>About Enrollment Permission</strong>
              <p>
                Staff members with this permission can create new parent accounts and enroll students. 
                Super Admins always have full access regardless of permission settings.
                Changes take effect immediately after granting or revoking access.
              </p>
            </div>
          </div>
        </div>

        <GeneralFooter />
      </main>
    </div>
  );
}