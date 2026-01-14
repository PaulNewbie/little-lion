// src/pages/admin/PendingAccounts.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from '../../components/sidebar/Sidebar';
import { getAdminConfig } from '../../components/sidebar/sidebarConfigs';
import ActivationModal from '../../components/admin/ActivationModal';
import activationService from '../../services/activationService';

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh'
  },
  main: {
    flex: 1,
    padding: '24px',
    backgroundColor: '#f5f5f5'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  subtitle: {
    color: '#666',
    fontSize: '14px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#6b7280'
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '14px'
  },
  roleBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  expirySoon: {
    color: '#f59e0b',
    fontWeight: '500'
  },
  expiryOk: {
    color: '#6b7280'
  },
  actionBtn: {
    padding: '6px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    marginRight: '8px'
  },
  actionBtnPrimary: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#2563eb',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    marginRight: '8px'
  },
  emptyState: {
    padding: '48px',
    textAlign: 'center',
    color: '#666'
  },
  loading: {
    padding: '48px',
    textAlign: 'center',
    color: '#666'
  },
  filterRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px'
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  },
  refreshBtn: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

const getRoleBadgeStyle = (role) => {
  const colors = {
    parent: { bg: '#dbeafe', color: '#1e40af' },
    teacher: { bg: '#dcfce7', color: '#166534' },
    therapist: { bg: '#fef3c7', color: '#92400e' },
    admin: { bg: '#fce7f3', color: '#9d174d' }
  };
  const c = colors[role] || { bg: '#f3f4f6', color: '#374151' };
  return { ...styles.roleBadge, backgroundColor: c.bg, color: c.color };
};

const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getDaysUntilExpiry = (expiry) => {
  if (!expiry) return 0;
  const diff = expiry - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function PendingAccounts() {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPendingAccounts();
  }, []);

  const fetchPendingAccounts = async () => {
    setLoading(true);
    const pendingUsers = await activationService.getPendingAccounts();
    setUsers(pendingUsers);
    setLoading(false);
  };

  const handleShowQR = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleResendCode = async (user) => {
    if (!window.confirm(`Generate a new activation code for ${user.firstName}?`)) return;
    
    const result = await activationService.regenerateActivationCode(user.uid, user.email);
    if (result.success) {
      // Update local state with new code
      setUsers(prev => prev.map(u => 
        u.uid === user.uid 
          ? { ...u, activationCode: result.newCode, activationExpiry: Date.now() + 14*24*60*60*1000 }
          : u
      ));
      
      // Show the modal with new code
      setSelectedUser({ ...user, activationCode: result.newCode });
      setShowModal(true);
    } else {
      alert('Failed to regenerate code');
    }
  };

  const filteredUsers = roleFilter === 'all' 
    ? users 
    : users.filter(u => u.role === roleFilter);

  return (
    <div style={styles.layout}>
      <Sidebar {...getAdminConfig(isSuperAdmin)} />
      
      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>Pending Account Activations</h1>
          <p style={styles.subtitle}>
            {users.length} account{users.length !== 1 ? 's' : ''} waiting for activation
          </p>
        </div>

        <div style={styles.filterRow}>
          <select 
            style={styles.select}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="parent">Parents</option>
            <option value="teacher">Teachers</option>
            <option value="therapist">Therapists</option>
            <option value="admin">Admins</option>
          </select>
          
          <button style={styles.refreshBtn} onClick={fetchPendingAccounts}>
            🔄 Refresh
          </button>
        </div>

        <div style={styles.card}>
          {loading ? (
            <div style={styles.loading}>Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ fontSize: '48px', marginBottom: '8px' }}>✅</p>
              <p>No pending activations</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Expires</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const daysLeft = getDaysUntilExpiry(user.activationExpiry);
                  const isExpiringSoon = daysLeft <= 3;
                  
                  return (
                    <tr key={user.uid}>
                      <td style={styles.td}>
                        <div>
                          <strong>{user.firstName} {user.lastName}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {user.email}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={getRoleBadgeStyle(user.role)}>
                          {user.role}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <code style={{ fontSize: '13px' }}>
                          {user.activationCode}
                        </code>
                      </td>
                      <td style={styles.td}>
                        {formatDate(user.activationCreatedAt)}
                      </td>
                      <td style={styles.td}>
                        <span style={isExpiringSoon ? styles.expirySoon : styles.expiryOk}>
                          {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                          {isExpiringSoon && daysLeft > 0 && ' ⚠️'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button 
                          style={styles.actionBtnPrimary}
                          onClick={() => handleShowQR(user)}
                        >
                          Show QR
                        </button>
                        <button 
                          style={styles.actionBtn}
                          onClick={() => handleResendCode(user)}
                        >
                          New Code
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      <ActivationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userData={selectedUser}
      />
    </div>
  );
}