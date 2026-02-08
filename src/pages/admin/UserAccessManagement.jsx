// src/pages/admin/UserAccessManagement.jsx

import React, { useState, useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import Sidebar from '../../components/sidebar/Sidebar';
import { getAdminConfig } from '../../components/sidebar/sidebarConfigs';
import GeneralFooter from '../../components/footer/generalfooter';
import userService from '../../services/userService';
import { useStaffWithPermissions } from '../../hooks/useCachedData';
import { QUERY_KEYS } from '../../config/queryClient';
import './css/UserAccessManagement.css';

export default function UserAccessManagement() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const sidebarConfig = getAdminConfig(isSuperAdmin);

  // Local UI state only
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // ============ CACHED HOOK: Reuses data from ManageTeachers/Therapists/Admins ============
  const {
    data: staff = [],
    isLoading: loading,
    error
  } = useStaffWithPermissions(roleFilter || null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper to invalidate all user-related caches
  const invalidateUserCaches = () => {
    // Invalidate staff permissions cache
    queryClient.invalidateQueries({ queryKey: ['staffPermissions'] });
    // Invalidate role-specific caches so ManageTeachers/etc get fresh data
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users('teacher') });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users('therapist') });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users('admin') });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.staff() });
  };

  // Force refresh: remove stale caches so refetch reads from DB
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      // Remove stale role caches so useStaffWithPermissions fetches fresh from DB
      queryClient.removeQueries({ queryKey: QUERY_KEYS.users('teacher') });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.users('therapist') });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.users('admin') });
      queryClient.removeQueries({ queryKey: ['staffPermissions'] });
      // Refetch
      await queryClient.refetchQueries({ queryKey: ['staffPermissions'] });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, isRefreshing]);

  // ============ REACT QUERY: Toggle single permission ============
  const togglePermissionMutation = useMutation({
    mutationFn: ({ userId, currentValue }) =>
      userService.updatePermission(userId, 'canEnrollStudents', !currentValue, currentUser.uid),
    onSuccess: invalidateUserCaches,
    onError: (error) => {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    },
  });

  // ============ REACT QUERY: Bulk update permissions ============
  const bulkUpdateMutation = useMutation({
    mutationFn: ({ userIds, canEnroll }) =>
      userService.bulkUpdateEnrollmentPermission(userIds, canEnroll, currentUser.uid),
    onSuccess: () => {
      setSelectedUsers([]);
      invalidateUserCaches();
    },
    onError: (error) => {
      console.error('Error bulk updating:', error);
      toast.error('Failed to update permissions');
    },
  });

  // Toggle single user permission
  const handleTogglePermission = (userId, currentValue) => {
    togglePermissionMutation.mutate({ userId, currentValue });
  };

  // Bulk update permissions
  const handleBulkUpdate = (canEnroll) => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select users first');
      return;
    }

    const action = canEnroll ? 'grant' : 'revoke';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} enrollment permission for ${selectedUsers.length} user(s)?`)) {
      return;
    }

    bulkUpdateMutation.mutate({ userIds: selectedUsers, canEnroll });
  };

  // Selection handlers
  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter staff by search term - memoized for performance
  const filteredStaff = useMemo(() => {
    return staff.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      return fullName.includes(search) || email.includes(search);
    });
  }, [staff, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredStaff.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredStaff.map(u => u.uid));
    }
  };

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

  // Check if any mutation is in progress
  const actionLoading = togglePermissionMutation.isPending
    ? togglePermissionMutation.variables?.userId
    : bulkUpdateMutation.isPending
      ? 'bulk'
      : null;

  return (
    <div className="uam-container">
      <Sidebar {...sidebarConfig} />

      <main className="uam-main">
        <div className="uam-page">
          {/* Page Header */}
          <div className="uam-header">
            <h1>User Access Management</h1>
            <p>Control staff permissions and feature access across the system</p>
          </div>

          {/* Permission Card */}
          <div className="uam-card">
            <div className="uam-card-header">
              <div className="uam-card-title">
                <span className="uam-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </span>
                <div>
                  <h2>Student Enrollment Permission</h2>
                  <p>Control which staff members can enroll new students into the system</p>
                </div>
              </div>
              <div className="uam-refresh-group">
                <span className="uam-refresh-hint">Not seeing updates? Click refresh</span>
                <button
                  className="uam-refresh-btn"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh staff list"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isRefreshing ? 'uam-refresh-spin' : ''}
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filters & Controls */}
            <div className="uam-controls">
              <div className="uam-filters">
                {/* Search Input */}
                <div className="uam-search-box">
                  <span className="uam-search-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.3-4.3"/>
                    </svg>
                  </span>
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
                      x
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
                    {actionLoading === 'bulk' ? '...' : 'Grant All'}
                  </button>
                  <button
                    className="uam-btn-revoke"
                    onClick={() => handleBulkUpdate(false)}
                    disabled={actionLoading === 'bulk'}
                  >
                    {actionLoading === 'bulk' ? '...' : 'Revoke All'}
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
            ) : error ? (
              <div className="uam-empty">
                <span className="uam-empty-icon">!</span>
                <p>Error loading staff: {error.message}</p>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="uam-empty">
                <span className="uam-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </span>
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
                            {user.canEnrollStudents ? 'Yes' : 'No'}
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
            <div className="uam-info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
            </div>
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
