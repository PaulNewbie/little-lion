import React, { useState } from 'react';
import useManageTherapists from '../../hooks/useManageTherapists';
import AdminSidebar from "../../components/sidebar/AdminSidebar";
import TherapistCard from '../shared/TherapistCard';
import "./css/managetherapist.css";

const ManageTherapists = () => {
  const {
    therapists,
    services,
    loading,
    error,
    newTherapist,
    handleInputChange,
    toggleSpecialization,
    createTherapist,
  } = useManageTherapists();

  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTherapistId, setSelectedTherapistId] = useState(null);

  if (loading) return <div className="pg-loading">Loading therapists...</div>;

  const filteredTherapists = therapists.filter(t =>
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ooo-container">
      <AdminSidebar />

      <div className="ooo-main">
        {/* ================= HEADER ================= */}
        <div className="ooo-header">
          <div className="header-row">
            <div className="header-left">
              {/* Back Button – ONLY shows on Therapist Info */}
              {selectedTherapistId && (
                <span
                  className="back-btn"
                  onClick={() => setSelectedTherapistId(null)}
                >
                  ‹
                </span>
              )}

              {/* Header text with conditional right shift */}
              <div
                className={`header-text ${selectedTherapistId ? 'detail-view-title' : ''}`}
              >
                <h1>
                  {selectedTherapistId
                    ? "THERAPIST PROFILE"
                    : "THERAPIST PROFILES"}
                </h1>

                {!selectedTherapistId && (
                  <p className="header-subtitle">
                    Add and Manage Therapist Accounts
                  </p>
                )}
              </div>
            </div>

            {/* Search – ONLY shows on list view */}
            {!selectedTherapistId && (
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search therapist name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-box">⚠️ Error: {error}</div>}

        {/* ================= CONTENT ================= */}
        <div className="tera-content-area">
          {/* ========== DETAIL VIEW ========== */}
          {selectedTherapistId ? (
            <TherapistCard
              therapistId={selectedTherapistId}
              serviceName="Therapist Profile"
            />
          ) : (
            <>
              {/* ========== LIST VIEW ========== */}
              <h2 className="section-title">Therapist Accounts</h2>

              {filteredTherapists.length === 0 ? (
                <div className="empty-box">
                  <p>
                    {searchQuery
                      ? 'No therapists found matching your search.'
                      : 'No therapists yet. Click the button below to create one.'}
                  </p>
                </div>
              ) : (
                <div className="therapist-grid">
                  {filteredTherapists.map(t => (
                    <div
                      key={t.uid}
                      className={`therapist-card ${
                        !t.profileCompleted ? 'disabled-card' : ''
                      }`}
                      onClick={() => {
                        if (t.profileCompleted) {
                          setSelectedTherapistId(t.uid);
                        } else {
                          alert(
                            "This therapist has not completed their profile yet."
                          );
                        }
                      }}
                    >
                      {/* Avatar */}
                      <div className="avatar">
                        {t.profilePhoto ? (
                          <img src={t.profilePhoto} alt="" />
                        ) : (
                          '👤'
                        )}
                      </div>

                      <h3>{t.firstName} {t.lastName}</h3>

                      <span
                        className={`status-badge ${
                          t.profileCompleted ? 'complete' : 'incomplete'
                        }`}
                      >
                        {t.profileCompleted
                          ? '✅ Profile Active'
                          : '⚠️ Setup Pending'}
                      </span>

                      <div className="specializations">
                        {t.specializations?.length ? (
                          t.specializations.slice(0, 2).map((s, i) => (
                            <span key={i} className="spec-chip">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="no-spec">
                            No specializations
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ================= FAB ================= */}
        <button className="fab" onClick={() => setShowForm(true)}>
          <span>+</span> THERAPIST
        </button>

        {/* NOTE:
            Your ADD THERAPIST FORM (showForm)
            stays untouched and can still be modal if you want.
        */}
      </div>
    </div>
  );
};

export default ManageTherapists;
