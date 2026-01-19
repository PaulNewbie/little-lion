import React, { useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

/**
 * Admin utility to delete old students without serviceEnrollments
 * Access at: /admin/cleanup-students
 */
const CleanupOldStudents = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [oldStudents, setOldStudents] = useState([]);
  const [scanned, setScanned] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [log, setLog] = useState([]);

  // Only allow super_admin
  if (currentUser?.role !== 'super_admin') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Access Denied</h1>
          <p>Only super admins can access this utility.</p>
          <button style={styles.btn} onClick={() => navigate('/admin/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const addLog = (message) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const scanForOldStudents = async () => {
    setLoading(true);
    setLog([]);
    addLog('Scanning children collection...');

    try {
      const childrenRef = collection(db, 'children');
      const snapshot = await getDocs(childrenRef);

      const old = [];
      const newModel = [];

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const hasServiceEnrollments = data.serviceEnrollments && data.serviceEnrollments.length > 0;

        if (!hasServiceEnrollments) {
          old.push({
            id: docSnap.id,
            firstName: data.firstName || 'Unknown',
            lastName: data.lastName || 'Unknown',
            hasOneOnOne: !!(data.oneOnOneServices?.length),
            hasGroupClass: !!(data.groupClassServices?.length),
          });
        } else {
          newModel.push(docSnap.id);
        }
      });

      setOldStudents(old);
      setScanned(true);
      addLog(`Found ${snapshot.docs.length} total students`);
      addLog(`${newModel.length} students use new serviceEnrollments model`);
      addLog(`${old.length} students use old model (candidates for deletion)`);

    } catch (error) {
      addLog(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteOldStudents = async () => {
    if (!window.confirm(`Are you sure you want to delete ${oldStudents.length} old students? This cannot be undone!`)) {
      return;
    }

    setLoading(true);
    addLog('Starting deletion...');

    try {
      for (const student of oldStudents) {
        await deleteDoc(doc(db, 'children', student.id));
        addLog(`Deleted: ${student.firstName} ${student.lastName} (${student.id})`);
      }

      setDeleted(true);
      addLog(`Successfully deleted ${oldStudents.length} old students!`);
      setOldStudents([]);

    } catch (error) {
      addLog(`Error during deletion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Cleanup Old Students</h1>
        <p style={styles.description}>
          This utility finds and deletes students that use the old data model
          (oneOnOneServices / groupClassServices) instead of the new serviceEnrollments model.
        </p>

        <div style={styles.actions}>
          {!scanned && (
            <button
              style={styles.btn}
              onClick={scanForOldStudents}
              disabled={loading}
            >
              {loading ? 'Scanning...' : 'Scan for Old Students'}
            </button>
          )}

          {scanned && oldStudents.length > 0 && !deleted && (
            <button
              style={styles.btnDanger}
              onClick={deleteOldStudents}
              disabled={loading}
            >
              {loading ? 'Deleting...' : `Delete ${oldStudents.length} Old Students`}
            </button>
          )}

          {scanned && (
            <button
              style={styles.btnSecondary}
              onClick={() => {
                setScanned(false);
                setOldStudents([]);
                setDeleted(false);
                setLog([]);
              }}
            >
              Reset
            </button>
          )}

          <button
            style={styles.btnSecondary}
            onClick={() => navigate('/admin/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>

        {/* Old Students List */}
        {oldStudents.length > 0 && (
          <div style={styles.studentList}>
            <h3>Students to Delete ({oldStudents.length})</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Old Data</th>
                </tr>
              </thead>
              <tbody>
                {oldStudents.map(s => (
                  <tr key={s.id}>
                    <td style={styles.td}>{s.firstName} {s.lastName}</td>
                    <td style={styles.td}><code>{s.id}</code></td>
                    <td style={styles.td}>
                      {s.hasOneOnOne && 'oneOnOne '}
                      {s.hasGroupClass && 'groupClass'}
                      {!s.hasOneOnOne && !s.hasGroupClass && 'empty'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Log Output */}
        {log.length > 0 && (
          <div style={styles.logContainer}>
            <h3>Log</h3>
            <pre style={styles.log}>
              {log.join('\n')}
            </pre>
          </div>
        )}

        {deleted && (
          <div style={styles.success}>
            Cleanup complete! All old students have been deleted.
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '800px',
    width: '100%',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 16px',
    color: '#1a1a2e',
    fontSize: '24px',
  },
  description: {
    color: '#666',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '24px',
  },
  btn: {
    background: '#0066cc',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  btnDanger: {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  btnSecondary: {
    background: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  studentList: {
    marginTop: '24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    background: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontSize: '12px',
    textTransform: 'uppercase',
    color: '#666',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px',
  },
  logContainer: {
    marginTop: '24px',
  },
  log: {
    background: '#1a1a2e',
    color: '#00ff00',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    maxHeight: '300px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
  },
  success: {
    background: '#d4edda',
    color: '#155724',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '24px',
    fontWeight: '600',
  },
};

export default CleanupOldStudents;
