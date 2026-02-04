// src/pages/parent/MonthlySummary.jsx
// Monthly Summary Dashboard for Parents

import React, { useState, useEffect, useRef } from 'react';
import {
  Smile, AlertCircle, MinusCircle, Camera, BarChart3,
  ClipboardList, BookOpen, Stethoscope, Users, TrendingUp,
  Star, FileText, Lightbulb, Focus, Zap, Moon, Frown,
  HandMetal, ShieldAlert, CalendarX, PartyPopper,
  MessageCircle, Rainbow, Dumbbell
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import childService from '../../services/childService';
import Sidebar from '../../components/sidebar/Sidebar';
import ImageLightbox from '../../components/common/ImageLightbox';
import { getParentConfig } from '../../components/sidebar/sidebarConfigs';
import ParentProfileUploader from './components/ParentProfileUploader';
import GeneralFooter from '../../components/footer/generalfooter';
import summaryService from '../../services/summaryService';
import ChildSelector from '../../components/common/ChildSelector';

import './css/MonthlySummary.css';

// Map icon name strings (from summaryService) to Lucide components
const iconMap = {
  Smile, Focus, Zap, Moon, Frown, HandMetal, ShieldAlert,
  CalendarX, BarChart3, Star, Users, PartyPopper, Lightbulb,
  MessageCircle, Rainbow, Dumbbell
};

const renderIcon = (iconName, size = 20, color) => {
  const IconComponent = iconMap[iconName];
  if (!IconComponent) return null;
  return <IconComponent size={size} color={color} />;
};

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
            <div className="monthly-mood-emoji">{renderIcon(mood.icon, 24)}</div>
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

  // Build formal document-style print report
  const buildPrintDocument = () => {
    if (!summary) return '';
    const e = (str) => String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const genDate = new Date(summary.generatedAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    let sectionNum = 0;
    const sec = (title) => `<h2>${++sectionNum}. ${title}</h2>`;

    // 1. Overview table
    const overviewHTML = `
      ${sec('Activity Overview')}
      <table>
        <thead><tr><th>Metric</th><th>Count</th></tr></thead>
        <tbody>
          <tr><td>Total Activities</td><td class="num">${summary.stats.totalActivities}</td></tr>
          <tr><td>Therapy Sessions</td><td class="num">${summary.stats.totalTherapySessions}</td></tr>
          <tr><td>Group Activities</td><td class="num">${summary.stats.totalGroupActivities}</td></tr>
          <tr><td>Engagement Rate</td><td class="num">${summary.stats.attendanceRate}%</td></tr>
        </tbody>
      </table>`;

    // 2. Service breakdown table
    const services = Object.entries(summary.therapyByService || {});
    const breakdownHTML = services.length > 0 ? `
      ${sec('Therapy Breakdown by Service')}
      <table>
        <thead><tr><th>Service</th><th>Sessions</th></tr></thead>
        <tbody>
          ${services.map(([svc, count]) => `<tr><td>${e(svc)}</td><td class="num">${count}</td></tr>`).join('')}
        </tbody>
      </table>` : '';

    // 3. Student reactions
    let moodHTML = '';
    if (summary.moodData && summary.moodData.totalReactions > 0) {
      const trendText = summary.moodData.overallTrend === 'positive' ? 'Positive Overall'
        : summary.moodData.overallTrend === 'needs_attention' ? 'Needs Attention' : 'Balanced';
      moodHTML = `
        ${sec('Student Reactions')}
        <p class="trend">Overall Trend: <strong>${trendText}</strong>
          &nbsp;&mdash;&nbsp; ${summary.moodData.positiveCount} Positive,
          ${summary.moodData.concernCount} Concern,
          ${summary.moodData.totalReactions} Total Reactions
        </p>
        <table>
          <thead><tr><th>Reaction</th><th>Count</th><th>Percentage</th></tr></thead>
          <tbody>
            ${summary.moodData.moodStats.map(m =>
              `<tr><td>${e(m.mood)}</td><td class="num">${m.count}</td><td class="num">${m.percentage}%</td></tr>`
            ).join('')}
          </tbody>
        </table>`;
    }

    // 4. Photos
    const photos = summary.activityPhotos || [];
    const photosHTML = photos.length > 0 ? `
      ${sec('Activity Photos')}
      <p class="sub">${photos.length} photo(s) captured this month.</p>
      <div class="photo-grid">
        ${photos.map(p => `<div class="photo-cell"><img src="${p.url}" alt="${e(p.title)}" /></div>`).join('')}
      </div>` : '';

    // 5. Highlights
    const highlights = summary.highlights || [];
    const highlightsHTML = highlights.length > 0 ? `
      ${sec('Highlights')}
      <ul>
        ${highlights.map(h => `<li>${e(h.text || `${h.keyword} in ${h.serviceName}`)}</li>`).join('')}
      </ul>` : '';

    // 6. Progress notes
    const notes = summary.progressNotes || [];
    const notesHTML = notes.length > 0 ? `
      ${sec('Progress Notes')}
      <table class="notes-table">
        <thead><tr><th>Date</th><th>Service</th><th>Therapist</th><th>Notes</th></tr></thead>
        <tbody>
          ${notes.map(n => `
            <tr>
              <td class="nowrap">${formatDate(n.date)}</td>
              <td class="nowrap">${e(n.serviceName)}</td>
              <td class="nowrap">${e(n.therapistName)}</td>
              <td>${e(n.note.length > 400 ? n.note.substring(0, 400) + '...' : n.note)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>` : '';

    // 7. Recommendations
    const recs = summary.recommendations || [];
    const recsHTML = recs.length > 0 ? `
      ${sec('Recommendations')}
      ${recs.map((r, i) => `
        <div class="rec-block">
          <div class="rec-num">${i + 1}.</div>
          <div>
            <strong>${e(r.title)}</strong>
            <p>${e(r.text)}</p>
          </div>
        </div>
      `).join('')}` : '';

    return { overviewHTML, breakdownHTML, moodHTML, photosHTML, highlightsHTML, notesHTML, recsHTML, genDate, e };
  };

  // Print/Export handler
  const handlePrint = () => {
    if (!summary) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.warning('Please allow popups to print the report');
      return;
    }

    const { overviewHTML, breakdownHTML, moodHTML, photosHTML, highlightsHTML, notesHTML, recsHTML, genDate, e } = buildPrintDocument();

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${summary.childName} - Monthly Summary ${summary.period.monthName} ${summary.period.year}</title>
  <style>
    @page { margin: 20mm 18mm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      color: #1f2937;
      line-height: 1.6;
      background: #fff;
    }

    /* ===== LETTERHEAD ===== */
    .letterhead {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 14px;
      border-bottom: 3px solid #0052A1;
      margin-bottom: 20px;
    }
    .letterhead-left h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0052A1;
      margin: 0;
      letter-spacing: -0.3px;
    }
    .letterhead-left .school-sub {
      font-size: 10px;
      color: #64748b;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .letterhead-right {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .letterhead-right strong { color: #1f2937; }

    /* ===== TITLE BLOCK ===== */
    .title-block {
      text-align: center;
      margin: 18px 0 24px;
      padding: 16px 0;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    .title-block h2 {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .title-block .title-sub {
      font-size: 13px;
      color: #475569;
      margin-top: 4px;
    }

    /* ===== STUDENT INFO ===== */
    .info-row {
      display: flex;
      gap: 32px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .info-item { display: flex; gap: 6px; }
    .info-label { color: #64748b; }
    .info-value { font-weight: 600; color: #1f2937; }

    /* ===== SECTION HEADERS ===== */
    h2 {
      font-size: 14px;
      font-weight: 700;
      color: #0052A1;
      margin: 22px 0 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #FFCB10;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      page-break-after: avoid;
    }

    /* ===== TABLES ===== */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    td {
      padding: 7px 12px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #fafbfc; }
    .num { text-align: center; font-weight: 600; }
    .nowrap { white-space: nowrap; }

    /* ===== TREND ===== */
    .trend {
      font-size: 12px;
      color: #475569;
      margin-bottom: 10px;
    }
    .sub {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 10px;
    }

    /* ===== LISTS ===== */
    ul {
      margin: 0 0 16px 20px;
      font-size: 12px;
    }
    li {
      margin-bottom: 4px;
      line-height: 1.5;
    }

    /* ===== RECOMMENDATIONS ===== */
    .rec-block {
      display: flex;
      gap: 8px;
      margin-bottom: 10px;
      padding: 10px 12px;
      background: #fafbfc;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    .rec-num {
      font-weight: 700;
      color: #0052A1;
      min-width: 18px;
    }
    .rec-block strong { font-size: 12px; color: #1f2937; }
    .rec-block p { font-size: 11px; color: #6b7280; margin-top: 2px; line-height: 1.5; }

    /* ===== PHOTOS ===== */
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .photo-cell {
      aspect-ratio: 1;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }
    .photo-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }

    /* ===== NOTES TABLE ===== */
    .notes-table td:last-child { font-size: 11px; line-height: 1.5; }

    /* ===== FOOTER ===== */
    .doc-footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 2px solid #0052A1;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }

    /* ===== PRINT ===== */
    @media print {
      body { font-size: 11px; }
      h2 { margin-top: 16px; }
      th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tr:nth-child(even) td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .rec-block { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .photo-grid { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- Letterhead -->
  <div class="letterhead">
    <div class="letterhead-left">
      <h1>Little Lions</h1>
      <div class="school-sub">Special Education School</div>
    </div>
    <div class="letterhead-right">
      <div><strong>Date Issued:</strong> ${genDate}</div>
      <div><strong>Report Period:</strong> ${e(summary.period.monthName)} ${summary.period.year}</div>
    </div>
  </div>

  <!-- Title -->
  <div class="title-block">
    <h2 style="border:none;margin:0;padding:0;text-align:center;color:#1f2937">Monthly Progress Report</h2>
    <div class="title-sub">${e(summary.childName)}</div>
  </div>

  <!-- Student Info -->
  <div class="info-row">
    <div class="info-item"><span class="info-label">Student:</span> <span class="info-value">${e(summary.childName)}</span></div>
    <div class="info-item"><span class="info-label">Period:</span> <span class="info-value">${e(summary.period.monthName)} ${summary.period.year}</span></div>
  </div>

  <!-- Report Body -->
  ${overviewHTML}
  ${breakdownHTML}
  ${moodHTML}
  ${highlightsHTML}
  ${notesHTML}
  ${recsHTML}
  ${photosHTML}

  <!-- Footer -->
  <div class="doc-footer">
    <div>Little Lions SPED School &mdash; Confidential Student Report</div>
    <div>Generated: ${new Date().toLocaleString()}</div>
  </div>

</body>
</html>`);

    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => { printWindow.print(); }, 500);
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
      <Sidebar {...getParentConfig()} forceActive="/parent/summary" renderExtraProfile={() => <ParentProfileUploader />} />

      <div className="monthly-main-wrapper">
        <main className="monthly-main">
        <div className="monthly-header">
          <div className="monthly-header-content">
            <h1 className="monthly-title">Monthly Summary Report</h1>
            <p className="monthly-subtitle">
              View your child's progress and activity summary
            </p>
          </div>
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
                    <div className="monthly-recommendation-icon">{renderIcon(rec.icon, 20)}</div>
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
