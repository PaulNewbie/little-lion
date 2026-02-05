import React, { useState, useRef } from 'react';
import cloudinaryService from '../../../../services/cloudinaryService';
import childService from '../../../../services/childService';

/**
 * PDF Icon SVG
 */
const PdfIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 15H15" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9 18H12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/**
 * Upload Icon SVG
 */
const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * Trash Icon SVG
 */
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * Download Icon SVG
 */
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * Generate unique ID for reports
 */
const generateReportId = () => {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format date for display
 */
const formatDate = (dateStr) => {
  if (!dateStr) return 'Unknown date';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * AdditionalReportsPanel - Displays and manages additional PDF reports for a student
 * Admin-only upload functionality
 */
const AdditionalReportsPanel = ({
  childId,
  reports = [],
  isAdmin = false,
  currentUser,
  onReportsChange
}) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Max file size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile || !childId) return;

    setUploading(true);
    setError(null);

    try {
      // 1. Upload to Cloudinary
      const fileUrl = await cloudinaryService.uploadFile(
        selectedFile,
        `little-lions/children/${childId}/reports`
      );

      // 2. Create report metadata
      const reportData = {
        id: generateReportId(),
        fileName: selectedFile.name,
        fileUrl: fileUrl,
        description: description.trim() || null,
        uploadedBy: {
          uid: currentUser?.uid,
          name: currentUser?.firstName
            ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
            : currentUser?.email || 'Admin'
        }
      };

      // 3. Save to Firestore
      await childService.addAdditionalReport(childId, reportData);

      // 4. Update local state
      if (onReportsChange) {
        onReportsChange([...reports, { ...reportData, uploadedAt: new Date().toISOString() }]);
      }

      // 5. Reset form
      setShowUploadModal(false);
      setSelectedFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload report. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm(`Are you sure you want to delete "${report.fileName}"?`)) {
      return;
    }

    setDeleting(report.id);
    setError(null);

    try {
      await childService.removeAdditionalReport(childId, report);

      if (onReportsChange) {
        onReportsChange(reports.filter(r => r.id !== report.id));
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete report. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setDescription('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="additional-reports-panel">
      <div className="reports-header">
        <h3 className="reports-title">Additional Reports</h3>
        {isAdmin && (
          <label className="upload-btn">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            <span className="upload-btn-content">
              <UploadIcon />
              Upload PDF
            </span>
          </label>
        )}
      </div>

      {error && (
        <div className="reports-error">
          {error}
          <button onClick={() => setError(null)} className="error-dismiss">×</button>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="reports-empty">
          <PdfIcon />
          <p>No additional reports uploaded yet</p>
          {isAdmin && <span>Click "Upload PDF" to add assessment reports</span>}
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-icon">
                <PdfIcon />
              </div>
              <div className="report-info">
                <h4 className="report-filename" title={report.fileName}>
                  {report.fileName}
                </h4>
                {report.description && (
                  <p className="report-description">{report.description}</p>
                )}
                <div className="report-meta">
                  <span className="report-date">{formatDate(report.uploadedAt)}</span>
                  {report.uploadedBy?.name && (
                    <span className="report-uploader">by {report.uploadedBy.name}</span>
                  )}
                </div>
              </div>
              <div className="report-actions">
                <a
                  href={report.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="report-action-btn view-btn"
                  title="View PDF"
                >
                  <DownloadIcon />
                </a>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(report)}
                    disabled={deleting === report.id}
                    className="report-action-btn delete-btn"
                    title="Delete report"
                  >
                    {deleting === report.id ? (
                      <span className="spinner-small" />
                    ) : (
                      <TrashIcon />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="upload-modal-overlay" onClick={handleCancelUpload}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Upload Additional Report</h3>

            <div className="upload-file-preview">
              <PdfIcon />
              <span>{selectedFile?.name}</span>
              <span className="file-size">
                ({(selectedFile?.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>

            <div className="upload-form-group">
              <label htmlFor="report-description">Description (optional)</label>
              <input
                id="report-description"
                type="text"
                placeholder="e.g., Occupational Therapy Evaluation 2024"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="upload-modal-actions">
              <button
                onClick={handleCancelUpload}
                disabled={uploading}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="confirm-btn"
              >
                {uploading ? 'Uploading...' : 'Upload Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdditionalReportsPanel;
