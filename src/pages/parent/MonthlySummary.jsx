// src/pages/parent/MonthlySummary.jsx
// Monthly Summary Dashboard for Parents

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { useChildrenByParent } from '../../hooks/useCachedData';
import Sidebar from '../../components/sidebar/Sidebar';
import { getParentConfig } from '../../components/sidebar/sidebarConfigs';
import GeneralFooter from '../../components/footer/generalfooter';
import summaryService from '../../services/summaryService';

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh'
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    overflow: 'auto'
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
    marginBottom: '4px',
    color: '#1a1a1a'
  },
  subtitle: {
    color: '#666',
    fontSize: '14px'
  },
  controls: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    minWidth: '180px'
  },
  generateBtn: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '20px',
    marginBottom: '20px'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    border: '1px solid #e2e8f0'
  },
  statIcon: {
    fontSize: '28px',
    marginBottom: '8px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '8px'
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease'
  },
  breakdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '12px'
  },
  breakdownItem: {
    backgroundColor: '#f1f5f9',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  breakdownValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#0052A1'
  },
  breakdownLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px'
  },
  noteCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '12px',
    borderLeft: '4px solid #10b981'
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '12px',
    color: '#64748b'
  },
  noteText: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.5'
  },
  recommendationCard: {
    backgroundColor: '#fffbeb',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '12px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },
  recommendationPositive: {
    backgroundColor: '#ecfdf5'
  },
  recommendationIcon: {
    fontSize: '24px',
    flexShrink: 0
  },
  recommendationContent: {
    flex: 1
  },
  recommendationTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#374151'
  },
  recommendationText: {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.4'
  },
  highlightBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    margin: '4px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#64748b'
  },
  moodGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '12px',
    marginBottom: '16px'
  },
  moodItem: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.2s ease'
  },
  moodEmoji: {
    fontSize: '32px',
    marginBottom: '8px'
  },
  moodCount: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1a1a1a'
  },
  moodLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px'
  },
  moodPercentage: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  moodTrendBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '16px'
  },
  moodTrendPositive: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  moodTrendNeutral: {
    backgroundColor: '#f3f4f6',
    color: '#374151'
  },
  moodTrendAttention: {
    backgroundColor: '#fef3c7',
    color: '#92400e'
  },
  // Photo Gallery Styles
  photoGallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px'
  },
  photoItem: {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    aspectRatio: '1',
    cursor: 'pointer',
    border: '1px solid #e2e8f0'
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.2s ease'
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
    padding: '8px',
    color: 'white'
  },
  photoDate: {
    fontSize: '11px',
    opacity: 0.9
  },
  photoTitle: {
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  // Print/Export Styles
  printBtn: {
    padding: '10px 20px',
    backgroundColor: '#0052A1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  exportBtnGroup: {
    display: 'flex',
    gap: '8px',
    marginLeft: 'auto'
  },
  noPrint: {
    // Elements with this class hidden when printing
  }
};

