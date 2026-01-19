import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import userService from '../../services/userService';

export default function EnrollmentPermissionManager() {
  const { currentUser } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');

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

  const handleBulkUpdate = async (canEnroll) => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }
    
    const action = canEnroll ? 'grant' : 'revoke';
    if (!window.confirm(`${action} enrollment permission for ${selectedUsers.length} users?`)) {
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

  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === staff.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(staff.map(u => u.uid));
    }
  };

  return (
    <div className="permission-manager">
      <div className="header">
        <h2>Enrollment Permissions</h2>
        <p>Control which staff members can enroll new students</p>
      </div>

      <div className="controls">
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Staff</option>
          <option value="admin">Admins</option>
          <option value="teacher">Teachers</option>
          <option value="therapist">Therapists</option>
        </select>

        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedUsers.length} selected</span>
            <button 
              onClick={() => handleBulkUpdate(true)}
              disabled={actionLoading === 'bulk'}
            >
              Grant All
            </button>
            <button 
              onClick={() => handleBulkUpdate(false)}
              disabled={actionLoading === 'bulk'}
            >
              Revoke All
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading staff...</div>
      ) : (
        <table className="permission-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox"
                  checked={selectedUsers.length === staff.length && staff.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Name</th>
              <th>Role</th>
              <th>Account Status</th>
              <th>Can Enroll</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(user => (
              <tr key={user.uid}>
                <td>
                  <input 
                    type="checkbox"
                    checked={selectedUsers.includes(user.uid)}
                    onChange={() => toggleSelectUser(user.uid)}
                  />
                </td>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.role}</td>
                <td>{user.accountStatus || 'active'}</td>
                <td>
                  <span className={`badge ${user.canEnrollStudents ? 'yes' : 'no'}`}>
                    {user.canEnrollStudents ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleTogglePermission(user.uid, user.canEnrollStudents)}
                    disabled={actionLoading === user.uid || user.accountStatus === 'inactive'}
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
      )}
    </div>
  );
}