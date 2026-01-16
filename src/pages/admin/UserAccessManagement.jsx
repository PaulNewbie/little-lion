// src/pages/admin/UserAccessManagement.jsx

import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import userService from "../../services/userService";
import Sidebar from "../../components/sidebar/Sidebar";
import { getAdminConfig } from "../../components/sidebar/sidebarConfigs";

const styles = {
  layout: {
    display: "flex",
    minHeight: "100vh"
  },
  main: {
    flex: 1,
    padding: "24px",
    backgroundColor: "#f5f5f5"
  },
  header: {
    marginBottom: "24px"
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "4px"
  },
  subtitle: {
    color: "#666",
    fontSize: "14px"
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    color: "#6b7280"
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "14px"
  },
  roleBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500"
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500"
  },
  actionBtn: {
    padding: "6px 12px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "13px",
    marginRight: "8px"
  },
  deactivateBtn: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#ef4444",
    color: "white",
    cursor: "pointer",
    fontSize: "13px"
  },
  reactivateBtn: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#10b981",
    color: "white",
    cursor: "pointer",
    fontSize: "13px"
  },
  emptyState: {
    padding: "48px",
    textAlign: "center",
    color: "#666"
  },
  loading: {
    padding: "48px",
    textAlign: "center",
    color: "#666"
  },
  filterRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
    alignItems: "center"
  },
  select: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px"
  },
  searchInput: {
    padding: "8px 12px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "14px",
    minWidth: "200px",
    flex: 1,
    maxWidth: "300px"
  },
  refreshBtn: {
    padding: "8px 16px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "14px"
  },
  footer: {
    padding: "12px 16px",
    borderTop: "1px solid #e5e7eb",
    fontSize: "13px",
    color: "#666"
  },
  inactiveRow: {
    backgroundColor: "#fef2f2"
  },
  pendingLabel: {
    color: "#92400e",
    fontSize: "12px",
    fontStyle: "italic"
  }
};

const getRoleBadgeStyle = (role) => {
  const colors = {
    parent: { bg: "#dbeafe", color: "#1e40af" },
    teacher: { bg: "#dcfce7", color: "#166534" },
    therapist: { bg: "#fef3c7", color: "#92400e" },
    admin: { bg: "#fce7f3", color: "#9d174d" }
  };
  const c = colors[role] || { bg: "#f3f4f6", color: "#374151" };
  return { ...styles.roleBadge, backgroundColor: c.bg, color: c.color };
};

const getStatusBadgeStyle = (status) => {
  const colors = {
    active: { bg: "#dcfce7", color: "#166534" },
    inactive: { bg: "#fee2e2", color: "#991b1b" },
    pending_setup: { bg: "#fef3c7", color: "#92400e" }
  };
  const c = colors[status] || { bg: "#f3f4f6", color: "#374151" };
  return { ...styles.statusBadge, backgroundColor: c.bg, color: c.color };
};

const getStatusLabel = (status) => {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "pending_setup":
      return "Pending Setup";
    default:
      return status || "Active";
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
};

export default function UserAccessManagement() {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await userService.getAllUsersWithStatus(
        roleFilter || null
      );
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (uid) => {
    if (!window.confirm("Are you sure you want to deactivate this account?")) {
      return;
    }

    setActionLoading(uid);
    try {
      await userService.deactivateUser(uid);
      await fetchUsers();
    } catch (error) {
      console.error("Error deactivating user:", error);
      alert("Failed to deactivate user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (uid) => {
    setActionLoading(uid);
    try {
      await userService.reactivateUser(uid);
      await fetchUsers();
    } catch (error) {
      console.error("Error reactivating user:", error);
      alert("Failed to reactivate user");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const activeCount = filteredUsers.filter(u => u.accountStatus === "active" || !u.accountStatus).length;
  const inactiveCount = filteredUsers.filter(u => u.accountStatus === "inactive").length;
  const pendingCount = filteredUsers.filter(u => u.accountStatus === "pending_setup").length;

  return (
    <div style={styles.layout}>
      <Sidebar {...getAdminConfig(isSuperAdmin)} forceActive="/admin/user-access" />

      <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>User Access Management</h1>
          <p style={styles.subtitle}>
            Manage user account status and access permissions
          </p>
        </div>

        <div style={styles.filterRow}>
          <select
            style={styles.select}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admins</option>
            <option value="teacher">Teachers</option>
            <option value="therapist">Therapists</option>
            <option value="parent">Parents</option>
          </select>

          <input
            type="text"
            placeholder="Search by name or email..."
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            style={styles.refreshBtn}
            onClick={fetchUsers}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div style={styles.card}>
          {loading ? (
            <div style={styles.loading}>Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ fontSize: "48px", marginBottom: "8px" }}>👥</p>
              <p>No users found</p>
            </div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isInactive = user.accountStatus === "inactive";
                    const isPending = user.accountStatus === "pending_setup";
                    const status = user.accountStatus || "active";

                    return (
                      <tr
                        key={user.id}
                        style={isInactive ? styles.inactiveRow : {}}
                      >
                        <td style={styles.td}>
                          <div>
                            <strong>
                              {user.firstName} {user.lastName}
                            </strong>
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {user.email}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={getRoleBadgeStyle(user.role)}>
                            {user.role}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={getStatusBadgeStyle(status)}>
                            {getStatusLabel(status)}
                          </span>
                        </td>
                        <td style={styles.td}>{formatDate(user.createdAt)}</td>
                        <td style={styles.td}>
                          {isInactive ? (
                            <button
                              style={{
                                ...styles.reactivateBtn,
                                opacity: actionLoading === user.id ? 0.6 : 1
                              }}
                              onClick={() => handleReactivate(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? "..." : "Reactivate"}
                            </button>
                          ) : isPending ? (
                            <span style={styles.pendingLabel}>
                              Setup Required
                            </span>
                          ) : (
                            <button
                              style={{
                                ...styles.deactivateBtn,
                                opacity: actionLoading === user.id ? 0.6 : 1
                              }}
                              onClick={() => handleDeactivate(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? "..." : "Deactivate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={styles.footer}>
                Total: {filteredUsers.length} users • {activeCount} active • {inactiveCount} inactive • {pendingCount} pending
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