const StatCard = ({ icon, value, label, color = '#10b981', showProgress, progressValue }) => (
  <div style={styles.statCard}>
    <div style={styles.statIcon}>{icon}</div>
    <div style={{ ...styles.statValue, color }}>{value}</div>
    <div style={styles.statLabel}>{label}</div>
    {showProgress && (
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${progressValue}%`,
            backgroundColor: color
          }}
        />
      </div>
    )}
  </div>
);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const getMoodTrendStyle = (trend) => {
  switch (trend) {
    case 'positive':
      return { ...styles.moodTrendBadge, ...styles.moodTrendPositive };
    case 'needs_attention':
      return { ...styles.moodTrendBadge, ...styles.moodTrendAttention };
    default:
      return { ...styles.moodTrendBadge, ...styles.moodTrendNeutral };
  }
};

const getMoodTrendLabel = (trend) => {
  switch (trend) {
    case 'positive':
      return { icon: '😊', text: 'Positive Overall' };
    case 'needs_attention':
      return { icon: '💭', text: 'Needs Attention' };
    default:
      return { icon: '😐', text: 'Balanced' };
  }
};

const MoodCard = ({ moodData }) => {
  if (!moodData || moodData.totalReactions === 0) {
    return (
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>😊</span> Student Reactions
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
          No mood data recorded this month
        </div>
      </div>
    );
  }

  const trendInfo = getMoodTrendLabel(moodData.overallTrend);

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>
        <span>😊</span> Student Reactions
      </div>

      {/* Overall Trend Badge */}
      <div style={{ textAlign: 'center' }}>
        <span style={getMoodTrendStyle(moodData.overallTrend)}>
          {trendInfo.icon} {trendInfo.text}
        </span>
      </div>

      {/* Mood Distribution Grid */}
      <div style={styles.moodGrid}>
        {moodData.moodStats.map((mood) => (
          <div
            key={mood.mood}
            style={{
              ...styles.moodItem,
              borderColor: mood.category === 'positive' ? '#10b981' :
                          mood.category === 'concern' ? '#f59e0b' : '#e2e8f0'
            }}
          >
            <div style={styles.moodEmoji}>{mood.emoji}</div>
            <div style={styles.moodCount}>{mood.count}</div>
            <div style={styles.moodLabel}>{mood.mood}</div>
            <div style={styles.moodPercentage}>{mood.percentage}%</div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        padding: '12px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        marginTop: '8px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981' }}>
            {moodData.positiveCount}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Positive</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#f59e0b' }}>
            {moodData.concernCount}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Concern</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280' }}>
            {moodData.totalReactions}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Total</div>
        </div>
      </div>
    </div>
  );
};

const PhotoGallery = ({ photos }) => {
  if (!photos || photos.length === 0) {
    return null;
  }

  const formatPhotoDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={styles.card} className="photo-gallery-card">
      <div style={styles.cardTitle}>
        <span>📸</span> Activity Photos ({photos.length})
      </div>
      <div style={styles.photoGallery}>
        {photos.map((photo, index) => (
          <div
            key={`${photo.activityId}-${photo.index}-${index}`}
            style={styles.photoItem}
            onClick={() => window.open(photo.url, '_blank')}
          >
            <img
              src={photo.url}
              alt={photo.title}
              style={styles.photoImage}
              loading="lazy"
            />
            <div style={styles.photoOverlay}>
              <div style={styles.photoDate}>{formatPhotoDate(photo.date)}</div>
              <div style={styles.photoTitle}>{photo.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Print Icon SVG
const PrintIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect x="6" y="14" width="12" height="8"></rect>
  </svg>
);

export default function MonthlySummary() {
  const { currentUser } = useAuth();
  const toast = useToast();
  const printRef = useRef(null);

  // Use cached children data - prevents re-fetching across parent pages
  const { data: childrenData, isLoading: childrenLoading } = useChildrenByParent(currentUser?.uid);

  // Ensure children is always an array (handles null/undefined/object responses)
  const children = Array.isArray(childrenData) ? childrenData : [];

  const [selectedChild, setSelectedChild] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set default selected child when children data loads
  useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChild]);

  // Print/Export handler
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.warning('Please allow popups to print the report');
      return;
    }

    // Build print document with styles
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${summary.childName} - Monthly Summary ${summary.period.monthName} ${summary.period.year}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            color: #1a1a1a;
            line-height: 1.5;
          }
          .report-header {
            text-align: center;
            padding: 20px;
            background: #0052A1;
            color: white;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .report-header h1 { font-size: 24px; margin-bottom: 4px; }
          .report-header p { opacity: 0.9; }
          .card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            page-break-inside: avoid;
          }
          .card-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .stat-item {
            text-align: center;
            padding: 12px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .stat-value { font-size: 24px; font-weight: 700; }
          .stat-label { font-size: 11px; color: #64748b; }
          .mood-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 8px;
          }
          .mood-item {
            text-align: center;
            padding: 8px;
            background: #f8fafc;
            border-radius: 6px;
          }
          .photo-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .photo-item {
            aspect-ratio: 1;
            border-radius: 6px;
            overflow: hidden;
          }
          .photo-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .note-card {
            background: #f8fafc;
            border-left: 3px solid #10b981;
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 0 6px 6px 0;
          }
          .note-header { font-size: 11px; color: #64748b; margin-bottom: 4px; }
          .note-text { font-size: 13px; }
          .recommendation {
            display: flex;
            gap: 10px;
            padding: 10px;
            background: #fffbeb;
            border-radius: 6px;
            margin-bottom: 8px;
          }
          .recommendation.positive { background: #ecfdf5; }
          .rec-icon { font-size: 20px; }
          .rec-title { font-weight: 600; font-size: 13px; }
          .rec-text { font-size: 12px; color: #6b7280; }
          .footer {
            text-align: center;
            color: #9ca3af;
            font-size: 11px;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
          }
          @media print {
            body { padding: 0; }
            .card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <div class="footer">
          Report generated on ${new Date().toLocaleString()} | Little Lions SPED School
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for images to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  // Generate summary
  const handleGenerateSummary = async () => {
    if (!selectedChild) return;

    setLoading(true);
    setSummary(null);

    try {
      // Check for cached summary first
      let summaryData = await summaryService.getSavedSummary(
        selectedChild,
        selectedMonth,
        selectedYear
      );

      // Generate fresh if not cached
      if (!summaryData) {
        summaryData = await summaryService.generateMonthlySummary(
          selectedChild,
          selectedMonth,
          selectedYear
        );
        // Optionally save for caching
        // await summaryService.saveSummary(summaryData);
      }

      setSummary(summaryData);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  // Get month options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get year options (current year and previous 2)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const getProgressColor = (rate) => {
    if (rate >= 80) return '#10b981';
    if (rate >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={styles.layout}>
      <Sidebar {...getParentConfig()} forceActive="/parent/summary" />

      <div style={styles.mainWrapper}>
        <main style={styles.main}>
        <div style={styles.header}>
          <h1 style={styles.title}>Monthly Summary Report</h1>
          <p style={styles.subtitle}>
            View your child's progress and activity summary
          </p>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <select
            style={styles.select}
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            disabled={childrenLoading}
          >
            {childrenLoading ? (
              <option>Loading children...</option>
            ) : children.length === 0 ? (
              <option>No children found</option>
            ) : (
              children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))
            )}
          </select>

          <select
            style={styles.select}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>

          <select
            style={styles.select}
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <button
            style={{
              ...styles.generateBtn,
              opacity: loading || !selectedChild ? 0.6 : 1
            }}
            onClick={handleGenerateSummary}
            disabled={loading || !selectedChild}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>

          {/* Print/Export Button - only show when summary exists */}
          {summary && (
            <button
              style={styles.printBtn}
              onClick={handlePrint}
            >
              <PrintIcon />
              Print Report
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={styles.loading}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
            <p>Generating summary report...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !summary && (
          <div style={styles.card}>
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <p>Select a child and time period, then click "Generate Report"</p>
            </div>
          </div>
        )}

        {/* Summary Content */}
        {!loading && summary && (
          <div ref={printRef}>
            {/* Period Header */}
            <div style={{ ...styles.card, backgroundColor: '#0052A1', color: 'white' }} className="report-header">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>
                  Summary Report for
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700' }}>
                  {summary.childName}
                </div>
                <div style={{ fontSize: '16px', marginTop: '4px' }}>
                  {summary.period.monthName} {summary.period.year}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={styles.statsGrid}>
              <StatCard
                icon="📚"
                value={summary.stats.totalActivities}
                label="Total Activities"
                color="#0052A1"
              />
              <StatCard
                icon="🩺"
                value={summary.stats.totalTherapySessions}
                label="Therapy Sessions"
                color="#10b981"
              />
              <StatCard
                icon="👥"
                value={summary.stats.totalGroupActivities}
                label="Group Activities"
                color="#8b5cf6"
              />
              <StatCard
                icon="📈"
                value={`${summary.stats.attendanceRate}%`}
                label="Engagement Rate"
                color={getProgressColor(summary.stats.attendanceRate)}
                showProgress
                progressValue={summary.stats.attendanceRate}
              />
            </div>

            {/* Activity Breakdown */}
            {Object.keys(summary.therapyByService).length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>
                  <span>📊</span> Therapy Breakdown by Service
                </div>
                <div style={styles.breakdownGrid}>
                  {Object.entries(summary.therapyByService).map(([service, count]) => (
                    <div key={service} style={styles.breakdownItem}>
                      <div style={styles.breakdownValue}>{count}</div>
                      <div style={styles.breakdownLabel}>{service}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Reactions/Moods */}
            <MoodCard moodData={summary.moodData} />

            {/* Activity Photos */}
            <PhotoGallery photos={summary.activityPhotos} />

            {/* Highlights */}
            {summary.highlights.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>
                  <span>⭐</span> Highlights
                </div>
                <div>
                  {summary.highlights.map((highlight, index) => (
                    <span key={index} style={styles.highlightBadge}>
                      {highlight.text || `${highlight.keyword} in ${highlight.serviceName}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Notes */}
            {summary.progressNotes.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>
                  <span>📝</span> Recent Progress Notes
                </div>
                {summary.progressNotes.map((note, index) => (
                  <div key={index} style={styles.noteCard}>
                    <div style={styles.noteHeader}>
                      <span>{note.serviceName} • {note.therapistName}</span>
                      <span>{formatDate(note.date)}</span>
                    </div>
                    <div style={styles.noteText}>
                      {note.note.length > 200
                        ? `${note.note.substring(0, 200)}...`
                        : note.note}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {summary.recommendations.length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>
                  <span>💡</span> Recommendations
                </div>
                {summary.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.recommendationCard,
                      ...(rec.priority === 'positive' ? styles.recommendationPositive : {})
                    }}
                  >
                    <div style={styles.recommendationIcon}>{rec.icon}</div>
                    <div style={styles.recommendationContent}>
                      <div style={styles.recommendationTitle}>{rec.title}</div>
                      <div style={styles.recommendationText}>{rec.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Generated timestamp */}
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '20px' }}>
              Report generated on {new Date(summary.generatedAt).toLocaleString()}
            </div>
          </div>
        )}
        </main>
        <GeneralFooter pageLabel="Monthly Summary" />
      </div>
    </div>
  );
}
