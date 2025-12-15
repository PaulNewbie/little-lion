import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import inquiryService from '../../services/inquiryService';

const ParentInquiries = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);

  useEffect(() => {
    if (currentUser?.uid) {
      inquiryService.getInquiriesByParent(currentUser.uid)
        .then(setInquiries)
        .catch(console.error);
    }
  }, [currentUser]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>My Inquiries</h1>
        <button 
          onClick={() => navigate('/parent/inquiries/new')}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          + New Inquiry
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {inquiries.length === 0 ? <p style={{color: '#888'}}>No inquiries sent yet.</p> : inquiries.map(inq => (
          <div key={inq.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: inq.status === 'answered' ? '5px solid #2ecc71' : '5px solid #f1c40f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{inq.subject}</span>
              <span style={{ 
                fontSize: '12px', 
                padding: '4px 8px', 
                borderRadius: '10px', 
                backgroundColor: inq.status === 'answered' ? '#e8f5e9' : '#fff3e0',
                color: inq.status === 'answered' ? '#2ecc71' : '#f39c12'
              }}>
                {inq.status === 'answered' ? '✓ Answered' : '⏳ Pending'}
              </span>
            </div>
            
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
              To: {inq.targetName} • About: {inq.studentName}
            </p>
            
            <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
              <strong style={{ fontSize: '12px', color: '#999' }}>YOUR QUESTION:</strong>
              <p style={{ margin: '5px 0 0' }}>{inq.message}</p>
            </div>

            {inq.reply && (
              <div style={{ backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '5px', marginTop: '15px' }}>
                <strong style={{ fontSize: '12px', color: '#0d47a1' }}>REPLY FROM {inq.reply.responderName.toUpperCase()}:</strong>
                <p style={{ margin: '5px 0 0', color: '#0d47a1' }}>{inq.reply.message}</p>
                <small style={{ color: '#0d47a1', opacity: 0.7 }}>{new Date(inq.reply.timestamp).toLocaleDateString()}</small>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParentInquiries;