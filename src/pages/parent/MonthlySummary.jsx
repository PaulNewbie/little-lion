// src/pages/parent/MonthlySummary.jsx
// Monthly Summary Dashboard for Parents

import React, { useState, useEffect, useRef } from 'react';
import {
  Smile, AlertCircle, MinusCircle, Camera, BarChart3,
  ClipboardList, BookOpen, Stethoscope, Users, TrendingUp,
  Star, FileText, Lightbulb
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import childService from '../../services/childService';
import Sidebar from '../../components/sidebar/Sidebar';
import ImageLightbox from '../../components/common/ImageLightbox';
import { getParentConfig } from '../../components/sidebar/sidebarConfigs';
import GeneralFooter from '../../components/footer/generalfooter';
import summaryService from '../../services/summaryService';
import ChildSelector from '../../components/common/ChildSelector';

import './css/MonthlySummary.css';

const StatCard = ({ icon, value, label, color = '#10b981', showProgress, progressValue }) => (
  <div className="monthly-stat-card">
    <div className="monthly-stat-icon">{icon}</div>
    <div className="monthly-stat-value" style={{ color }}>{value}</div>
    <div className="monthly-stat-label">{label}</div>
    {showProgress && (
      <div className="monthly-progress-bar">
        <div
          className="monthly-progress-fill"
          style={{
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

const getMoodTrendClass = (trend) => {
  switch (trend) {
    case 'positive': return 'monthly-mood-trend--positive';
    case 'needs_attention': return 'monthly-mood-trend--attention';
    default: return 'monthly-mood-trend--neutral';
  }
};

const getMoodTrendLabel = (trend) => {
  switch (trend) {
    case 'positive':
      return { icon: <Smile size={16} />, text: 'Positive Overall' };
    case 'needs_attention':
      return { icon: <AlertCircle size={16} />, text: 'Needs Attention' };
    default:
      return { icon: <MinusCircle size={16} />, text: 'Balanced' };
  }
};

const getMoodItemClass = (category) => {
  if (category === 'positive') return 'monthly-mood-item--positive';
  if (category === 'concern') return 'monthly-mood-item--concern';
  return '';
};

const MoodCard = ({ moodData }) => {
  if (!moodData || moodData.totalReactions === 0) {
    return (
      <div className="monthly-card">
        <div className="monthly-card-title">
          <Smile size={18} /> Student Reactions
        </div>
        <div className="monthly-no-mood-data">
          No mood data recorded this month
        </div>
      </div>
    );
  }

  const trendInfo = getMoodTrendLabel(moodData.overallTrend);

  return (
    <div className="monthly-card">
      <div className="monthly-card-title">
        <Smile size={18} /> Student Reactions
      </div>

      {/* Overall Trend Badge */}
      <div style={{ textAlign: 'center' }}>
        <span className={`monthly-mood-trend-badge ${getMoodTrendClass(moodData.overallTrend)}`}>
          {trendInfo.icon} {trendInfo.text}
        </span>
      </div>

      {/* Mood Distribution Grid */}
      <div className="monthly-mood-grid">
        {moodData.moodStats.map((mood) => (
          <div
            key={mood.mood}
            className={`monthly-mood-item ${getMoodItemClass(mood.category)}`}
          >
            <div className="monthly-mood-emoji">{mood.emoji}</div>
            <div className="monthly-mood-count">{mood.count}</div>
            <div className="monthly-mood-label">{mood.mood}</div>
            <div className="monthly-mood-percentage">{mood.percentage}%</div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="monthly-mood-summary">
        <div className="monthly-mood-summary-item">
          <div className="monthly-mood-summary-value monthly-mood-summary-value--positive">
            {moodData.positiveCount}
          </div>
          <div className="monthly-mood-summary-label">Positive</div>
        </div>
        <div className="monthly-mood-summary-item">
          <div className="monthly-mood-summary-value monthly-mood-summary-value--concern">
            {moodData.concernCount}
          </div>
          <div className="monthly-mood-summary-label">Concern</div>
        </div>
        <div className="monthly-mood-summary-item">
          <div className="monthly-mood-summary-value monthly-mood-summary-value--total">
            {moodData.totalReactions}
          </div>
          <div className="monthly-mood-summary-label">Total</div>
        </div>
      </div>
    </div>
  );
};

const PhotoGallery = ({ photos }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  const photoUrls = photos.map(p => p.url);

  const formatPhotoDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="monthly-card">
      <div className="monthly-card-title">
        <Camera size={18} /> Activity Photos ({photos.length})
      </div>
      <div className="monthly-photo-gallery">
        {photos.map((photo, index) => (
          <div
            key={`${photo.activityId}-${photo.index}-${index}`}
            className="monthly-photo-item"
            onClick={() => setLightboxIndex(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') setLightboxIndex(index); }}
          >
            <img
              src={photo.url}
              alt={photo.title}
              className="monthly-photo-image"
              loading="lazy"
            />
            <div className="monthly-photo-overlay">
              <div className="monthly-photo-date">{formatPhotoDate(photo.date)}</div>
              <div className="monthly-photo-title">{photo.title}</div>
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={photoUrls}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
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

  // Fetch children directly - bypassing cache to fix loading issues
  const [children, setChildren] = useState([]);
  const [childrenLoading, setChildrenLoading] = useState(true);

  useEffect(() => {
    // Reset state when user changes
    setChildren([]);
    setChildrenLoading(true);

    if (!currentUser?.uid) {
      setChildrenLoading(false);
      return;
    }

    let cancelled = false;

    const fetchChildren = async () => {
      try {
        const data = await childService.getChildrenByParentId(currentUser.uid);

        if (cancelled) return;

        // Deduplicate by ID
        const uniqueChildren = data?.length > 0
          ? [...new Map(data.map(child => [child.id, child])).values()]
          : [];

        setChildren(uniqueChildren);
      } catch (error) {
        console.error('Error fetching children:', error);
        if (!cancelled) setChildren([]);
      } finally {
        if (!cancelled) setChildrenLoading(false);
      }
    };

    fetchChildren();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.uid]);

  const [selectedChild, setSelectedChild] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set default selected child when children data loads
  useEffect(() => {
    // Only auto-select if we have children and no selection yet
    if (children.length > 0 && !selectedChild) {
      console.log('Auto-selecting first child:', children[0].id);
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
    <div className="monthly-layout">
      <Sidebar {...getParentConfig()} forceActive="/parent/summary" />

      <div className="monthly-main-wrapper">
        <main className="monthly-main">
        <div className="monthly-header">
          <h1 className="monthly-title">Monthly Summary Report</h1>
          <p className="monthly-subtitle">
            View your child's progress and activity summary
          </p>
        </div>

        {/* Child Selector - Visual card-based */}
        <ChildSelector
          children={children}
          selectedChild={selectedChild}
          onSelect={setSelectedChild}
          isLoading={childrenLoading}
        />

        {/* Controls */}
        <div className="monthly-controls">
          <div className="monthly-control-group">
            <label className="monthly-control-label">Month</label>
            <select
              className="monthly-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className="monthly-control-group">
            <label className="monthly-control-label">Year</label>
            <select
              className="monthly-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            className="monthly-generate-btn"
            onClick={handleGenerateSummary}
            disabled={loading || !selectedChild}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>

          {/* Print/Export Button - only show when summary exists */}
          {summary && (
            <button
              className="monthly-print-btn"
              onClick={handlePrint}
            >
              <PrintIcon />
              Print Report
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="monthly-loading">
            <div className="monthly-loading-icon">
              <BarChart3 size={48} color="#64748b" />
            </div>
            <p>Generating summary report...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !summary && (
          <div className="monthly-card">
            <div className="monthly-empty-state">
              <div className="monthly-empty-icon">
                <ClipboardList size={48} color="#64748b" />
              </div>
              <p>Select a child and time period, then click "Generate Report"</p>
            </div>
          </div>
        )}

        {/* Summary Content */}
        {!loading && summary && (
          <div ref={printRef}>
            {/* Period Header */}
            <div className="monthly-card monthly-report-header">
              <div style={{ textAlign: 'center' }}>
                <div className="monthly-report-label">
                  Summary Report for
                </div>
                <div className="monthly-report-child-name">
                  {summary.childName}
                </div>
                <div className="monthly-report-period">
                  {summary.period.monthName} {summary.period.year}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="monthly-stats-grid">
              <StatCard
                icon={<BookOpen size={28} color="#0052A1" />}
                value={summary.stats.totalActivities}
                label="Total Activities"
                color="#0052A1"
              />
              <StatCard
                icon={<Stethoscope size={28} color="#10b981" />}
                value={summary.stats.totalTherapySessions}
                label="Therapy Sessions"
                color="#10b981"
              />
              <StatCard
                icon={<Users size={28} color="#8b5cf6" />}
                value={summary.stats.totalGroupActivities}
                label="Group Activities"
                color="#8b5cf6"
              />
              <StatCard
                icon={<TrendingUp size={28} color={getProgressColor(summary.stats.attendanceRate)} />}
                value={`${summary.stats.attendanceRate}%`}
                label="Engagement Rate"
                color={getProgressColor(summary.stats.attendanceRate)}
                showProgress
                progressValue={summary.stats.attendanceRate}
              />
            </div>

            {/* Activity Breakdown */}
            {Object.keys(summary.therapyByService).length > 0 && (
              <div className="monthly-card">
                <div className="monthly-card-title">
                  <BarChart3 size={18} /> Therapy Breakdown by Service
                </div>
                <div className="monthly-breakdown-grid">
                  {Object.entries(summary.therapyByService).map(([service, count]) => (
                    <div key={service} className="monthly-breakdown-item">
                      <div className="monthly-breakdown-value">{count}</div>
                      <div className="monthly-breakdown-label">{service}</div>
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
              <div className="monthly-card">
                <div className="monthly-card-title">
                  <Star size={18} /> Highlights
                </div>
                <div>
                  {summary.highlights.map((highlight, index) => (
                    <span key={index} className="monthly-highlight-badge">
                      {highlight.text || `${highlight.keyword} in ${highlight.serviceName}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Notes */}
            {summary.progressNotes.length > 0 && (
              <div className="monthly-card">
                <div className="monthly-card-title">
                  <FileText size={18} /> Recent Progress Notes
                </div>
                {summary.progressNotes.map((note, index) => (
                  <div key={index} className="monthly-note-card">
                    <div className="monthly-note-header">
                      <span>{note.serviceName} • {note.therapistName}</span>
                      <span>{formatDate(note.date)}</span>
                    </div>
                    <div className="monthly-note-text">
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
              <div className="monthly-card">
                <div className="monthly-card-title">
                  <Lightbulb size={18} /> Recommendations
                </div>
                {summary.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`monthly-recommendation${rec.priority === 'positive' ? ' monthly-recommendation--positive' : ''}`}
                  >
                    <div className="monthly-recommendation-icon">{rec.icon}</div>
                    <div className="monthly-recommendation-content">
                      <div className="monthly-recommendation-title">{rec.title}</div>
                      <div className="monthly-recommendation-text">{rec.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Generated timestamp */}
            <div className="monthly-generated-at">
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
