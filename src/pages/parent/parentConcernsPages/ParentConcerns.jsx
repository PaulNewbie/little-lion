import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth'; 
import ParentSidebar from '../../../components/sidebar/ParentSidebar';

// Local components
import { 
  RaiseConcernModal, 
  ConcernsList, 
  ConcernDetail,
  BackButton 
} from './components';

// Local hooks
import { useConcerns } from './hooks';

// Styles
// component-level CSS files are imported in their respective components

/**
 * Parent Concerns Page
 * Allows parents to raise, view, and respond to concerns about their children
 */
const ParentConcerns = () => {
  const { currentUser } = useAuth();
  
  // Concerns data and operations
  const {
    concerns,
    children,
    selectedConcern,
    loading,
    sending,
    createConcern,
    sendReply,
    selectConcern,
    clearSelection
  } = useConcerns(currentUser?.uid);

  // UI state
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'
  const [showNewModal, setShowNewModal] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Handlers
  const handleSelectConcern = (concern) => {
    selectConcern(concern);
    setMobileView('detail');
  };

  const handleBackToList = () => {
    setMobileView('list');
    clearSelection();
  };

  const handleNewConcern = () => {
    setShowNewModal(true);
  };

  const handleCloseModal = () => {
    setShowNewModal(false);
  };

  const handleSubmitConcern = async (formData) => {
    try {
      await createConcern(formData, currentUser);
      setShowNewModal(false);
      setMobileView('list');
    } catch (error) {
      alert("Error creating concern. Please try again.");
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      await sendReply(
        selectedConcern.id,
        replyText,
        { 
          id: currentUser.uid, 
          name: `${currentUser.firstName} ${currentUser.lastName}` 
        }
      );
      setReplyText('');
    } catch (error) {
      alert("Error sending reply. Please try again.");
    }
  };

  // Loading state
  if (loading) {
    return <div className="pc-loading">Loading Concerns...</div>;
  }

  const isDetailVisible = mobileView === 'detail' || selectedConcern;

  return (
    <div className="pc-page-wrapper">
      <ParentSidebar />
      
      <main className="pc-content-container">

        
        {/* New Concern Modal */}
        <RaiseConcernModal
          isOpen={showNewModal}
          onClose={handleCloseModal}
          onSubmit={handleSubmitConcern}
          children={children}
          isSubmitting={sending}
        />

        {/* Concerns List Column */}
        <ConcernsList
          concerns={concerns}
          selectedConcernId={selectedConcern?.id}
          onSelectConcern={handleSelectConcern}
          onNewConcern={handleNewConcern}
          isHidden={mobileView === 'detail'}
        />

        {/* Detail Column */}
        <section className={`pc-detail-column ${isDetailVisible ? 'visible' : ''}`}>
          <BackButton onClick={handleBackToList} />
          
          <ConcernDetail
            concern={selectedConcern}
            currentUserId={currentUser?.uid}
            replyText={replyText}
            onReplyChange={setReplyText}
            onSendReply={handleSendReply}
            isSending={sending}
            onBack={handleBackToList}
            onNewConcern={handleNewConcern}
          />
        </section>

        {/* Mobile Floating Action Button */}
        <button 
          className="pc-mobile-fab" 
          onClick={handleNewConcern}
          aria-label="Compose new concern"
        >
          +
        </button>
      </main>
    </div>
  );
};

export default ParentConcerns;
